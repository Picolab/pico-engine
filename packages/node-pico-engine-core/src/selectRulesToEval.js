var _ = require("lodash");
var λ = require("contra");
var applyInFiber = require("./applyInFiber");

var evalExpr = function(ctx, exp, callback){
  if(_.isArray(exp)){
    if(exp[0] === "not"){
      return !evalExpr(ctx, exp[1]);
    }else if(exp[0] === "and"){
      return evalExpr(ctx, exp[1]) && evalExpr(ctx, exp[2]);
    }else if(exp[0] === "or"){
      return evalExpr(ctx, exp[1]) || evalExpr(ctx, exp[2]);
    }
  }
  //only run the function if the domain and type match
  var domain = ctx.event.domain;
  var type = ctx.event.type;
  if(_.get(ctx, ["rule", "select", "graph", domain, type, exp]) !== true){
    return false;
  }
  return ctx.rule.select.eventexprs[exp](ctx);
};

var getNextState = function(ctx, curr_state){
  var stm = ctx.rule.select.state_machine[curr_state];

  var matching_pair = _.find(stm, function(s){
    return evalExpr(ctx, s[0]);
  });

  return matching_pair ? matching_pair[1] : undefined;
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
        var rule = _.get(rulesets, [rid, "rules", rule_name]);
        if(rule){
          //shallow clone with it"s own scope for this run
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

      applyInFiber(getNextState, null, [_.assign({}, ctx, {
        rule: rule,
        scope: rule.scope
      }), curr_state], function(err, next_state){
        if(err) return next(err);

        ctx.db.putStateMachineState(ctx.pico.id, rule, next_state, function(err){
          next(err, next_state === "end");
        });
      });
    });
  }, callback);
};
