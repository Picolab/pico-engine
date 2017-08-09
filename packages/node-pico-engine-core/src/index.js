var _ = require("lodash");
var DB = require("./DB");
var cocb = require("co-callback");
var cuid = require("cuid");
var async = require("async");
var ktypes = require("krl-stdlib/types");
var getArg = require("./getArg");
var hasArg = require("./hasArg");
var runKRL = require("./runKRL");
var Modules = require("./modules");
var PicoQueue = require("./PicoQueue");
var Scheduler = require("./Scheduler");
var runAction = require("./runAction");
var cleanEvent = require("./cleanEvent");
var krl_stdlib = require("krl-stdlib");
var getKRLByURL = require("./getKRLByURL");
var SymbolTable = require("symbol-table");
var EventEmitter = require("events");
var processEvent = require("./processEvent");
var processQuery = require("./processQuery");
var RulesetRegistry = require("./RulesetRegistry");
var DependencyResolver = require("dependency-resolver");

var applyFn = cocb.wrap(function*(fn, ctx, args){
    if(ktypes.isAction(fn)){
        throw new Error("actions can only be called in the rule action block");
    }
    if( ! ktypes.isFunction(fn)){
        throw new Error("Not a function");
    }
    return yield fn(ctx, args);
});

var log_levels = {
    "info": true,
    "debug": true,
    "warn": true,
    "error": true,
};

