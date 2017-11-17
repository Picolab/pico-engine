var _ = require("lodash");
var async = require("async");
var urllib = require("url");
var mkKRLfn = require("../mkKRLfn");
var mkKRLaction = require("../mkKRLaction");
var ADMIN_POLICY_ID = require("../DB").ADMIN_POLICY_ID;

module.exports = function(core){
    var fns = {

        getPicoIDByECI: mkKRLfn([
            "eci",
        ], function(ctx, args, callback){
            core.db.getPicoIDByECI(args.eci, callback);
        }),


        getParent: mkKRLfn([
            "pico_id",
        ], function(ctx, args, callback){

            var pico_id = args.pico_id || ctx.pico_id;
            core.db.assertPicoID(pico_id, function(err, pico_id){
                if(err) return callback(err);

                core.db.getParent(pico_id, callback);
            });
        }),


        getAdminECI: mkKRLfn([
            "pico_id",
        ], function(ctx, args, callback){

            var pico_id = args.pico_id || ctx.pico_id;
            core.db.assertPicoID(pico_id, function(err, pico_id){
                if(err) return callback(err);

                core.db.getAdminECI(pico_id, callback);
            });
        }),


        listChildren: mkKRLfn([
            "pico_id",
        ], function(ctx, args, callback){

            var pico_id = args.pico_id || ctx.pico_id;
            core.db.assertPicoID(pico_id, function(err, pico_id){
                if(err) return callback(err);

                core.db.listChildren(pico_id, callback);
            });
        }),


        listChannels: mkKRLfn([
            "pico_id",
        ], function(ctx, args, callback){

            var pico_id = args.pico_id || ctx.pico_id;
            core.db.assertPicoID(pico_id, function(err, pico_id){
                if(err) return callback(err);

                core.db.listChannels(pico_id, callback);
            });
        }),


        listInstalledRIDs: mkKRLfn([
            "pico_id",
        ], function(ctx, args, callback){

            var pico_id = args.pico_id || ctx.pico_id;
            core.db.assertPicoID(pico_id, function(err, pico_id){
                if(err) return callback(err);

                core.db.ridsOnPico(pico_id, function(err, rid_set){
                    if(err) return callback(err);
                    callback(null, _.keys(rid_set));
                });
            });
        }),


        listAllEnabledRIDs: mkKRLfn([
        ], function(ctx, args, callback){
            core.db.listAllEnabledRIDs(callback);
        }),


        describeRuleset: mkKRLfn([
            "rid",
        ], function(ctx, args, callback){
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

        newPico: mkKRLaction([
            "parent_id",
        ], function(ctx, args, callback){

            var parent_id = args.parent_id || ctx.pico_id;
            core.db.assertPicoID(parent_id, function(err, parent_id){
                if(err) return callback(err);

                core.db.newPico({
                    parent_id: parent_id,
                }, callback);
            });
        }),


        removePico: mkKRLaction([
            "pico_id",
        ], function(ctx, args, callback){

            var pico_id = args.pico_id || ctx.pico_id;
            core.db.assertPicoID(pico_id, function(err, pico_id){
                if(err) return callback(err);

                core.db.listChildren(pico_id, function(err, children){
                    if(err) return callback(err);
                    if(_.size(children) > 0){
                        callback(new Error("Cannot remove pico \"" + pico_id + "\" because it has " + _.size(children) + " children"));
                        return;
                    }
                    core.db.removePico(pico_id, callback);
                });
            });
        }),


        newChannel: mkKRLaction([
            "pico_id",
            "name",
            "type",
        ], function(ctx, args, callback){

            var pico_id = args.pico_id || ctx.pico_id;
            core.db.assertPicoID(pico_id, function(err, pico_id){
                if(err) return callback(err);

                core.db.newChannel({
                    pico_id: pico_id,
                    name: args.name,
                    type: args.type,
                    policy_id: ADMIN_POLICY_ID,
                }, callback);
            });
        }),


        removeChannel: mkKRLaction([
            "eci",
        ], function(ctx, args, callback){
            core.db.removeChannel(args.eci, callback);
        }),


        registerRuleset: mkKRLaction([
            "url",
            "base",
        ], function(ctx, args, callback){
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


        unregisterRuleset: mkKRLaction([
            "rid",
        ], function(ctx, args, callback){
            var rids = _.isArray(args.rid)
                ? _.uniq(args.rid)
                : [args.rid];

            async.each(rids, core.unregisterRuleset, callback);
        }),


        installRuleset: mkKRLaction([
            "pico_id",
            "rid",
            "url",
            "base",
        ], function(ctx, args, callback){

            var pico_id = args.pico_id || ctx.pico_id;

            var install = function(rid, callback){
                core.installRuleset(pico_id, rid, function(err){
                    callback(err, rid);
                });
            };

            if(_.isString(args.rid)){
                install(args.rid, callback);
                return;
            }
            if(_.isArray(args.rid)){
                async.map(_.uniq(args.rid), install, callback);
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
            callback(new Error("installRuleset expects a rid, an arrays of rids, or a url and base"));
        }),


        uninstallRuleset: mkKRLaction([
            "pico_id",
            "rid",
        ], function(ctx, args, callback){
            var pico_id = args.pico_id || ctx.pico_id;
            var rids = _.isArray(args.rid)
                ? _.uniq(args.rid)
                : [args.rid];

            async.each(rids, function(rid, next){
                core.uninstallRuleset(pico_id, rid, next);
            }, callback);
        }),

    };

    return {
        def: fns,
    };
};
