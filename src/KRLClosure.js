var _ = require("lodash");

module.exports = function(ctx, fn){
  return function(ctx2, args){
    return fn(_.assign({}, ctx2, {
      scope: ctx.scope.push(),
      args: args
    }));
  };
};
