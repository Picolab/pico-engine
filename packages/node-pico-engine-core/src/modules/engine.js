var _ = require("lodash");
var cocb = require("co-callback");
var getArg = require("../getArg");

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
    addRuleset: cocb.toYieldable(function(ctx, args, callback){
        var opts = getArg(args, "opts", 0);
        return ctx.db.addRuleset(opts, callback);
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
