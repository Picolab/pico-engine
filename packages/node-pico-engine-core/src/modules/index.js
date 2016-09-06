var _ = require("lodash");

var modules = {
  ent: require("./ent"),
  app: require("./app"),
  event: require("./event"),
  engine: require("./engine")
};

module.exports = {
  get: function(ctx, domain, id){
    if(_.has(modules, domain)){
      if(_.has(modules[domain], "get")){
        return modules[domain].get(ctx, id);
      }
    }
    throw new Error("Not defined `" + domain + ":" + id + "`");
  },
  set: function(ctx, domain, id, value){
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
