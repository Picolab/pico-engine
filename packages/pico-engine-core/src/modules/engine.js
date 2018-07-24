var _ = require("lodash");
var bs58 = require("bs58");
var async = require("async");
var urllib = require("url");
var ktypes = require("krl-stdlib/types");
var mkKRLfn = require("../mkKRLfn");
var sovrinDID = require("sovrin-did");
var mkKRLaction = require("../mkKRLaction");
var ADMIN_POLICY_ID = require("../DB").ADMIN_POLICY_ID;

var assertArg = function(fnName, args, key, type){
    if( ! _.has(args, key)){
        throw new Error("engine:" + fnName + " argument `" + key + "` " + type + " is required");
    }
    if(ktypes.typeOf(args[key]) !== type){
        throw new TypeError("engine:" + fnName + " argument `" + key + "` should be " + type + " but was " + ktypes.typeOf(args[key]));
    }
    return args[key];
};

var picoArgOrCtxPico = function(fnName, ctx, args, key){
    key = key || "pico_id";
    var picoId = _.has(args, key) ? args[key] : ctx.pico_id;
    if(!ktypes.isString(picoId)){
        throw new TypeError("engine:" + fnName + " was given " + ktypes.toString(args.eci) + " instead of a " + key + " string");
    }
    return picoId;
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

            core.db.getPicoIDByECI(args.eci, function(err, pico){
                if(err && err.notFound) return callback();
                if(err) return callback(err);
                callback(null, pico);
            });
        }),


        getParent: mkKRLfn([
            "pico_id",
        ], function(ctx, args, callback){

            var picoId = picoArgOrCtxPico("getParent", ctx, args);

            core.db.assertPicoID(picoId, function(err, picoId){
                if(err && err.notFound) return callback();
                if(err) return callback(err);

                core.db.getParent(picoId, function(err, parentId){
                    if(err && err.notFound) return callback();
                    if(err) return callback(err);
                    callback(null, parentId);
                });
            });
        }),


        getAdminECI: mkKRLfn([
            "pico_id",
        ], function(ctx, args, callback){

            var picoId = picoArgOrCtxPico("getAdminECI", ctx, args);

            core.db.assertPicoID(picoId, function(err, picoId){
                if(err && err.notFound) return callback();
                if(err) return callback(err);

                core.db.getAdminECI(picoId, function(err, eci){
                    if(err && err.notFound) return callback();
                    if(err) return callback(err);
                    callback(null, eci);
                });
            });
        }),


        listChildren: mkKRLfn([
            "pico_id",
        ], function(ctx, args, callback){

            var picoId = picoArgOrCtxPico("listChildren", ctx, args);

            core.db.assertPicoID(picoId, function(err, picoId){
                if(err && err.notFound) return callback();
                if(err) return callback(err);

                core.db.listChildren(picoId, function(err, children){
                    if(err && err.notFound) return callback();
                    if(err) return callback(err);
                    callback(null, children);
                });
            });
        }),


        listPolicies: mkKRLfn([
        ], function(ctx, args, callback){
            core.db.listPolicies(callback);
        }),


        listChannels: mkKRLfn([
            "pico_id",
        ], function(ctx, args, callback){

            var picoId = picoArgOrCtxPico("listChannels", ctx, args);

            core.db.assertPicoID(picoId, function(err, picoId){
                if(err && err.notFound) return callback();
                if(err) return callback(err);

                core.db.listChannels(picoId, callback);
            });
        }),


        listInstalledRIDs: mkKRLfn([
            "pico_id",
        ], function(ctx, args, callback){

            var picoId = picoArgOrCtxPico("listInstalledRIDs", ctx, args);

            core.db.assertPicoID(picoId, function(err, picoId){
                if(err && err.notFound) return callback();
                if(err) return callback(err);

                core.db.ridsOnPico(picoId, function(err, ridSet){
                    if(err && err.notFound) return callback();
                    if(err) return callback(err);
                    callback(null, _.keys(ridSet));
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
                if(err && err.notFound) return callback();
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

            var parentId = picoArgOrCtxPico("newPico", ctx, args, "parent_id");

            core.db.assertPicoID(parentId, function(err, parentId){
                if(err) return callback(err);

                core.db.newPico({
                    parent_id: parentId,
                }, callback);
            });
        }),


        removePico: mkKRLaction([
            "pico_id",
        ], function(ctx, args, callback){

            var picoId = picoArgOrCtxPico("removePico", ctx, args);

            core.db.assertPicoID(picoId, function(err, picoId){
                if(err && err.notFound) return callback(null, false);
                if(err) return callback(err);

                core.db.listChildren(picoId, function(err, children){
                    if(err) return callback(err);
                    if(_.size(children) > 0){
                        callback(new Error("Cannot remove pico \"" + picoId + "\" because it has " + _.size(children) + " children"));
                        return;
                    }
                    core.db.removePico(picoId, function(){
                        if(err && err.notFound) return callback(null, false);
                        if(err) return callback(err);
                        callback(null, true);
                    });
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
            core.db.removePolicy(id, function(err){
                if(err && err.notFound) return callback(null, false);
                if(err) return callback(err);
                callback(null, true);
            });
        }),


        newChannel: mkKRLaction([
            "pico_id",
            "name",
            "type",
            "policy_id",
        ], function(ctx, args, callback){

            var picoId = picoArgOrCtxPico("newChannel", ctx, args);
            var policyId = ADMIN_POLICY_ID;

            if(_.has(args, "policy_id")){
                if(!ktypes.isString(args.policy_id)){
                    throw new TypeError("engine:newChannel argument `policy_id` should be String but was " + ktypes.typeOf(args.policy_id));
                }
                policyId = args.policy_id;
            }

            if(!_.has(args, "name")){
                return callback(new Error("engine:newChannel needs a name string"));
            }
            if(!_.has(args, "type")){
                return callback(new Error("engine:newChannel needs a type string"));
            }

            core.db.assertPicoID(picoId, function(err, picoId){
                if(err) return callback(err);

                core.db.assertPolicyID(policyId, function(err, policyId){
                    if(err) return callback(err);

                    core.db.newChannel({
                        pico_id: picoId,
                        name: ktypes.toString(args.name),
                        type: ktypes.toString(args.type),
                        policy_id: policyId,
                    }, callback);
                });
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

            core.db.removeChannel(args.eci, function(err){
                if(err && err.notFound)return callback(null, false);
                if(err)return callback(err);
                callback(null, true);
            });
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

            var ridGiven = _.has(args, "rid");
            if(!ridGiven && !_.has(args, "url")){
                return callback(new Error("engine:installRuleset needs either a rid string or array, or a url string"));
            }

            var picoId = picoArgOrCtxPico("installRuleset", ctx, args);

            var install = function(rid, callback){
                core.installRuleset(picoId, rid, function(err){
                    callback(err, rid);
                });
            };

            core.db.assertPicoID(picoId, function(err, picoId){
                if(err) return callback(err);

                if(ridGiven){
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

            var picoId = picoArgOrCtxPico("uninstallRuleset", ctx, args);

            var uninstall = function(rid, callback){
                core.uninstallRuleset(picoId, rid, callback);
            };

            core.db.assertPicoID(picoId, function(err, picoId){
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

        encryptChannelMessage: mkKRLfn([
            "eci",
            "message",
            "otherPublicKey"
        ], function(ctx, args, callback){
            var eci = assertArg("encryptChannelMessage", args, "eci", "String");
            var message = assertArg("encryptChannelMessage", args, "message", "String");
            var otherPublicKey = assertArg("encryptChannelMessage", args, "otherPublicKey", "String");

            core.db.encryptChannelMessage(eci, message, otherPublicKey, callback);
        }),

        decryptChannelMessage: mkKRLfn([
            "eci",
            "encryptedMessage",
            "nonce",
            "otherPublicKey"
        ], function(ctx, args, callback){
            var eci = assertArg("decryptChannelMessage", args, "eci", "String");
            var encryptedMessage = assertArg("decryptChannelMessage", args, "encryptedMessage", "String");
            var nonce = assertArg("decryptChannelMessage", args, "nonce", "String");
            var otherPublicKey = assertArg("decryptChannelMessage", args, "otherPublicKey", "String");

            core.db.decryptChannelMessage(eci, encryptedMessage, nonce, otherPublicKey, callback);
        }),

        signChannelMessage: mkKRLfn([
            "eci",
            "message",
        ], function(ctx, args, callback){
            var eci = assertArg("signChannelMessage", args, "eci", "String");
            var message = assertArg("signChannelMessage", args, "message", "String");

            core.db.signChannelMessage(eci, message, callback);
        }),

        verifySignedMessage: mkKRLfn([
            "verifyKey",
            "message",
        ], function(ctx, args, callback){
            var verifyKey = assertArg("verifySignedMessage", args, "verifyKey", "String");
            var message = assertArg("verifySignedMessage", args, "message", "String");

            try{
                message = bs58.decode(message);
                message = sovrinDID.verifySignedMessage(message, verifyKey);
                if(message === false) throw "failed";
            }catch(e){
                callback(null, false);
                return;
            }

            callback(null, message);
        }),

    };

    return {
        def: fns,
    };
};
