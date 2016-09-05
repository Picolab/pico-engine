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
  installRID: function(ctx, args){
    var rid = getArg(args, "rid", 0);
    return ctx.engine.installRIDFuture(rid).wait();
  },
  signalEvent: function(ctx, args){
    var event = getArg(args, "event", 0);
    return ctx.engine.signalEventFuture(event).wait();
  }
};

module.exports = {
  get: function(ctx, id){
    return fns[id];
  }
};
