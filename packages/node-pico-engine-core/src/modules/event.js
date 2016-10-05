var getArg = require("../getArg");

var fns = {
  attr: function(ctx, args){
    var name = getArg(args, "name", 0);
    return ctx.event.attrs[name];
  },
  attrMatches: function(ctx, args){
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
  },
  send: function(ctx, args){
    //TODO
  }
};

module.exports = {
  get: function(ctx, id){
    return fns[id];
  }
};
