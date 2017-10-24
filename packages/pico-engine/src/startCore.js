var _ = require("lodash");
var fs = require("fs");
var path = require("path");
var async = require("async");
var fileUrl = require("file-url");
var leveldown = require("leveldown");
var krl_stdlib = require("krl-stdlib");
var RulesetLoader = require("./RulesetLoader");
var PicoEngineCore = require("pico-engine-core");


var toKRLjson = function(val, indent){
    var message = krl_stdlib.encode({}, val, indent);
    if(message === "\"[JSObject]\""){
        message = val.toString();
    }
    return message;
};


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
                    meta: {url: fileUrl(file, {resolve: false})},
                });
            });
        }, function(err, system_rulesets){
            callback(err, _.compact(system_rulesets));
        });
    });
};


var setupLogging = function(pe, bunyanLog){

    var logs = {};
    var logRID = "io.picolabs.logging";

    var krlLevelToBunyanLevel = function(level){
        if(/error/.test(level)){
            return "error";
        }else if(/warn/.test(level)){
            return "warn";
        }else if(/debug/.test(level)){
            return "debug";
        }
        return "info";
    };

    var logEntry = function(level, message, context){

        context = context || {};//"error" events may be missiong context, log it as far as possible

        var timestamp = (new Date()).toISOString();

        if(!_.isString(message)){
            if(_.isError(message)){
                message = message + "";
            }else{
                message = toKRLjson(message);
            }
        }

        bunyanLog[krlLevelToBunyanLevel(level)]({krl_level: level, context: context}, message);

        //decide if we want to add the event attributes to the log message
        if(context.event && _.isString(message) && (false
            || message.startsWith("event received:")
            || message.startsWith("adding raised event to schedule:")
        )){
            message += " attributes " + toKRLjson(context.event.attrs);
        }

        //decide if we want to add the query arguments to the log message
        if(context.query
            && context.query.args
            && _.isString(message)
            && message.startsWith("query received:")
        ){
            message += " arguments " + toKRLjson(context.query.args);
        }

        var shell_log = "[" + level.toUpperCase() + "] ";
        if(context.event){
            shell_log += "event"
                + "/" + context.event.eci
                + "/" + context.event.eid
                + "/" + context.event.domain
                + "/" + context.event.type
            ;
        }else if(context.query){
            shell_log += "query"
                + "/" + context.query.eci
                + "/" + context.query.rid
                + "/" + context.query.name
            ;
        }else{
            shell_log += toKRLjson(context);
        }
        shell_log += " | " + message;
        if(shell_log.length > 300){
            shell_log = shell_log.substring(0, 300) + "...";
        }
        if(/error/i.test(level)){
            console.error(shell_log);//use stderr
        }else{
            console.log(shell_log);
        }

        var episode_id = context.txn_id;
        var episode = logs[episode_id];
        if (episode) {
            episode.logs.push(timestamp + " [" + level.toUpperCase() + "] " + message);
        } else {
            console.error("[ERROR]", "no episode found for", episode_id);
        }
    };


    pe.emitter.on("episode_start", function(expression, context){
        var episode_id = context.txn_id;
        console.log("[EPISODE_START]", episode_id);
        var timestamp = (new Date()).toISOString();
        var episode = logs[episode_id];
        if (episode) {
            console.error("[ERROR]", "episode already exists for", episode_id);
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


    var onLevelLogEntry = function(level){
        pe.emitter.on(level, function(expression, context){
            logEntry(level, expression, context);
        });
    };

    onLevelLogEntry("log-info");
    onLevelLogEntry("log-debug");
    onLevelLogEntry("log-warn");
    onLevelLogEntry("log-error");
    onLevelLogEntry("debug");
    onLevelLogEntry("error");

    pe.emitter.on("klog", function(info, context){
        var msg = toKRLjson(info && info.val);
        if(_.has(info, "message")){
            msg = info.message + " " + msg;
        }
        logEntry("klog", msg, context);
    });

    pe.emitter.on("episode_stop", function(expression, context){
        var pico_id = context.pico_id;
        var episode_id = context.txn_id;

        console.log("[EPISODE_STOP]", episode_id);

        var episode = logs[episode_id];
        if (!episode) {
            console.error("[ERROR]","no episode found for", episode_id);
            return;
        }

        var onRemoved = function(err){
            delete logs[episode_id];
            if(err){
                console.error("[ERROR] failed to remove episode", episode_id, err + "");
            }
        };

        pe.getEntVar(pico_id, logRID, "status", function(err, is_logs_on){
            if(err) return onRemoved(err);
            if(!is_logs_on){
                onRemoved();
                return;
            }
            pe.getEntVar(pico_id, logRID, "logs", function(err, data){
                if(err) return onRemoved(err);

                data[episode.key] = episode.logs;

                pe.putEntVar(pico_id, logRID, "logs", data, onRemoved);
            });
        });
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
        setupLogging(pe, conf.bunyanLog);
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
