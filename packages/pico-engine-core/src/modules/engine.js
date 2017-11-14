var _ = require("lodash");
var async = require("async");
var urllib = require("url");
var ktypes = require("krl-stdlib/types");
var mkKRLfn = require("../mkKRLfn");
var mkKRLaction = require("../mkKRLaction");

module.exports = function(core){
    var assertPicoID = function(pico_id, fnName, callback, onOk, idDescription="a pico_id"){
        core.db.assertPicoID(pico_id, function(err, pico_id){
            if(err){
                //intercept type error from DB.js
                if((err + "").substring(0, 22) === "Error: Invalid pico_id"){
                    return callback(new TypeError("engine:" + fnName + " was given " + ktypes.toString(pico_id) + " instead of " + idDescription + " string"));
                }
                return callback(err);
            }

            onOk();
        });
    };

    var fns = {

        getPicoIDByECI: mkKRLfn([
            "eci",
        ], function(args, ctx, callback){

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

            var pico_id;
            if(_.has(args, "pico_id")){
                pico_id = args.pico_id;
            }else{
                pico_id = ctx.pico_id;
            }

            assertPicoID(pico_id, "getParent", callback, function(){
                core.db.getParent(pico_id, callback);
            });
        }),


        getAdminECI: mkKRLfn([
            "pico_id",
        ], function(ctx, args, callback){

            var pico_id;
            if(_.has(args, "pico_id")){
                pico_id = args.pico_id;
            }else{
                pico_id = ctx.pico_id;
            }

            assertPicoID(pico_id, "getAdminECI", callback, function(){
                core.db.getAdminECI(pico_id, callback);
            });
        }),


        listChildren: mkKRLfn([
            "pico_id",
        ], function(ctx, args, callback){

            var pico_id;
            if(_.has(args, "pico_id")){
                pico_id = args.pico_id;
            }else{
                pico_id = ctx.pico_id;
            }

            assertPicoID(pico_id, "listChildren", callback, function(){
                core.db.listChildren(pico_id, callback);
            });
        }),


        listChannels: mkKRLfn([
            "pico_id",
        ], function(ctx, args, callback){

            var pico_id;
            if(_.has(args, "pico_id")){
                pico_id = args.pico_id;
            }else{
                pico_id = ctx.pico_id;
            }

            assertPicoID(pico_id, "listChannels", callback, function(){
                core.db.listChannels(pico_id, callback);
            });
        }),


        listInstalledRIDs: mkKRLfn([
            "pico_id",
        ], function(ctx, args, callback){

            var pico_id;
            if(_.has(args, "pico_id")){
                pico_id = args.pico_id;
            }else{
                pico_id = ctx.pico_id;
            }

            assertPicoID(pico_id, "listInstalledRIDs", callback, function(){
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
        ], function(args, ctx, callback){

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

            var parent_id;
            if(_.has(args, "parent_id")){
                parent_id = args.parent_id;
            }else{
                parent_id = ctx.pico_id;
            }

            assertPicoID(parent_id, "newPico", callback, function(){
                core.db.newPico({
                    parent_id: parent_id,
                }, callback);
            }, "a parent_id");
        }),


        removePico: mkKRLaction([
            "pico_id",
        ], function(ctx, args, callback){

            var pico_id;
            if(_.has(args, "pico_id")){
                pico_id = args.pico_id;
            }else{
                pico_id = ctx.pico_id;
            }

            assertPicoID(pico_id, "removePico", callback, function(){
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

            if(!_.has(args, "name")){
                return callback(new Error("engine:newChannel needs a name string"));
            }
            if(!_.has(args, "type")){
                return callback(new Error("engine:newChannel needs a type string"));
            }

            var pico_id;
            if(_.has(args, "pico_id")){
                pico_id = args.pico_id;
            }else{
                pico_id = ctx.pico_id;
            }

            assertPicoID(pico_id, "newChannel", callback, function(){
                core.db.newChannel({
                    pico_id: pico_id,
                    name: ktypes.toString(args.name),
                    type: ktypes.toString(args.type),
                }, callback);
            });
        }),


        removeChannel: mkKRLaction([
            "eci",
        ], function(args, ctx, callback){

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
        ], function(args, ctx, callback){

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
        ], function(args, ctx, callback){

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

            var pico_id;
            if(_.has(args, "pico_id")){
                pico_id = args.pico_id;
            }else{
                pico_id = ctx.pico_id;
            }

            var install = function(rid, callback){
                core.installRuleset(pico_id, rid, function(err){
                    callback(err, rid);
                });
            };

            assertPicoID(pico_id, "installRuleset", callback, function(){
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
        ], function(args, ctx, callback){

            if(!_.has(args, "rid")){
                return callback(new Error("engine:uninstallRuleset needs a rid string or array"));
            }

            var pico_id;
            if(_.has(args, "pico_id")){
                pico_id = args.pico_id;
            }else{
                pico_id = ctx.pico_id;
            }

            var uninstall = function(rid, callback){
                core.uninstallRuleset(pico_id, rid, callback);
            };

            assertPicoID(pico_id, "uninstallRuleset", callback, function(){
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
