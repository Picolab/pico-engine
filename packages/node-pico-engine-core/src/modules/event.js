var getArg = require("../getArg");

var eventGetAttr = function(ctx, args){
  var name = getArg(args, "name", 0);
  return ctx.event.attrs[name];
};

var attrMatches = function(ctx, args){
  var pairs = getArg(args, "pairs", 0);
  var matches = [];
  var i, attr, m, pair;
  for(i = 0; i < pairs.length; i++){
    pair = pairs[i];
    attr = ctx.event.attrs[pair[0]];
    m = pair[1].exec(attr || "");
    if(!m){
      return undefined;
    }
    matches.push(m[1]);
  }
  return matches;
};

module.exports = {
  get: function(ctx, id){
    if(id === "attr"){
      return eventGetAttr;
    }else if(id === "attrMatches"){
      return attrMatches;
    }
  },
  set: function(ctx, id, value){
    ctx.db.putAppVarFuture(ctx.rid, id, value).wait();
  }
};
