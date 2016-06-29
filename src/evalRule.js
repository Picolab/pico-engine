var _ = require('lodash');
var λ = require('contra');

var pre_noop = function(ctx, callback){
  callback(undefined, {});
};

var doActions = function(rule, ctx, callback){
  var actions = _.get(rule, ['action_block', 'actions']);
  λ.map(actions, function(action, done){
    action(ctx, done);
  }, callback);
};

module.exports = function(rule, ctx, callback){

  var pre = _.isFunction(rule.pre) ? rule.pre : pre_noop;

  pre(ctx, function(err, new_vars){
    if(err) return callback(err);

    ctx.vars = _.assign({}, ctx.vars, new_vars);

    doActions(rule, ctx, function(err, responses){
      //TODO collect errors and respond individually to the client
      if(err) return callback(err);

      //TODO handle more than one response type
      callback(undefined, _.map(responses, function(response){
        return {
          type: 'directive',
          options: response.options,
          name: response.name,
          meta: {
            rid: rule.rid,
            rule_name: rule.rule_name,
            txn_id: 'TODO',//TODO transactions
            eid: ctx.event.eid
          }
        };
      }));

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
