var _ = require('lodash');
var λ = require('contra');

module.exports = function(db, rulesets, rid, fn_name, args, callback){
  if(!_.has(rulesets, rid)){
    return callback(new Error('Not found: rid'));
  }
  if(!_.has(rulesets[rid].provided_query_fns, fn_name)){
    return callback(new Error('Not found: function'));
  }
  var fn = rulesets[rid].provided_query_fns[fn_name];
  if(!_.isFunction(fn)){
    return callback(new Error('Not a function'));
  }

  fn({args: args, db: db}, callback);
};
