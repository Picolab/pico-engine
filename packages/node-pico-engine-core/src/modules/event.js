var getArg = require("../getArg");

var eventGetAttr = function(ctx, args){
  var name = getArg(args, "name", 0);
  return ctx.event.getAttr(name);
};

module.exports = {
  get: function(ctx, id){
    if(id === "attr"){
      return eventGetAttr;
    }
  },
  set: function(ctx, id, value){
    ctx.db.putAppVarFuture(ctx.rid, id, value).wait();
  }
};
