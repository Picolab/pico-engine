var _ = require('lodash');

module.exports = function(rule, ctx, callback){

  var runAction = function(){
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
  };

  if(_.isFunction(rule.pre)){
    rule.pre(ctx, function(err, new_vars){
      if(err) return callback(err);

      ctx.vars = _.assign({}, ctx.vars, new_vars);

      runAction();
    });
  }else{
    runAction();
  }
};
