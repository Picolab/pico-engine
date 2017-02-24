var _ = require("lodash");
var λ = require("contra");
var fs = require("fs");
var path = require("path");
var express = require("express");
var request = require("request");
var leveldown = require("leveldown");
var bodyParser = require("body-parser");
var PicoEngine = require("pico-engine-core");
var RulesetLoader = require("./RulesetLoader");
var compiler = require("krl-compiler");

////////////////////////////////////////////////////////////////////////////////
var port = process.env.PORT || 8080;
var pico_engine_home = process.env.PICO_ENGINE_HOME || path.resolve(__dirname, "..");
////////////////////////////////////////////////////////////////////////////////

var httpGetKRL = function(url, callback){
    request(url, function(err, resp, body){
        if(err)
            return callback(err);
        if(resp.statusCode !== 200)
            return callback(new Error("Got a statusCode=" + resp.statusCode + " for: " + url));

        callback(null, body);
    });
};

var github_prefix = "https://raw.githubusercontent.com/Picolab/node-pico-engine/master/krl/";

var registerBuiltInRulesets = function(pe, callback){
    var krl_dir = path.resolve(__dirname, "../krl");
    fs.readdir(krl_dir, function(err, files){
        if(err) return callback(err);
        λ.each(files, function(filename, next){
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

var setupOwnerPico = function(pe, callback){
    pe.db.getOwnerECI(function(err, eci){
        if(err) return callback(err);
        if(eci){//already setup
            return callback();
        }
        λ.waterfall([
            λ.curry(pe.db.newPico, {}),
            function(pico, callback){
                pe.db.newChannel({
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
                pe.db.addRuleset({
                    pico_id: info.pico_id,
                    rid: "io.picolabs.pico"
                }, function(err){
                    callback(err, info);
                });
            },
            function(info, callback){
                pe.db.addRuleset({
                    pico_id: info.pico_id,
                    rid: "io.picolabs.visual_params"
                }, function(err){
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

var startPicoEngine = function(callback){
    PicoEngine({
        compileAndLoadRuleset: RulesetLoader({
            rulesets_dir: path.resolve(pico_engine_home, "rulesets")
        }),
        db: {
            db: leveldown,
            location: path.join(pico_engine_home, "db")
        }
    }, function(err, pe){
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

startPicoEngine(function(err, pe){
    if(err){
        throw err;
    }

    var logs = {};
    var logRID = "io.picolabs.logging";
    var logEntry = function(context,message){
        var eci = context.eci;
        var timestamp = (new Date()).toISOString();
        var episode = logs[eci];
        if (episode) {
            episode.logs.push(timestamp+" "+message);
        } else {
            console.log("[ERROR]","no episode found for",eci);
        }
    };
    var logEpisode = function(pico_id,context,callback){
        var eci = context.eci;
        var episode = logs[eci];
        if (!episode) {
            console.log("[ERROR]","no episode found for",eci);
            return;
        }
        pe.db.getEntVar(pico_id,logRID,"status",function(e,status){
            if (status) {
                pe.db.getEntVar(pico_id,logRID,"logs",function(e,data){
                    data[episode.key] = episode.logs;
                    pe.db.putEntVar(pico_id,logRID,"logs",data,function(e){
                        callback(delete logs[eci]);
                    });
                });
            } else {
                callback(delete logs[eci]);
            }
        });
    };
    pe.emitter.on("episode_start", function(context){
        console.log("EPISODE_START",context);
        var eci = context.eci;
        var timestamp = (new Date()).toISOString();
        var episode = logs[eci];
        if (episode) {
            console.log("[ERROR]","episode already exists for",eci);
        } else {
            episode = {};
            episode.key = (
                    timestamp + " - " + eci
                    + " - " + ((context.event) ? context.event.eid : "query")
                    ).replace(/[.]/g, "-");
            episode.logs = [];
            logs[eci] = episode;
        }
    });
    pe.emitter.on("klog", function(context, val, message){
        console.log("[KLOG]", message, val);
        logEntry(context,"[KLOG] "+message+" "+JSON.stringify(val));
    });
    pe.emitter.on("debug", function(context, message){
        console.log("[DEBUG]", context, message);
        logEntry(context,message);
    });
    pe.emitter.on("error", function(context, message){
        console.error("[ERROR]", context, message);
        logEntry(context,message);
    });
    pe.emitter.on("episode_stop", function(context){
        console.log("EPISODE_STOP",context);
        var callback = function(outcome){
            console.log("[EPISODE_REMOVED]",outcome);
        };
        logEpisode(context.pico_id,context,callback);
    });

    var app = express();
    app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });
    app.use(express.static(path.resolve(__dirname, "..", "public")));
    app.use(bodyParser.json({type: "application/json"}));
    app.use(bodyParser.urlencoded({type: "application/x-www-form-urlencoded", extended: false}));

    var errResp = function(res, err){
        res.statusCode = err.statusCode || 500;
        res.end(err.message);
    };


    app.all("/sky/event/:eci/:eid/:domain/:type", function(req, res){
        var event = {
            eci: req.params.eci,
            eid: req.params.eid,
            domain: req.params.domain,
            type: req.params.type,
            attrs: _.assign({}, req.query, req.body)
        };
        pe.signalEvent(event, function(err, response){
            if(err) return errResp(res, err);
            res.json(response);
        });
    });

    app.all("/sky/cloud/:eci/:rid/:function", function(req, res){
        var query = {
            eci: req.params.eci,
            rid: req.params.rid,
            name: req.params["function"],
            args: _.assign({}, req.query, req.body)
        };
        pe.runQuery(query, function(err, data){
            if(err) return errResp(res, err);
            if(_.isFunction(data)){
                data(res);
            }else{
                res.json(data);
            }
        });
    });

    app.all("/api/db-dump", function(req, res){
        pe.db.toObj(function(err, db_data){
            if(err) return errResp(res, err);
            res.json(db_data);
        });
    });

    app.all("/api/owner-eci", function(req, res){
        pe.db.getOwnerECI(function(err, eci){
            if(err) return errResp(res, err);
            res.json({ok: true, eci: eci});
        });
    });

    app.all("/api/pico/:id/new-channel", function(req, res){
        pe.db.newChannel({
            pico_id: req.params.id,
            name: req.query.name,
            type: req.query.type
        }, function(err, new_channel){
            if(err) return errResp(res, err);
            res.json(new_channel);
        });
    });

    app.all("/api/pico/:id/rm-channel/:eci", function(req, res){
        pe.db.removeChannel(req.params.id, req.params.eci, function(err){
            if(err) return errResp(res, err);
            res.json({ok: true});
        });
    });

    app.all("/api/pico/:id/rm-ruleset/:rid", function(req, res){
        pe.db.removeRuleset(req.params.id, req.params.rid, function(err){
            if(err) return errResp(res, err);
            res.json({ok: true});
        });
    });

    app.all("/api/ruleset/compile", function(req, res){
        try{
            res.json({ code: compiler(req.query.src).code});
        }catch(err){
            res.json({ error: err.toString() });
        }
    });

    app.all("/api/ruleset/register", function(req, res){
        var register = function(src, meta){
            pe.registerRuleset(src, meta || {}, function(err, data){
                if(err) return errResp(res, err);
                res.json({ok: true, rid: data.rid, hash: data.hash});
            });
        };
        if(_.isString(req.query.src)){
            register(req.query.src);
        }else if(_.isString(req.query.url)){
            httpGetKRL(req.query.url, function(err, src){
                if(err) return errResp(res, err);
                register(src, {url: req.query.url});
            });
        }else{
            errResp(res, new Error("expected `src` or `url`"));
        }
    });

    app.all("/api/ruleset/flush/:rid", function(req, res){
        var rid = req.params.rid;
        pe.db.getEnabledRuleset(rid, function(err, rs_data){
            if(err) return errResp(res, err);

            var url = rs_data.url;
            httpGetKRL(url, function(err, src){
                if(err) return errResp(res, err);

                pe.registerRuleset(src, {url: url}, function(err, data){
                    if(err) return errResp(res, err);

                    res.json({ok: true, rid: data.rid, hash: data.hash});
                });
            });
        });
    });

    app.listen(port, function () {
        console.log("http://localhost:" + port);
    });
});
