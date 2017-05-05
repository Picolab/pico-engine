var _ = require("lodash");
var λ = require("contra");
var DB = require("./DB");
var cocb = require("co-callback");
var getArg = require("./getArg");
var runKRL = require("./runKRL");
var Modules = require("./modules");
var PicoQueue = require("./PicoQueue");
var Scheduler = require("./Scheduler");
var krl_stdlib = require("krl-stdlib");
var SymbolTable = require("symbol-table");
var EventEmitter = require("events");
var processEvent = require("./processEvent");
var processQuery = require("./processQuery");

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
    var keys_module_data = {};

    var core = {
        db: db,
        host: host,
        rulesets: rulesets,
        salience_graph: salience_graph,
    };

    var emitter = new EventEmitter();
    var modules = Modules(core);

    var mkCTX = function(ctx){
        ctx.getMyKey = (function(rid){
            //we do it this way so all the keys are not leaked out to other built in modules or rulesets
            return function(id){
                return _.get(keys_module_data, ["used_keys", rid, id]);
            };
        }(ctx.rid));//pass in the rid at mkCTX creation so it is not later mutated

        ctx.modules = modules;
        ctx.KRLClosure = function(fn){
            return function(ctx2, args){
                return fn(mkCTX(_.assign({}, ctx2, {
                    rid: ctx.rid,//keep your original rid
                    scope: ctx.scope.push(),
                })), function(name, index){
                    return getArg(args, name, index);
                });
            };
        };
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
            if(!_.has(log_levels, level)){
                throw new Error("Unsupported log level: " + level);
            }
            //this 'log-' prefix distinguishes user declared log events from other system generated events
            ctx.emit("log-" + level, val);
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

        //don't allow anyone to mutate ctx on the fly
        Object.freeze(ctx);
        return ctx;
    };
    core.mkCTX = mkCTX;

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
                yield runKRL(use["with"], mkCTX({
                    rid: rs.rid,//switch rid
                    scope: ctx2.scope//must share scope
                }));
            }
            if(_.isFunction(dep_rs.global)){
                yield runKRL(dep_rs.global, ctx2);
            }
            rs.modules_used[use.alias] = {
                rid: use.rid,
                scope: ctx2.scope,
                provides: dep_rs.meta.provides
            };
            if(_.has(keys_module_data, ["provided", use.rid, rs.rid])){
                _.set(keys_module_data, [
                    "used_keys",
                    rs.rid,
                ], keys_module_data.provided[use.rid][rs.rid]);
            }
        }
    });

    var registerRuleset = function(rs, loadDepRS, callback){
        cocb.run(initializeRulest(rs, loadDepRS), function(err){
            if(err) return callback(err);

            if(true
                && _.has(rs, "meta.keys")
                && _.has(rs, "meta.provides_keys")
            ){
                _.each(rs.meta.provides_keys, function(p, key){
                    _.each(p.to, function(to_rid){
                        _.set(keys_module_data, [
                            "provided",
                            rs.rid,
                            to_rid,
                            key
                        ], _.cloneDeep(rs.meta.keys[key]));
                    });
                });
            }

            if(_.has(rs, "meta.keys")){
                //"remove" keys so they don't leak out
                //don't use delete b/c it mutates the loaded rs
                rs = _.assign({}, rs, {
                    meta: _.omit(rs.meta, "keys")
                });
            }

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

    core.registerRulesetSrc = function(krl_src, meta_data, callback){
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
                        if(err){
                            db.disableRuleset(rs.rid, _.noop);//undo enable if failed
                        }
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
            processEvent(core, mkCTX({
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
            processQuery(core, mkCTX({
                query: data.query,
                pico_id: pico_id
            }), callback);
        }else{
            callback(new Error("invalid PicoQueue type:" + data.type));
        }
    });

    var signalEvent = function(event_orig, callback){
        //ensure that event is not mutated
        var event = _.cloneDeep(event_orig);//TODO optimize
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

    var runQuery = function(query_orig, callback){
        //ensure that query is not mutated
        var query = _.cloneDeep(query_orig);//TODO optimize
        var emit = mkCTX({query: query}).emit;
        emit("episode_start");
        emit("debug", "query received: " + query.rid + "/" + query.name);

        db.getPicoIDByECI(query.eci, function(err, pico_id){
            if(err) return callback(err);
            var emit = mkCTX({
                query: query,
                pico_id: pico_id,
            }).emit;
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

    core.unregisterRuleset = function(rid, callback){
        db.isRulesetUsed(rid, function(err, is_used){
            if(err) return callback(err);
            if(is_used){
                callback(new Error("Unable to unregisterRuleset: " + rid + " it is used by at least one pico"));
                return;
            }
            db.deleteRuleset(rid, function(err){
                if(err) return callback(err);

                if(_.has(rulesets, rid)){
                    _.each(rulesets[rid].rules, function(rule){
                        _.each(rule.select && rule.select.graph, function(g, domain){
                            _.each(g, function(exprs, type){
                                _.unset(salience_graph, [domain, type, rid]);
                            });
                        });
                    });
                    delete rulesets[rid];
                }

                callback();
            });
        });
    };

    core.scheduler = Scheduler({
        db: db,
        onError: function(err){
            var info = {scheduler: true};
            emitter.emit("error", info, err);
        },
        onEvent: function(info, callback){
            signalEvent(info.event, callback);
        },
        is_test_mode: !!conf.scheduler_is_test_mode,
    });

    registerAllEnabledRulesets(function(err){
        if(err) return callback(err);
        var pe = {
            db: db,
            emitter: emitter,
            registerRuleset: core.registerRulesetSrc,
            unregisterRuleset: core.unregisterRuleset,
            signalEvent: signalEvent,
            runQuery: runQuery
        };
        if(conf.scheduler_is_test_mode){
            pe.scheduler = core.scheduler;
        }
        callback(void 0, pe);
    });
};
