var _ = require("lodash");
var url = require("url");
var cocb = require("co-callback");
var getArg = require("../getArg");
var request = require("request");

var installRulesetAndValidateIds = function(db, pico_id, rid, callback){
    db.getPico(pico_id, function(err, pico){
        if(err) return callback(err);
        if(!pico) return callback(new Error("Invalid pico_id: " + pico_id));

        db.hasEnabledRid(rid, function(err, has){
            if(err) return callback(err);
            if(!has) return callback(new Error("This rid is not found and/or enabled: " + rid));

            db.addRuleset({
                pico_id: pico_id,
                rid: rid
            }, callback);
        });
    });
};

var httpGetKRL = function(url, callback){
    request(url, function(err, resp, body){
        if(err)
            return callback(err);
        if(resp.statusCode !== 200)
            return callback(new Error("Got a statusCode=" + resp.statusCode + " for: " + url));

        callback(null, body);
    });
};

var registerURL = function(ctx, url, callback){
    httpGetKRL(url, function(err, src){
        if(err) return callback(err);
        ctx.registerRulesetSrc(src, {
            url: url
        }, function(err, data){
            if(err) return callback(err);
            callback(null, data.rid);
        });
    });
};

var fns = {
    newPico: cocb.toYieldable(function(ctx, args, callback){
        var opts = getArg(args, "opts", 0);
        ctx.db.newPico(opts, callback);
    }),
    removePico: cocb.toYieldable(function(ctx, args, callback){
        var id = getArg(args, "id", 0);
        ctx.db.removePico(id, callback);
    }),
    newChannel: cocb.toYieldable(function(ctx, args, callback){
        var opts = getArg(args, "opts", 0);
        ctx.db.newChannel(opts, callback);
    }),
    registerRuleset: cocb.toYieldable(function(ctx, args, callback){
        var opts = getArg(args, "opts", 0);
        var uri;
        if(_.isString(opts.url)){
            uri = _.isString(opts.base)
                ? url.resolve(opts.base, opts.url)
                : opts.url;
        }
        if(!_.isString(uri)){
            return callback(new Error("registerRuleset expects, pico_id and rid or url+base"));
        }
        registerURL(ctx, uri, callback);
    }),
    installRuleset: cocb.toYieldable(function(ctx, args, callback){
        var opts = getArg(args, "opts", 0);

        var pico_id = opts.pico_id;
        var rid = opts.rid;
        var uri;
        if(_.isString(opts.url)){
            uri = _.isString(opts.base)
                ? url.resolve(opts.base, opts.url)
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
            if(_.size(rids) === 0){
                registerURL(ctx, uri, function(err, rid){
                    if(err) return callback(err);
                    doIt(rid);
                });
                return;
            }
            if(_.size(rids) !== 1){
                return callback(new Error("More than one rid found for the given url: " + rids.join(" , ")));
            }
            doIt(_.head(rids));
        });
    })
};

module.exports = {
    def: fns
};
