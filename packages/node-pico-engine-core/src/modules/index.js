var _ = require("lodash");

var eventGetAttr = function(ctx, args){
  return ctx.event.getAttr(_.first(args));
};

var engine = {
  newPico: function(ctx, args){
    var opts = _.first(args);//TODO use getArg
    return ctx.db.newPicoFuture(opts).wait();
  },
  newChannel: function(ctx, args){
    var opts = _.first(args);//TODO use getArg
    return ctx.db.newChannelFuture(opts).wait();
  }
};

module.exports = {
  get: function(ctx, domain, id){
    if(domain === "ent"){
      return ctx.db.getEntVarFuture(ctx.pico.id, ctx.rid, id).wait();
    }else if(domain === "app"){
      return ctx.db.getAppVarFuture(ctx.rid, id).wait();
    }else if(domain === "event"){
      if(id === "attr"){
        return eventGetAttr;
      }
    }else if(domain === "engine"){
      if(_.has(engine, id)){
        return engine[id];
      }
    }
    throw new Error("Not defined `" + domain + ":" + id + "`");
  },
  set: function(ctx, domain, id, value){
    if(domain === "ent"){
      ctx.db.putEntVarFuture(ctx.pico.id, ctx.rid, id, value).wait();
      return;
    }else if(domain === "app"){
      ctx.db.putAppVarFuture(ctx.rid, id, value).wait();
      return;
    }else if(domain === "event"){
      throw new Error("Cannot assign to `event:*`");
    }else if(domain === "engine"){
      throw new Error("Cannot assign to `engine:*`");
    }
    throw new Error("Not defined `" + domain + ":" + id + "`");
  }
};
