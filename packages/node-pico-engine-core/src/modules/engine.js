var _ = require("lodash");
var λ = require("contra");
var urllib = require("url");
var mkKRLfn = require("../mkKRLfn");

module.exports = function(core){
    var fns = {
        getPicoIDByECI: mkKRLfn([
            "eci",
        ], function(args, ctx, callback){
            core.db.getPicoIDByECI(args.eci, callback);
        }),
        listChannels: mkKRLfn([
            "pico_id",
        ], function(args, ctx, callback){
            core.db.listChannels(args.pico_id, callback);
        }),
        listAllEnabledRIDs: mkKRLfn([
        ], function(args, ctx, callback){
            core.db.listAllEnabledRIDs(callback);
        }),
        describeRuleset: mkKRLfn([
            "rid",
        ], function(args, ctx, callback){
            core.db.getEnabledRuleset(args.rid, function(err, data){
                if(err) return callback(err);
                var rid = data.rid;
                callback(null, {
                    rid: rid,
                    src: data.src,
                    hash: data.hash,
                    url: data.url,
                    timestamp_stored: data.timestamp_stored,
                    timestamp_enable: data.timestamp_enable,
                    meta: {
                        name:        _.get(core.rsreg.get(rid), ["meta", "name"]),
                        description: _.get(core.rsreg.get(rid), ["meta", "description"]),
                        author:      _.get(core.rsreg.get(rid), ["meta", "author"]),
                    },
                });
            });
        }),
    };

    var actions = {
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
        removeChannel: mkKRLfn([
            "eci",
        ], function(args, ctx, callback){
            core.db.getPicoIDByECI(args.eci, function(err, pico_id){
                if(err) return callback(err);

                core.db.removeChannel(pico_id, args.eci, callback);
            });
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
        unregisterRuleset: mkKRLfn([
            "rid",
        ], function(args, ctx, callback){
            var rids = _.isArray(args.rid)
                ? _.uniq(args.rid)
                : [args.rid];

            λ.each(rids, core.unregisterRuleset, callback);
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
    };

    return {
        def: fns,
        actions: actions,
    };
};
