var _ = require("lodash");
var getArg = require("../getArg");

var fns = {
    newPico: function(ctx, args){
        var opts = getArg(args, "opts", 0);
        return ctx.db.newPicoFuture(opts).wait();
    },
    removePico: function(ctx, args) {
        var id = getArg(args, "id", 0);
        return ctx.db.removePicoFuture(id).wait();
    },
    newChannel: function(ctx, args){
        var opts = getArg(args, "opts", 0);
        return ctx.db.newChannelFuture(opts).wait();
    },
    addRuleset: function(ctx, args){
        var opts = getArg(args, "opts", 0);
        return ctx.db.addRulesetFuture(opts).wait();
    },
    signalEvent: function(ctx, args){
        var event = getArg(args, "event", 0);
        //this should enqueue the event and not wait for the response
        ctx.signalEvent(event, _.noop);//ingore the response to the event
    }
};

module.exports = {
    get: function(ctx, id){
        return fns[id];
    }
};
