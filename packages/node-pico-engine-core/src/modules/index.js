var _ = require("lodash");
var getArg = require("../getArg");

var eventGetAttr = function(ctx, args){
  var name = getArg(args, "name", 0);
  return ctx.event.getAttr(name);
};

var modules = {
  engine: require("./engine")
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
    if(_.has(modules, domain)){
      if(_.has(modules[domain], "get")){
        return modules[domain].get(ctx, id);
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
    if(_.has(modules, domain)){
      if(_.has(modules[domain], "set")){
        modules[domain].set(ctx, id, value);
        return;
      }
      throw new Error("Cannot assign to `" + domain + ":*`");
    }
    throw new Error("Not defined `" + domain + ":" + id + "`");
  }
};
