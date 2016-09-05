var getArg = require("../getArg");

module.exports = {
  newPico: function(ctx, args){
    var opts = getArg(args, "opts", 0);
    return ctx.db.newPicoFuture(opts).wait();
  },
  newChannel: function(ctx, args){
    var opts = getArg(args, "opts", 0);
    return ctx.db.newChannelFuture(opts).wait();
  }
};
