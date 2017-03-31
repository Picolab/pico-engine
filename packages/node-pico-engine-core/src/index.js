var _ = require("lodash");
var λ = require("contra");
var DB = require("./DB");
var cocb = require("co-callback");
var runKRL = require("./runKRL");
var getArg = require("./getArg");
var modules = require("./modules");
var PicoQueue = require("./PicoQueue");
var krl_stdlib = require("krl-stdlib");
var KRLClosure = require("./KRLClosure");
var SymbolTable = require("symbol-table");
var EventEmitter = require("events");
var processEvent = require("./processEvent");
var processQuery = require("./processQuery");

var modulesSync = {
    get: cocb.toYieldable(modules.get),
    set: cocb.toYieldable(modules.set),
};

var log_levels = {
    "info": true,
    "debug": true,
    "warn": true,
    "error": true,
};

module.exports = function(conf, callback){
    var db = DB(conf.db);
    _.each(db, function(val, key){
        if(_.isFunction(val)){
            db[key + "Yieldable"] = cocb.toYieldable(val);
        }
    });
    var host = conf.host;
    var compileAndLoadRuleset = conf.compileAndLoadRuleset;

    var rulesets = {};
    var salience_graph = {};

    var emitter = new EventEmitter();

    var mkCTX = function(ctx){
        ctx.db = db;
        ctx.host = host;
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
        ctx.log = function(level, val){
            var l = _.has(log_levels, level)
                ? level
                : _.head(_.keys(log_levels));
            l = "log-" + l;//this 'log-' prefix distinguishes user declared log events from other system generated events
            ctx.emit(l, val);
        };
        ctx.callKRLstdlib = function(fn_name){
            var args = _.toArray(arguments);
            args[0] = ctx;
            var fn = krl_stdlib[fn_name];
            if(cocb.isGeneratorFunction(fn)){
                return cocb.promiseRun(function*(){
                    return yield fn.apply(void 0, args);
                });
            }
            return new Promise(function(resolve, reject){
                try{
                    resolve(fn.apply(void 0, args));
                }catch(err){
                    reject(err);
                }
            });
        };
        ctx.registerRulesetSrc = registerRulesetSrc;
        return ctx;
    };

    var initializeRulest = cocb.wrap(function*(rs, loadDepRS){
        rs.scope = SymbolTable();
        var ctx = mkCTX({
            rid: rs.rid,
            scope: rs.scope
        });
        if(_.isFunction(rs.meta && rs.meta.configure)){
            yield runKRL(rs.meta.configure, ctx);
        }
        if(_.isFunction(rs.global)){
            yield runKRL(rs.global, ctx);
        }
        rs.modules_used = {};
        var use_array = _.values(rs.meta && rs.meta.use);
        var i, use, dep_rs, ctx2;
        for(i = 0; i < use_array.length; i++){
            use = use_array[i];
            if(use.kind !== "module"){
                throw new Error("Unsupported 'use' kind: " + use.kind);
            }
            dep_rs = loadDepRS(use.rid);
            if(!dep_rs){
                throw new Error("Dependant module not loaded: " + use.rid);
            }
            ctx2 = mkCTX({
                rid: dep_rs.rid,
                scope: SymbolTable()
            });
            if(_.isFunction(dep_rs.meta && dep_rs.meta.configure)){
                yield runKRL(dep_rs.meta.configure, ctx2);
            }
            if(_.isFunction(use["with"])){
                yield runKRL(use["with"], ctx2);
            }
            if(_.isFunction(dep_rs.global)){
                yield runKRL(dep_rs.global, ctx2);
            }
            rs.modules_used[use.alias] = {
                rid: use.rid,
                scope: ctx2.scope,
                provides: dep_rs.meta.provides
            };
        }
    });

    var registerRuleset = function(rs, loadDepRS, callback){
        cocb.run(initializeRulest(rs, loadDepRS), function(err){
            if(err) return callback(err);

            //now setup `salience_graph` and `rulesets`
            _.each(rs.rules, function(rule){
                rule.rid = rs.rid;
                _.each(rule.select && rule.select.graph, function(g, domain){
                    _.each(g, function(exprs, type){
                        _.set(salience_graph, [domain, type, rule.rid, rule.name], true);
                    });
                });
            });
            rulesets[rs.rid] = rs;

            callback();
        });
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
                        signalEvent(o.event);
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

        if(!_.isFunction(callback)){
            //if interal signalEvent or just no callback was given...
            callback = function(err, resp){
                if(err){
                    emit("error", err);
                }else{
                    emit("debug", resp);
                }
            };
        }

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
                λ.each.series(rs_list, function(rs, next){
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
