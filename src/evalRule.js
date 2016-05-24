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
      //TODO collect errors and respond individually to the client
      if(err) return callback(err);

      if(response.type === 'directive'){
        callback(undefined, {
          type: 'directive',
          options: response.options,
          name: response.name,
          meta: {
            rid: rule.rid,
            rule_name: rule.rule_name,
            txn_id: 'TODO',//TODO transactions
            eid: ctx.event.eid
          }
        });
      }else{
        //TODO collect errors and respond individually to the client
        return callback(new Error('Invalid response type: ' + response.type));
      }

      if(_.isFunction(rule.always)){
        rule.always(ctx, function(err){
          if(err){
            //TODO better error handling
            console.error('rule_name: ' + rule.rule_name, err);
          }
        });
      }
    });
  });
};
