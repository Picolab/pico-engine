var _ = require('lodash');

module.exports = function(ctx, rulesets, callback){
  if(!_.has(rulesets, ctx.rid)){
    return callback(new Error('Not found: rid'));
  }
  if(!_.has(rulesets[ctx.rid].provided_query_fns, ctx.fn_name)){
    return callback(new Error('Not found: function'));
  }
  var fn = rulesets[ctx.rid].provided_query_fns[ctx.fn_name];
  if(!_.isFunction(fn)){
    return callback(new Error('Not a function'));
  }

  fn(ctx, callback);
};
