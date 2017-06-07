var λ = require("contra");
var fs = require("fs");
var path = require("path");
var leveldown = require("leveldown");
var PicoEngine = require("pico-engine-core");
var RulesetLoader = require("./RulesetLoader");

var setupOwnerPico = function(pe, callback){
    pe.getOwnerECI(function(err, eci){
        if(err) return callback(err);
        if(eci){//already setup
            return callback();
        }
        λ.waterfall([
            λ.curry(pe.newPico, {}),
            function(pico, callback){
                pe.newChannel({
                    pico_id: pico.id,
                    name: "main",
                    type: "secret"
                }, function(err, channel){
                    if(err) return callback(err);
                    callback(null, {
                        pico_id: pico.id,
                        eci: channel.id
                    });
                });
            },
            function(info, callback){
                pe.installRuleset(info.pico_id, "io.picolabs.pico", function(err){
                    callback(err, info);
                });
            },
            function(info, callback){
                pe.installRuleset(info.pico_id, "io.picolabs.visual_params", function(err){
                    callback(err, info);
                });
            },
            function(info, callback){
                pe.signalEvent({
                    eci: info.eci,
                    eid: "19",
                    domain: "pico",
                    type: "root_created",
                    attrs: {
                        id: info.pico_id,
                        eci: info.eci
                    }
                }, function(err){
                    callback(err, info);
                });
            },
            function(info, callback){
                pe.signalEvent({
                    eci: info.eci,
                    eid: "31",
                    domain: "visual",
                    type: "update",
                    attrs: {
                        dname: "Owner Pico",
                        color: "#87cefa"
                    }
                }, function(err){
                    callback(err, info);
                });
            }
        ], function(err){
            callback(err, pe);
        });
    });
};

var github_prefix = "https://raw.githubusercontent.com/Picolab/node-pico-engine/master/krl/";

var registerBuiltInRulesets = function(pe, callback){
    var krl_dir = path.resolve(__dirname, "../krl");
    fs.readdir(krl_dir, function(err, files){
        if(err) return callback(err);
        //.series b/c dependent modules must be registered in order
        λ.each.series(files, function(filename, next){
            var file = path.resolve(krl_dir, filename);
            if(!/\.krl$/.test(file)){
                //only auto-load krl files in the top level
                return next();
            }
            fs.readFile(file, "utf8", function(err, src){
                if(err) return next(err);
                pe.registerRuleset(src, {
                    url: github_prefix + filename
                }, function(err){
                    if(err) return next(err);
                    next();
                });
            });
        }, callback);
    });
};

var setupLogging = function(pe){
    var logs = {};
    var logRID = "io.picolabs.logging";
    var logEntry = function(context,message){
        var episode_id = context.eci;
        var timestamp = (new Date()).toISOString();
        var episode = logs[episode_id];
        if (episode) {
            episode.logs.push(timestamp+" "+message);
        } else {
            console.log("[ERROR]","no episode found for",episode_id);
        }
    };
    var logEpisode = function(pico_id,context,callback){
        var episode_id = context.eci;
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
        console.log("[EPISODE_START]",context);
        var episode_id = context.eci;
        var timestamp = (new Date()).toISOString();
        var episode = logs[episode_id];
        if (episode) {
            console.log("[ERROR]","episode already exists for",episode_id);
        } else {
            episode = {};
            var eci = "UNKNOWN ECI";
            if(context.event) {
                eci = context.event.eci;
            } else if(context.query) {
                eci = context.query.eci;
            }
            episode.key = (
                    timestamp + " - " + episode_id
                    + " - " + eci
                    + " - " + ((context.event) ? context.event.eid : "query")
                    ).replace(/[.]/g, "-");
            episode.logs = [];
            logs[episode_id] = episode;
        }
    });
    pe.emitter.on("klog", function(context, val, message){
        console.log("[KLOG]", message, val);
        logEntry(context,"[KLOG] "+message+" "+JSON.stringify(val));
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
        logEntry(context, err);
    });
    pe.emitter.on("episode_stop", function(context){
        console.log("[EPISODE_STOP]",context);
        var callback = function(outcome){
            console.log("[EPISODE_REMOVED]",outcome);
        };
        logEpisode(context.pico_id,context,callback);
    });
};

module.exports = function(opts, callback){
    opts = opts || {};
    var pe = PicoEngine({
        host: opts.host,
        compileAndLoadRuleset: RulesetLoader({
            rulesets_dir: path.resolve(opts.home, "rulesets")
        }),
        db: {
            db: leveldown,
            location: path.join(opts.home, "db")
        }
    });

    setupLogging(pe);

    pe.start(function(err){
        if(err) return callback(err);

        registerBuiltInRulesets(pe, function(err){
            if(err) return callback(err);
            setupOwnerPico(pe, function(err){
                if(err) return callback(err);
                callback(null, pe);
            });
        });
    });
};
