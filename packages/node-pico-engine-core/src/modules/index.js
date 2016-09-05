var _ = require("lodash");
var getArg = require("../getArg");
var engine = require("./engine");

var eventGetAttr = function(ctx, args){
  var name = getArg(args, "name", 0);
  return ctx.event.getAttr(name);
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
