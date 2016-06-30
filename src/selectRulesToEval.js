var _ = require('lodash');
var λ = require('contra');
var contraFind = require('contra-find');
var applyInFiber = require('./applyInFiber');

var evalExpr = function(ctx, exp, callback){
  if(_.isArray(exp)){
    if(exp[0] === 'not'){
      evalExpr(ctx, exp[1], function(err, is_match){
        if(err) return callback(err);
        callback(undefined, !is_match);
      });
      return;
    }else if(exp[0] === 'and'){
      evalExpr(ctx, exp[1], function(err, is_a){
        if(err) return callback(err);
        if(!is_a){
          callback(undefined, false);
          return;
        }
        evalExpr(ctx, exp[2], callback);
      });
      return;
    }else if(exp[0] === 'or'){
      evalExpr(ctx, exp[1], function(err, is_a){
        if(err) return callback(err);
        if(is_a){
          callback(undefined, true);
          return;
        }
        evalExpr(ctx, exp[2], callback);
      });
      return;
    }
  }
  //only run the function if the domain and type match
  var domain = ctx.event.domain;
  var type = ctx.event.type;
  if(_.get(ctx, ['rule', 'select', 'graph', domain, type, exp]) !== true){
    return callback(undefined, false);
  }
  applyInFiber(ctx.rule.select.eventexprs[exp], null, [ctx], callback);
};

var getNextState = function(ctx, curr_state, callback){
  //TODO if we are going to stick with fibers
  //TODO then remove contraFind and the async evalExpr
  var stm = ctx.rule.select.state_machine[curr_state];

  contraFind(λ, stm, function(s, next){
    evalExpr(ctx, s[0], next);
  }, function(err, matching_pair){
    if(err) return callback(err);

    var next_state = matching_pair ? matching_pair[1] : undefined;

    callback(undefined, next_state);
  });
};

module.exports = function(ctx, salience_graph, rulesets, callback){

  var to_run = _.get(salience_graph, [ctx.event.domain, ctx.event.type], {});

  var rules_to_select = [];
  _.each(to_run, function(rules, rid){
    if(!_.has(ctx.pico.ruleset, rid)){
      return;
    }
    _.each(rules, function(is_on, rule_name){
      if(is_on){
        var rule = _.get(rulesets, [rid, 'rules', rule_name]);
        if(rule){
          //shallow clone with it's own scope for this run
          rules_to_select.push(_.assign({}, rule, {
            scope: rulesets[rid].scope.push()
          }));
        }
      }
    });
  });

  λ.filter(rules_to_select, function(rule, next){
    ctx.db.getStateMachineState(ctx.pico.id, rule, function(err, curr_state){
      if(err) return next(err);

      getNextState(_.assign({}, ctx, {
        rule: rule,
        scope: rule.scope
      }), curr_state, function(err, next_state){
        if(err) return next(err);

        ctx.db.putStateMachineState(ctx.pico.id, rule, next_state, function(err){
          next(err, next_state === 'end');
        });
      });
    });
  }, callback);
};
