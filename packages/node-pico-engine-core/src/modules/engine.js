var _ = require("lodash");
var url = require("url");
var cocb = require("co-callback");
var getArg = require("../getArg");

var installRulesetAndValidateIds = function(db, pico_id, rid, callback){
    db.getPico(pico_id, function(err, pico){
        if(err) return callback(err);
        if(!pico) return callback(new Error("invalid pico_id"));

        db.hasEnabledRid(rid, function(err, has){
            if(err) return callback(err);
            if(!has) return callback(new Error("invalid rid"));

            db.addRuleset({
                pico_id: pico_id,
                rid: rid
            }, callback);
        });
    });
};

var fns = {
    newPico: cocb.toYieldable(function(ctx, args, callback){
        var opts = getArg(args, "opts", 0);
        return ctx.db.newPico(opts, callback);
    }),
    removePico: cocb.toYieldable(function(ctx, args, callback){
        var id = getArg(args, "id", 0);
        return ctx.db.removePico(id, callback);
    }),
    newChannel: cocb.toYieldable(function(ctx, args, callback){
        var opts = getArg(args, "opts", 0);
        return ctx.db.newChannel(opts, callback);
    }),
    installRuleset: cocb.toYieldable(function(ctx, args, callback){
        var opts = getArg(args, "opts", 0);

        var pico_id = opts.pico_id;
        var rid = opts.rid;
        var uri;
        if(_.isString(opts.url)){
            uri = _.isString(opts.base)
                ? url.resolve(opts.url, opts.base)
                : opts.url;
        }
        if(!_.isString(pico_id) || (!_.isString(rid) && !_.isString(uri))){
            return callback(new Error("installRuleset expects, pico_id and rid or url+base"));
        }

        var doIt = function(rid){
            installRulesetAndValidateIds(ctx.db, pico_id, rid, function(err){
                callback(err, rid);
            });
        };

        if(_.isString(rid)){
            return doIt(rid);
        }
        ctx.db.findRulesetsByURL(uri, function(err, results){
            if(err) return callback(err);
            var rids = _.uniq(_.map(results, "rid"));
            if(_.size(rids) !== 1){
                return callback(new Error("Could not find the one ruleset"));
            }
            doIt(_.head(rids));
        });
    }),
    signalEvent: cocb.toYieldable(function(ctx, args, callback){
        var event = getArg(args, "event", 0);
        //this should enqueue the event and not wait for the response
        ctx.signalEvent(event, _.noop);//ingore the response to the event
        callback();
    })
};

module.exports = {
    def: fns
};
