var _ = require("lodash");
var λ = require("contra");
var urllib = require("url");
var mkKRLfn = require("../mkKRLfn");

module.exports = function(core){
    var fns = {
        newPico: mkKRLfn([
        ], function(args, ctx, callback){
            core.db.newPico({}, callback);
        }),
        removePico: mkKRLfn([
            "pico_id",
        ], function(args, ctx, callback){
            core.db.removePico(args.pico_id, callback);
        }),
        newChannel: mkKRLfn([
            "pico_id",
            "name",
            "type",
        ], function(args, ctx, callback){
            core.db.newChannel(args, callback);
        }),
        listChannels: mkKRLfn([
            "pico_id",
        ], function(args, ctx, callback){
            core.db.listChannels(args.pico_id, callback);
        }),
        removeChannel: mkKRLfn([
            "eci",
        ], function(args, ctx, callback){
            core.db.getPicoIDByECI(args.eci, function(err, pico_id){
                if(err) return callback(err);

                core.db.removeChannel(pico_id, args.eci, callback);
            });
        }),
        getPicoIDByECI: mkKRLfn([
            "eci",
        ], function(args, ctx, callback){
            core.db.getPicoIDByECI(args.eci, callback);
        }),
        registerRuleset: mkKRLfn([
            "url",
            "base",
        ], function(args, ctx, callback){
            if(!_.isString(args.url)){
                return callback(new Error("registerRuleset expects `url`"));
            }
            var uri = _.isString(args.base)
                ? urllib.resolve(args.base, args.url)
                : args.url;
            core.registerRulesetURL(uri, function(err, data){
                if(err) return callback(err);
                callback(null, data.rid);
            });
        }),
        installRuleset: mkKRLfn([
            "pico_id",
            "rid",
            "url",
            "base",
        ], function(args, ctx, callback){
            var install = function(rid, callback){
                core.installRuleset(args.pico_id, rid, function(err){
                    callback(err, rid);
                });
            };

            if(_.isString(args.rid)){
                install(args.rid, callback);
                return;
            }
            if(_.isArray(args.rid)){
                λ.map(_.uniq(args.rid), install, callback);
                return;
            }
            if(_.isString(args.url)){
                var uri = _.isString(args.base)
                    ? urllib.resolve(args.base, args.url)
                    : args.url;
                core.db.findRulesetsByURL(uri, function(err, results){
                    if(err) return callback(err);
                    var rids = _.uniq(_.map(results, "rid"));
                    if(_.size(rids) === 0){
                        core.registerRulesetURL(uri, function(err, data){
                            if(err) return callback(err);
                            install(data.rid, callback);
                        });
                        return;
                    }
                    if(_.size(rids) !== 1){
                        return callback(new Error("More than one rid found for the given url: " + rids.join(" , ")));
                    }
                    install(_.head(rids), callback);
                });
                return;
            }
            callback(new Error("installRuleset expects `rid` or `url`+`base`"));
        }),
        uninstallRuleset: mkKRLfn([
            "pico_id",
            "rid",
        ], function(args, ctx, callback){
            var rids = _.isArray(args.rid)
                ? _.uniq(args.rid)
                : [args.rid];

            λ.each(rids, function(rid, next){
                core.uninstallRuleset(args.pico_id, rid, next);
            }, callback);
        }),
        unregisterRuleset: mkKRLfn([
            "rid",
        ], function(args, ctx, callback){
            core.unregisterRuleset(args.rid, callback);
        }),
    };

    return {
        def: fns
    };
};
