var λ = require("contra");
var fs = require("fs");
var path = require("path");
var leveldown = require("leveldown");
var PicoEngine = require("pico-engine-core");
var RulesetLoader = require("./RulesetLoader");

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

module.exports = function(opts, callback){
    opts = opts || {};
    PicoEngine({
        host: opts.host,
        compileAndLoadRuleset: RulesetLoader({
            rulesets_dir: path.resolve(opts.home, "rulesets")
        }),
        db: {
            db: leveldown,
            location: path.join(opts.home, "db")
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
