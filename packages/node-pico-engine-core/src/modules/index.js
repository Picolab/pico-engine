var eventGetAttr = function(ctx, args){
  return ctx.event.getAttr(args[0]);
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
    }
    throw new Error("Not defined `" + domain + ":" + id + "`");
  }
};
