var _ = require('lodash');

var pre_noop = function(ctx, callback){
  callback(undefined, {});
};

module.exports = function(rule, ctx, callback){

  var pre = _.isFunction(rule.pre) ? rule.pre : pre_noop;

  pre(ctx, function(err, new_vars){
    if(err) return callback(err);

    ctx.vars = _.assign({}, ctx.vars, new_vars);

    rule.action(ctx, function(err, response){
      if(err) return callback(err);

      callback(undefined, {
        options: response.data,
        name: response.name,
        meta: ctx.meta 
      });

      if(_.isFunction(rule.always)){
        rule.always(ctx, function(err){
          if(err){
            //TODO better error handling
            console.error('rule_name: ' + ctx.meta.rule_name, err);
          }
        });
      }
    });
  });
};
