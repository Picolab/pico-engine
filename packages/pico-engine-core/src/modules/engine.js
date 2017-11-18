var _ = require("lodash");
var async = require("async");
var urllib = require("url");
var ktypes = require("krl-stdlib/types");
var mkKRLfn = require("../mkKRLfn");
var mkKRLaction = require("../mkKRLaction");
var ADMIN_POLICY_ID = require("../DB").ADMIN_POLICY_ID;

var picoArgOrCtxPico = function(fn_name, ctx, args, key){
    key = key || "pico_id";
    var pico_id = _.has(args, key) ? args[key] : ctx.pico_id;
    if(!ktypes.isString(pico_id)){
        throw new TypeError("engine:" + fn_name + " was given " + ktypes.toString(args.eci) + " instead of a " + key + " string");
    }
    return pico_id;
};

module.exports = function(core){

    var fns = {

        getPicoIDByECI: mkKRLfn([
            "eci",
        ], function(ctx, args, callback){

            if(!_.has(args, "eci")){
                return callback(new Error("engine:getPicoIDByECI needs an eci string"));
            }
            if(!ktypes.isString(args.eci)){
                return callback(new TypeError("engine:getPicoIDByECI was given " + ktypes.toString(args.eci) + " instead of an eci string"));
            }

            core.db.getPicoIDByECI(args.eci, callback);
        }),


        getParent: mkKRLfn([
            "pico_id",
        ], function(ctx, args, callback){

            var pico_id = picoArgOrCtxPico("getParent", ctx, args);

            core.db.assertPicoID(pico_id, function(err, pico_id){
                if(err) return callback(err);

                core.db.getParent(pico_id, callback);
            });
        }),


        getAdminECI: mkKRLfn([
            "pico_id",
        ], function(ctx, args, callback){

            var pico_id = picoArgOrCtxPico("getAdminECI", ctx, args);

            core.db.assertPicoID(pico_id, function(err, pico_id){
                if(err) return callback(err);

                core.db.getAdminECI(pico_id, callback);
            });
        }),


        listChildren: mkKRLfn([
            "pico_id",
        ], function(ctx, args, callback){

            var pico_id = picoArgOrCtxPico("listChildren", ctx, args);

            core.db.assertPicoID(pico_id, function(err, pico_id){
                if(err) return callback(err);

                core.db.listChildren(pico_id, callback);
            });
        }),


        listPolicies: mkKRLfn([
        ], function(ctx, args, callback){
            core.db.listPolicies(callback);
        }),


        listChannels: mkKRLfn([
            "pico_id",
        ], function(ctx, args, callback){

            var pico_id = picoArgOrCtxPico("listChannels", ctx, args);

            core.db.assertPicoID(pico_id, function(err, pico_id){
                if(err) return callback(err);

                core.db.listChannels(pico_id, callback);
            });
        }),


        listInstalledRIDs: mkKRLfn([
            "pico_id",
        ], function(ctx, args, callback){

            var pico_id = picoArgOrCtxPico("listInstalledRIDs", ctx, args);

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

            if(!_.has(args, "rid")){
                return callback(new Error("engine:describeRuleset needs a rid string"));
            }
            if(!ktypes.isString(args.rid)){
                return callback(new TypeError("engine:describeRuleset was given " + ktypes.toString(args.rid) + " instead of a rid string"));
            }

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

            var parent_id = picoArgOrCtxPico("newPico", ctx, args, "parent_id");

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

            var pico_id = picoArgOrCtxPico("removePico", ctx, args);

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


        newPolicy: mkKRLaction([
            "policy",
        ], function(ctx, args, callback){
            core.db.newPolicy(args.policy, callback);
        }),


        removePolicy: mkKRLaction([
            "policy_id",
        ], function(ctx, args, callback){
            var id = args.policy_id;
            if(!_.isString(id)){
                return callback(new TypeError("engine:removePolicy was given " + ktypes.toString(id) + " instead of a policy_id string"));
            }
            core.db.removePolicy(id, callback);
        }),


        newChannel: mkKRLaction([
            "pico_id",
            "name",
            "type",
        ], function(ctx, args, callback){

            var pico_id = picoArgOrCtxPico("newChannel", ctx, args);

            if(!_.has(args, "name")){
                return callback(new Error("engine:newChannel needs a name string"));
            }
            if(!_.has(args, "type")){
                return callback(new Error("engine:newChannel needs a type string"));
            }

            core.db.assertPicoID(pico_id, function(err, pico_id){
                if(err) return callback(err);

                core.db.newChannel({
                    pico_id: pico_id,
                    name: ktypes.toString(args.name),
                    type: ktypes.toString(args.type),
                    policy_id: ADMIN_POLICY_ID,
                }, callback);
            });
        }),


        removeChannel: mkKRLaction([
            "eci",
        ], function(ctx, args, callback){

            if(!_.has(args, "eci")){
                return callback(new Error("engine:removeChannel needs an eci string"));
            }
            if(!ktypes.isString(args.eci)){
                return callback(new TypeError("engine:removeChannel was given " + ktypes.toString(args.eci) + " instead of an eci string"));
            }

            core.db.removeChannel(args.eci, callback);
        }),


        registerRuleset: mkKRLaction([
            "url",
            "base",
        ], function(ctx, args, callback){

            if(!_.has(args, "url")){
                return callback(new Error("engine:registerRuleset needs a url string"));
            }
            if(!ktypes.isString(args.url)){
                return callback(new TypeError("engine:registerRuleset was given " + ktypes.toString(args.url) + " instead of a url string"));
            }

            var uri = ktypes.isString(args.base)
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

            if(!_.has(args, "rid")){
                return callback(new Error("engine:unregisterRuleset needs a rid string or array"));
            }
            if(ktypes.isString(args.rid)){
                return core.unregisterRuleset(args.rid, callback);
            }
            if(!ktypes.isArray(args.rid)){
                return callback(new TypeError("engine:unregisterRuleset was given " + ktypes.toString(args.rid) + " instead of a rid string or array"));
            }

            var rids = _.uniq(args.rid);

            var i;
            for(i=0; i < rids.length; i++){
                if(!ktypes.isString(rids[i])){
                    return callback(new TypeError("engine:unregisterRuleset was given a rid array containing a non-string (" + ktypes.toString(rids[i]) + ")"));
                }
            }

            async.eachSeries(rids, core.unregisterRuleset, callback);
        }),


        installRuleset: mkKRLaction([
            "pico_id",
            "rid",
            "url",
            "base",
        ], function(ctx, args, callback){

            var rid_given = _.has(args, "rid");
            if(!rid_given && !_.has(args, "url")){
                return callback(new Error("engine:installRuleset needs either a rid string or array, or a url string"));
            }

            var pico_id = picoArgOrCtxPico("installRuleset", ctx, args);

            var install = function(rid, callback){
                core.installRuleset(pico_id, rid, function(err){
                    callback(err, rid);
                });
            };

            core.db.assertPicoID(pico_id, function(err, pico_id){
                if(err) return callback(err);

                if(rid_given){
                    var ridIsString = ktypes.isString(args.rid);
                    if(!ridIsString && !ktypes.isArray(args.rid)){
                        return callback(new TypeError("engine:installRuleset was given " + ktypes.toString(args.rid) + " instead of a rid string or array"));
                    }
                    if(ridIsString){
                        return install(args.rid, callback);
                    }

                    var rids = _.uniq(args.rid);

                    var i;
                    for(i=0; i < rids.length; i++){
                        if(!ktypes.isString(rids[i])){
                            return callback(new TypeError("engine:installRuleset was given a rid array containing a non-string (" + ktypes.toString(rids[i]) + ")"));
                        }
                    }

                    return async.mapSeries(rids, install, callback);
                }

                if(!ktypes.isString(args.url)){
                    return callback(new TypeError("engine:installRuleset was given " + ktypes.toString(args.url) + " instead of a url string"));
                }
                var uri = ktypes.isString(args.base)
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
            });
        }),


        uninstallRuleset: mkKRLaction([
            "pico_id",
            "rid",
        ], function(ctx, args, callback){

            if(!_.has(args, "rid")){
                return callback(new Error("engine:uninstallRuleset needs a rid string or array"));
            }

            var pico_id = picoArgOrCtxPico("uninstallRuleset", ctx, args);

            var uninstall = function(rid, callback){
                core.uninstallRuleset(pico_id, rid, callback);
            };

            core.db.assertPicoID(pico_id, function(err, pico_id){
                if(err) return callback(err);

                var ridIsString = ktypes.isString(args.rid);
                if(!ridIsString && !ktypes.isArray(args.rid)){
                    return callback(new TypeError("engine:uninstallRuleset was given " + ktypes.toString(args.rid) + " instead of a rid string or array"));
                }
                if(ridIsString){
                    return uninstall(args.rid, callback);
                }

                var rids = _.uniq(args.rid);

                var i;
                for(i=0; i < rids.length; i++){
                    if(!ktypes.isString(rids[i])){
                        return callback(new TypeError("engine:uninstallRuleset was given a rid array containing a non-string (" + ktypes.toString(rids[i]) + ")"));
                    }
                }

                async.eachSeries(rids, uninstall, callback);
            });
        }),

    };

    return {
        def: fns,
    };
};
