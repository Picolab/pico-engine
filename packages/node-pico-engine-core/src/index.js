var _ = require("lodash");
var λ = require("contra");
var DB = require("./DB");
var cocb = require("co-callback");
var getArg = require("./getArg");
var Future = require("fibers/future");
var modules = Future.wrap(require("./modules"));
var PicoQueue = require("./PicoQueue");
var krl_stdlib = require("krl-stdlib");
var KRLClosure = require("./KRLClosure");
var SymbolTable = require("symbol-table");
var applyInFiber = require("./applyInFiber");
var EventEmitter = require("events");
var processEvent = require("./processEvent");
var processQuery = require("./processQuery");

var modulesSync = {
    get: function(ctx, domain, id){
        return modules.getFuture(ctx, domain, id).wait();
    },
    set: function(ctx, domain, id, value){
        modules.setFuture(ctx, domain, id, value).wait();
    }
};

module.exports = function(conf, callback){
    var db = DB(conf.db);
    _.each(db, function(val, key){
        if(_.isFunction(val)){
            db[key + "Future"] = Future.wrap(val);
            db[key + "Yieldable"] = cocb.toYieldable(val);
        }
    });
    var compileAndLoadRuleset = conf.compileAndLoadRuleset;

    var rulesets = {};
    var salience_graph = {};

    var emitter = new EventEmitter();

    var mkCTX = function(ctx){
        ctx.db = db;
        ctx.getArg = getArg;
        ctx.signalEvent = signalEvent;
        ctx.modules = modulesSync;
        ctx.rulesets = rulesets;
        ctx.salience_graph = salience_graph;
        ctx.KRLClosure = KRLClosure;
        ctx.emit = function(type, val, message){//for stdlib
            var info = {};
            if(ctx.rid){
                info.rid = ctx.rid;
            }
            if(ctx.pico_id){
                info.pico_id = ctx.pico_id;
            }
            if(ctx.event){
                info.event = {
                    eci: ctx.event.eci,
                    eid: ctx.event.eid,
                    domain: ctx.event.domain,
                    type: ctx.event.type,
                };
                if(!info.eci){
                    info.eci = ctx.event.eci;
                }
            }
            if(ctx.query){
                info.query = {
                    eci: ctx.query.eci,
                    rid: ctx.query.rid,
                    name: ctx.query.name,
                    args: ctx.query.args
                };
                if(!info.rid){
                    info.rid = ctx.query.rid;
                }
                if(!info.eci){
                    info.eci = ctx.query.eci;
                }
            }
            emitter.emit(type, info, val, message);
        };
        ctx.callKRLstdlib = function(fn_name){
            var args = _.toArray(arguments);
            args[0] = ctx;
            return krl_stdlib[fn_name].apply(void 0, args);
        };
        return ctx;
    };

    var registerRulesetInFiber = function(rs, loadDepRS){
        rs.scope = SymbolTable();
        var ctx = mkCTX({
            rid: rs.rid,
            scope: rs.scope
        });
        if(_.isFunction(rs.meta && rs.meta.configure)){
            rs.meta.configure(ctx);
        }
        if(_.isFunction(rs.global)){
            rs.global(ctx);
        }
        rs.modules_used = {};
        _.each(rs.meta && rs.meta.use, function(use){
            if(use.kind !== "module"){
                throw new Error("Unsupported 'use' kind: " + use.kind);
            }
            var dep_rs = loadDepRS(use.rid);
            if(!dep_rs){
                throw new Error("Dependant module not loaded: " + use.rid);
            }
            var ctx = mkCTX({
                rid: dep_rs.rid,
                scope: SymbolTable()//or dep_rs.scope.push() ??? TODO
            });
            if(_.isFunction(dep_rs.meta && dep_rs.meta.configure)){
                dep_rs.meta.configure(ctx);
            }
            if(_.isFunction(use["with"])){
                use["with"](ctx);
            }
            if(_.isFunction(dep_rs.global)){
                dep_rs.global(ctx);
            }
            rs.modules_used[use.alias] = {
                rid: use.rid,
                scope: ctx.scope,
                provides: dep_rs.meta.provides
            };
        });
        _.each(rs.rules, function(rule){
            rule.rid = rs.rid;

            _.each(rule.select && rule.select.graph, function(g, domain){
                _.each(g, function(exprs, type){
                    _.set(salience_graph, [domain, type, rule.rid, rule.name], true);
                });
            });
        });
        rulesets[rs.rid] = rs;
    };

    var registerRuleset = function(rs, loadDepRS, callback){
        applyInFiber(registerRulesetInFiber, null, [rs, loadDepRS], callback);
    };

    var getRulesetForRID = function(rid, callback){
        db.getEnabledRuleset(rid, function(err, data){
            if(err) return callback(err);
            compileAndLoadRuleset({
                rid: rid,
                src: data.src,
                hash: data.hash
            }, function(err, rs){
                if(err){
                    db.disableRuleset(rid, function(){
                        callback(err);
                    });
                    return;
                }
                callback(void 0, rs);
            });
        });
    };

    var registerRulesetSrc = function(krl_src, meta_data, callback){
        db.storeRuleset(krl_src, meta_data, function(err, hash){
            if(err) return callback(err);
            compileAndLoadRuleset({
                src: krl_src,
                hash: hash
            }, function(err, rs){
                if(err) return callback(err);
                db.enableRuleset(hash, function(err){
                    if(err) return callback(err);
                    registerRuleset(rs, function(rid){
                        return rulesets[rid];
                    }, function(err){
                        callback(err, {
                            rid: rs.rid,
                            hash: hash
                        });
                    });
                });
            });
        });
    };

    var picoQ = PicoQueue(function(pico_id, data, callback){
        if(data.type === "event"){
            var event = data.event;
            event.timestamp = new Date(event.timestamp);//convert from JSON string to date
            processEvent(mkCTX({
                mkCTX: mkCTX,
                event: event,
                pico_id: pico_id
            }), function(err, data){
                if(err) return callback(err);
                if(_.has(data, "event:send")){
                    _.each(data["event:send"], function(o){
                        signalEvent(o.event,callback);
                    });
                    data = _.omit(data, "event:send");
                }
                callback(void 0, data);
            });
        }else if(data.type === "query"){
            processQuery(mkCTX({
                query: data.query,
                pico_id: pico_id
            }), callback);
        }else{
            callback(new Error("invalid PicoQueue type:" + data.type));
        }
    });

    var signalEvent = function(event, callback){
        if(!_.isDate(event.timestamp) || !conf.allow_event_time_override){
            event.timestamp = new Date();
        }

        var emit = mkCTX({event: event}).emit;
        emit("episode_start");
        emit("debug", "event received: " + event.domain + "/" + event.type);

        db.getPicoIDByECI(event.eci, function(err, pico_id){
            if(err) return callback(err);
            picoQ.enqueue(pico_id, {
                type: "event",
                event: event
            }, callback);
            emit("debug", "event added to pico queue: " + pico_id);
        });
    };

    var runQuery = function(query, callback){
        var ctx = mkCTX({query: query});
        var emit = ctx.emit;
        emit("episode_start");
        emit("debug", "query received: " + query.rid + "/" + query.name);

        db.getPicoIDByECI(query.eci, function(err, pico_id){
            if(err) return callback(err);
            ctx.pico_id = pico_id;
            picoQ.enqueue(pico_id, {
                type: "query",
                query: query
            }, function(err, data){
                emit("episode_stop");
                callback(err, data);
            });
            emit("debug", "query added to pico queue: " + pico_id);
        });
    };

    var registerAllEnabledRulesets = function(callback){
        db.getAllEnabledRulesets(function(err, rids){
            if(err)return callback(err);
            λ.map(rids, getRulesetForRID, function(err, rs_list){
                if(err)return callback(err);
                var rs_by_rid = {};
                _.each(rs_list, function(rs){
                    rs_by_rid[rs.rid] = rs;
                });
                var loadDepRS = function(rid){
                    return rs_by_rid[rid];
                };
                λ.each(rs_list, function(rs, next){
                    registerRuleset(rs, loadDepRS, next);
                }, callback);
            });
        });
    };

    registerAllEnabledRulesets(function(err){
        if(err) return callback(err);
        callback(void 0, {
            db: db,
            emitter: emitter,
            registerRuleset: registerRulesetSrc,
            signalEvent: signalEvent,
            runQuery: runQuery
        });
    });
};
