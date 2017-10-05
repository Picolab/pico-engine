var _ = require("lodash");
var fs = require("fs");
var path = require("path");
var async = require("async");
var leveldown = require("leveldown");
var RulesetLoader = require("./RulesetLoader");
var PicoEngineCore = require("pico-engine-core");

var setupRootPico = function(pe, callback){
    pe.getRootECI(function(err, root_eci){
        if(err) return callback(err);

        pe.runQuery({
            eci: root_eci,
            rid: "io.picolabs.pico",
            name: "myself",
        }, function(err, myself){
            if(err) return callback(err);
            if(myself.eci === root_eci){
                //already initialized
                return callback();
            }

            var signal = function(event){
                return function(next){
                    pe.signalEvent(_.assign({eci: root_eci}, event), next);
                };
            };

            async.series([
                signal({
                    eid: "19",
                    domain: "pico",
                    type: "root_created",
                    attrs: {
                        eci: root_eci,
                    },
                }),
                signal({
                    eid: "31",
                    domain: "visual",
                    type: "update",
                    attrs: {
                        dname: "Root Pico",
                        color: "#87cefa",
                    },
                }),
            ], callback);
        });
    });
};

var github_prefix = "https://raw.githubusercontent.com/Picolab/node-pico-engine/master/krl/";

var getSystemRulesets = function(pe, callback){
    var krl_dir = path.resolve(__dirname, "../krl");
    fs.readdir(krl_dir, function(err, files){
        if(err) return callback(err);
        //.series b/c dependent modules must be registered in order
        async.map(files, function(filename, next){
            var file = path.resolve(krl_dir, filename);
            if(!/\.krl$/.test(file)){
                //only auto-load krl files in the top level
                return next();
            }
            fs.readFile(file, "utf8", function(err, src){
                if(err) return next(err);
                next(null, {
                    src: src,
                    meta: {url: github_prefix + filename},
                });
            });
        }, function(err, system_rulesets){
            callback(err, _.compact(system_rulesets));
        });
    });
};

var setupLogging = function(pe){
    var logs = {};
    var logRID = "io.picolabs.logging";
    var needAttributes = function(context,message){
        if (context.event && _.isString(message)) {
            return message.startsWith("event received:") ||
                message.startsWith("adding raised event to schedule:");
        } else {
            return false;
        }
    };
    var logEntry = function(context,message){
        var episode_id = context.txn_id;
        var timestamp = (new Date()).toISOString();
        var episode = logs[episode_id];
        if (episode) {
            if (needAttributes(context,message)) {
                episode.logs.push(timestamp+" "+message+" attributes "+JSON.stringify(context.event.attrs));
            } else {
                episode.logs.push(timestamp+" "+message);
            }
        } else {
            console.log("[ERROR]","no episode found for",episode_id);
        }
    };
    var logEpisode = function(pico_id,context,callback){
        var episode_id = context.txn_id;
        var episode = logs[episode_id];
        if (!episode) {
            console.log("[ERROR]","no episode found for",episode_id);
            return;
        }
        pe.getEntVar(pico_id,logRID,"status",function(e,status){
            if (status) {
                pe.getEntVar(pico_id,logRID,"logs",function(e,data){
                    data[episode.key] = episode.logs;
                    pe.putEntVar(pico_id,logRID,"logs",data,function(e){
                        callback(delete logs[episode_id]);
                    });
                });
            } else {
                callback(delete logs[episode_id]);
            }
        });
    };
    pe.emitter.on("episode_start", function(context){
        var episode_id = context.txn_id;
        console.log("[EPISODE_START]",episode_id);
        var timestamp = (new Date()).toISOString();
        var episode = logs[episode_id];
        if (episode) {
            console.log("[ERROR]","episode already exists for",episode_id);
        } else {
            episode = {};
            episode.key = (
                timestamp + " - " + episode_id
                    + " - " + context.eci
                    + " - " + ((context.event) ? context.event.eid : "query")
            ).replace(/[.]/g, "-");
            episode.logs = [];
            logs[episode_id] = episode;
        }
    });
    pe.emitter.on("klog", function(context, info){
        if(info.hasOwnProperty("message")){
            console.log("[KLOG]", info.message, info.val);
            logEntry(context,"[KLOG] "+info.message+" "+JSON.stringify(info.val));
        }else{
            console.log("[KLOG]", info.val);
            logEntry(context,"[KLOG] "+JSON.stringify(info.val));
        }
    });
    pe.emitter.on("log-error", function(context_info, expression){
        console.log("[LOG-ERROR]",context_info,expression);
        logEntry(context_info,"[LOG-ERROR] "+JSON.stringify(expression));
    });
    pe.emitter.on("log-warn", function(context_info, expression){
        console.log("[LOG-WARN]",context_info,expression);
        logEntry(context_info,"[LOG-WARN] "+JSON.stringify(expression));
    });
    pe.emitter.on("log-info", function(context_info, expression){
        console.log("[LOG-INFO]",context_info,expression);
        logEntry(context_info,"[LOG-INFO] "+JSON.stringify(expression));
    });
    pe.emitter.on("log-debug", function(context_info, expression){
        console.log("[LOG-DEBUG]",context_info,expression);
        logEntry(context_info,"[LOG-DEBUG] "+JSON.stringify(expression));
    });
    pe.emitter.on("debug", function(context, message){
        console.log("[DEBUG]", context, message);
        if (typeof message === "string") {
            logEntry(context,message);
        } else {
            logEntry(context,JSON.stringify(message));
        }
    });
    pe.emitter.on("error", function(err, context){
        console.error("[ERROR]", context, err);
        if(context) logEntry(context, err + "");
    });
    pe.emitter.on("episode_stop", function(context){
        var episode_id = context.txn_id;
        console.log("[EPISODE_STOP]",episode_id);
        var callback = function(outcome){
            console.log("[EPISODE_REMOVED]",outcome);
        };
        logEpisode(context.pico_id,context,callback);
    });
};

module.exports = function(conf, callback){


    var pe = PicoEngineCore({

        host: conf.host,

        compileAndLoadRuleset: RulesetLoader({
            rulesets_dir: path.resolve(conf.home, "rulesets"),
        }),

        db: {
            db: leveldown,
            location: path.join(conf.home, "db"),
        },

        modules: conf.modules || {},

        //RIDs that will be automatically installed on the root pico
        rootRIDs: [
            "io.picolabs.pico",
            "io.picolabs.visual_params",
        ],
    });


    if(conf.no_logging){
        //no setupLogging
    }else{
        setupLogging(pe);
    }

    //system rulesets should be registered/updated first
    getSystemRulesets(pe, function(err, system_rulesets){
        if(err) return callback(err);

        pe.start(system_rulesets, function(err){
            if(err) return callback(err);

            setupRootPico(pe, function(err){
                if(err) return callback(err);
                callback(null, pe);
            });
        });
    });
};
