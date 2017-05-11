var _ = require("lodash");
var urllib = require("url");
var mkKRLfn = require("../mkKRLfn");

var installRulesetAndValidateIds = function(db, pico_id, rid, callback){
    db.getPico(pico_id, function(err, pico){
        if(err) return callback(err);
        if(!pico) return callback(new Error("Invalid pico_id: " + pico_id));

        db.hasEnabledRid(rid, function(err, has){
            if(err) return callback(err);
            if(!has) return callback(new Error("This rid is not found and/or enabled: " + rid));

            db.addRulesetToPico(pico_id, rid, callback);
        });
    });
};

module.exports = function(core){
    var fns = {
        newPico: mkKRLfn([
            "opts",
        ], function(args, ctx, callback){
            core.db.newPico(args.opts, callback);
        }),
        removePico: mkKRLfn([
            "id",
        ], function(args, ctx, callback){
            core.db.removePico(args.id, callback);
        }),
        newChannel: mkKRLfn([
            "opts",
        ], function(args, ctx, callback){
            core.db.newChannel(args.opts, callback);
        }),
        removeChannel: mkKRLfn([
            "opts",
        ], function(args, ctx, callback){
            var opts = args.opts;
            core.db.removeChannel(opts.pico_id, opts.eci, callback);
        }),
        registerRuleset: mkKRLfn([
            "opts",
        ], function(args, ctx, callback){
            var opts = args.opts;
            var uri;
            if(_.isString(opts.url)){
                uri = _.isString(opts.base)
                    ? urllib.resolve(opts.base, opts.url)
                    : opts.url;
            }
            if(!_.isString(uri)){
                return callback(new Error("registerRuleset expects, pico_id and rid or url+base"));
            }
            core.registerRulesetURL(uri, function(err, data){
                if(err) return callback(err);
                callback(null, data.rid);
            });
        }),
        installRuleset: mkKRLfn([
            "opts",
        ], function(args, ctx, callback){
            var opts = args.opts;

            var pico_id = opts.pico_id;
            var rid = opts.rid;
            var uri;
            if(_.isString(opts.url)){
                uri = _.isString(opts.base)
                    ? urllib.resolve(opts.base, opts.url)
                    : opts.url;
            }
            if(!_.isString(pico_id) || (!_.isString(rid) && !_.isString(uri))){
                return callback(new Error("installRuleset expects, pico_id and rid or url+base"));
            }

            var doIt = function(rid){
                installRulesetAndValidateIds(core.db, pico_id, rid, function(err){
                    callback(err, rid);
                });
            };

            if(_.isString(rid)){
                return doIt(rid);
            }
            core.db.findRulesetsByURL(uri, function(err, results){
                if(err) return callback(err);
                var rids = _.uniq(_.map(results, "rid"));
                if(_.size(rids) === 0){
                    core.registerRulesetURL(uri, function(err, data){
                        if(err) return callback(err);
                        doIt(data.rid);
                    });
                    return;
                }
                if(_.size(rids) !== 1){
                    return callback(new Error("More than one rid found for the given url: " + rids.join(" , ")));
                }
                doIt(_.head(rids));
            });
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