module.exports = function(conf){
    var db = DB(conf.db);
    _.each(db, function(val, key){
        if(_.isFunction(val)){
            db[key + "Yieldable"] = cocb.toYieldable(val);
        }
    });
    var host = conf.host;
    var rootRIDs = _.uniq(_.filter(conf.rootRIDs, _.isString));
    var compileAndLoadRuleset = conf.compileAndLoadRuleset;

    var core = {
        db: db,
        host: host,
        rsreg: RulesetRegistry()
    };

    var emitter = new EventEmitter();
    var modules = Modules(core);

    var mkCTX = function(ctx){
        ctx.getMyKey = (function(rid){
            //we do it this way so all the keys are not leaked out to other built in modules or rulesets
            return function(id){
                return core.rsreg.getKey(rid, id);
            };
        }(ctx.rid));//pass in the rid at mkCTX creation so it is not later mutated

        if(ctx.event){
            ctx.txn_id = ctx.event.txn_id;
        }
        if(ctx.query){
            ctx.txn_id = ctx.query.txn_id;
        }

        ctx.modules = modules;
        ctx.applyFn = applyFn;
        var pushCTXScope = function(ctx2){
            return mkCTX(_.assign({}, ctx2, {
                rid: ctx.rid,//keep your original rid
                scope: ctx.scope.push(),
            }));
        };
        ctx.KRLClosure = function(fn){
            return function(ctx2, args){
                return fn(pushCTXScope(ctx2), function(name, index){
                    return getArg(args, name, index);
                }, function(name, index){
                    return hasArg(args, name, index);
                });
            };
        };
        ctx.defaction = function(ctx, name, fn){
            var actionFn = cocb.wrap(function*(ctx2, args){
                return yield fn(pushCTXScope(ctx2), function(name, index){
                    return getArg(args, name, index);
                }, function(name, index){
                    return hasArg(args, name, index);
                }, runAction);
            });
            actionFn.is_an_action = true;
            return ctx.scope.set(name, actionFn);
        };

        ctx.emit = function(type, val, message){//for stdlib
            var info = {};
            info.rid = ctx.rid;
            info.txn_id = ctx.txn_id;
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
            if(type === "error"){
                //the Error object, val, should be first
                // b/c node "error" event conventions, so you don't strange messages thinking `info` is the error
                emitter.emit("error", val, info, message);
            }else{
                emitter.emit(type, info, val, message);
            }
        };
        ctx.log = function(level, val){
            if(!_.has(log_levels, level)){
                throw new Error("Unsupported log level: " + level);
            }
            //this 'log-' prefix distinguishes user declared log events from other system generated events
            ctx.emit("log-" + level, val);
        };
        ctx.callKRLstdlib = function(fn_name, args){
            if(_.isArray(args)){
                args = [ctx].concat(args);
            }else{
                args[0] = ctx;
            }
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

    var initializeRulest = cocb.wrap(function*(rs){
        rs.scope = SymbolTable();
        rs.modules_used = {};
        core.rsreg.setupOwnKeys(rs);

        var use_array = _.values(rs.meta && rs.meta.use);
        var i, use, dep_rs, ctx2;
        for(i = 0; i < use_array.length; i++){
            use = use_array[i];
            if(use.kind !== "module"){
                throw new Error("Unsupported 'use' kind: " + use.kind);
            }
            dep_rs = core.rsreg.get(use.rid);
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
                provides: _.get(dep_rs, ["meta", "provides"], []),
            };
            core.rsreg.provideKey(rs.rid, use.rid);
        }
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
    });

    var initializeAndEngageRuleset = function(rs, callback){
        cocb.run(initializeRulest(rs), function(err){
            if(err) return callback(err);

            core.rsreg.put(rs);

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

    core.registerRuleset = function(krl_src, meta_data, callback){
        db.storeRuleset(krl_src, meta_data, function(err, data){
            if(err) return callback(err);
            compileAndLoadRuleset({
                rid: data.rid,
                src: krl_src,
                hash: data.hash
            }, function(err, rs){
                if(err) return callback(err);
                db.enableRuleset(data.hash, function(err){
                    if(err) return callback(err);
                    initializeAndEngageRuleset(rs, function(err){
                        if(err){
                            db.disableRuleset(rs.rid, _.noop);//undo enable if failed
                        }
                        callback(err, {
                            rid: rs.rid,
                            hash: data.hash
                        });
                    });
                });
            });
        });
    };

    var picoQ = PicoQueue(function(pico_id, job, callback){
        //now handle the next `job` on the pico queue
        if(job.type === "event"){
            var event = job.event;
            event.timestamp = new Date(event.timestamp);//convert from JSON string to date
            processEvent(core, mkCTX({
                event: event,
                pico_id: pico_id
            }), callback);
        }else if(job.type === "query"){
            processQuery(core, mkCTX({
                query: job.query,
                pico_id: pico_id
            }), callback);
        }else{
            callback(new Error("invalid PicoQueue job.type:" + job.type));
        }
    });

    core.signalEvent = function(event_orig, callback_orig){
        var callback = _.isFunction(callback_orig) ? callback_orig : _.noop;
        var event;
        try{
            //validate + normalize event, and make sure is not mutated
            event = cleanEvent(event_orig);
        }catch(err){
            emitter.emit("error", err);
            callback(err);
            return;
        }

        if(event.eid === "none"){
            event.eid = cuid();
        }
        event.timestamp = conf.allow_event_time_override && _.isDate(event_orig.timestamp)
            ? event_orig.timestamp
            : new Date();

        event.txn_id = cuid();

        db.getPicoIDByECI(event.eci, function(err, pico_id){
            if(err){
                emitter.emit("error", err);
                callback(err);
                return;
            }
            var emit = mkCTX({
                event: event,
                pico_id: pico_id,
            }).emit;

            emit("episode_start");
            emit("debug", "event received: " + event.domain + "/" + event.type);

            picoQ.enqueue(pico_id, {
                type: "event",
                event: event,
            }, onDone);

            emit("debug", "event added to pico queue: " + pico_id);

            function onDone(err, data){
                if(err){
                    emit("error", err);
                }else{
                    emit("debug", data);
                }
                //there should be no more emits after "episode_stop"
                emit("episode_stop");
                callback(err, data);
            }
        });
    };

    core.runQuery = function(query_orig, callback_orig){
        var callback = _.isFunction(callback_orig) ? callback_orig : _.noop;

        //ensure that query is not mutated
        var query = _.cloneDeep(query_orig);//TODO optimize

        if(!_.isString(query && query.eci)){
            var err = new Error("missing query.eci");
            emitter.emit("error", err);
            callback(err);
            return;
        }

        query.timestamp = new Date();
        query.txn_id = cuid();

        db.getPicoIDByECI(query.eci, function(err, pico_id){
            if(err){
                emitter.emit("error", err);
                callback(err);
                return;
            }

            var emit = mkCTX({
                query: query,
                pico_id: pico_id,
            }).emit;
            emit("episode_start");
            emit("debug", "query received: " + query.rid + "/" + query.name);

            picoQ.enqueue(pico_id, {
                type: "query",
                query: query
            }, onDone);

            emit("debug", "query added to pico queue: " + pico_id);

            function onDone(err, data){
                if(err){
                    emit("error", err);
                }else{
                    emit("debug", data);
                }
                //there should be no more emits after "episode_stop"
                emit("episode_stop");
                callback(err, data);
            }
        });
    };

    var registerAllEnabledRulesets = function(callback){
        db.listAllEnabledRIDs(function(err, rids){
            if(err)return callback(err);
            if(_.isEmpty(rids)){
                callback();
                return;
            }

            var rs_by_rid = {};
            var resolver = new DependencyResolver();

            async.each(rids, function(rid, next){
                getRulesetForRID(rid, function(err, rs){
                    if(err){
                        //TODO handle error rather than stop
                        next(err);
                        return;
                    }
                    rs_by_rid[rs.rid] = rs;
                    resolver.add(rs.rid);
                    _.each(rs.meta && rs.meta.use, function(use){
                        if(use.kind === "module"){
                            resolver.setDependency(rs.rid, use.rid);
                        }
                    });
                    next(null, rs);
                });
            }, function(err){
                if(err)return callback(err);

                //order they need to be loaded in for dependencies to work
                var rid_order = resolver.sort();

                async.eachSeries(rid_order, function(rid, next){
                    var rs = rs_by_rid[rid];
                    initializeAndEngageRuleset(rs, function(err){
                        if(err){
                            //TODO handle error rather than stop
                            next(err);
                            return;
                        }
                        next();
                    });
                }, callback);
            });
        });
    };

    core.unregisterRuleset = function(rid, callback){
        //first assert rid is not depended on as a module
        try{
            core.rsreg.assertNoDependants(rid);
        }catch(err){
            callback(err);
            return;
        }
        db.isRulesetUsed(rid, function(err, is_used){
            if(err) return callback(err);
            if(is_used){
                callback(new Error("Unable to unregister \"" + rid + "\": it is installed on at least one pico"));
                return;
            }
            db.deleteRuleset(rid, function(err){
                if(err) return callback(err);

                core.rsreg.del(rid);

                callback();
            });
        });
    };

    core.scheduler = Scheduler({
        db: db,
        onError: function(err){
            var info = {scheduler: true};
            emitter.emit("error", err, info);
        },
        onEvent: function(event){
            core.signalEvent(event);
        },
        is_test_mode: !!conf.___core_testing_mode,
    });

    core.registerRulesetURL = function(url, callback){
        getKRLByURL(url, function(err, src){
            core.registerRuleset(src, {url: url}, callback);
        });
    };
    core.flushRuleset = function(rid, callback){
        db.getEnabledRuleset(rid, function(err, rs_data){
            if(err) return callback(err);
            var url = rs_data.url;
            if(!_.isString(url)){
                callback(new Error("cannot flush a locally registered ruleset"));
                return;
            }
            core.registerRulesetURL(url, callback);
        });
    };
    core.installRuleset = function(pico_id, rid, callback){
        db.hasPico(pico_id, function(err, has_pico){
            if(err) return callback(err);
            if(!has_pico) return callback(new Error("Invalid pico_id: " + pico_id));

            db.hasEnabledRid(rid, function(err, has){
                if(err) return callback(err);
                if(!has) return callback(new Error("This rid is not found and/or enabled: " + rid));

                db.addRulesetToPico(pico_id, rid, callback);
            });
        });
    };

    core.uninstallRuleset = function(pico_id, rid, callback){
        db.removeRulesetFromPico(pico_id, rid, callback);
    };

    var resumeScheduler = function(callback){
        db.listScheduled(function(err, vals){
            if(err) return callback(err);

            //resume the cron tasks
            _.each(vals, function(val){
                if(!_.isString(val.timespec)){
                    return;
                }
                core.scheduler.addCron(val.timespec, val.id, val.event);
            });

            //resume `schedule .. at` queue
            core.scheduler.update();

            callback();
        });
    };


    var pe = {
        emitter: emitter,

        signalEvent: core.signalEvent,
        runQuery: core.runQuery,

        getRootPico: db.getRootPico,

        /////////////////////
        // vvv deprecated vvv
        registerRuleset: core.registerRuleset,
        registerRulesetURL: core.registerRulesetURL,
        flushRuleset: core.flushRuleset,
        unregisterRuleset: core.unregisterRuleset,

        newChannel: db.newChannel,
        removeChannel: db.removeChannel,
        installRuleset: core.installRuleset,
        uninstallRuleset: core.uninstallRuleset,
        removePico: db.removePico,

        putEntVar: db.putEntVar,
        getEntVar: db.getEntVar,
        removeEntVar: db.removeEntVar,

        dbDump: db.toObj,
        /////////////////////
        // ^^^ deprecated ^^^
    };
    if(conf.___core_testing_mode){
        pe.newPico = db.newPico;
        pe.scheduler = core.scheduler;
        pe.modules = modules;
    }

    pe.start = function(callback){
        async.series([
            function(next){
                if(_.isEmpty(rootRIDs)){
                    return next();
                }
                db.getRootPico(function(err, root_pico){
                    if(err && ! err.notFound){
                        return next(err);
                    }else if(!err){
                        return next();
                    }
                    db.newPico({}, function(err, pico){
                        if(err) return next(err);
                        db.newChannel({
                            pico_id: pico.id,
                            name: "root",
                            type: "secret",
                        }, function(err, chan){
                            if(err) return next(err);
                            db.putRootPico({
                                id: pico.id,
                                eci: chan.id,
                            }, next);
                        });
                    });
                });
            },
            function(next){
                if(_.isEmpty(rootRIDs)){
                    return next();
                }
                db.getRootPico(function(err, root_pico){
                    if(err) return next(err);

                    db.ridsOnPico(root_pico.id, function(err, rids){
                        if(err) return next(err);

                        var to_install = [];
                        _.each(rootRIDs, function(r_rid){
                            if( ! _.includes(rids, r_rid)){
                                to_install.push(r_rid);
                            }
                        });

                        async.eachSeries(to_install, function(rid, next){
                            core.installRuleset(root_pico.id, rid, next);
                        }, next);
                    });
                });
            },
            db.checkAndRunMigrations,
            registerAllEnabledRulesets,
            resumeScheduler,
        ], callback);
    };

    return pe;
};
