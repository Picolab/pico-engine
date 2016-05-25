var _ = require('lodash');
var λ = require('contra');

var evalExpr = function(fns, ctx, exp){
  if(_.isArray(exp)){
    if(exp[0] === 'not'){
      return !evalExpr(fns, ctx, exp[1]);
    }else if(exp[0] === 'and'){
      return evalExpr(fns, ctx, exp[1]) && evalExpr(fns, ctx, exp[2]);
    }else if(exp[0] === 'or'){
      return evalExpr(fns, ctx, exp[1]) || evalExpr(fns, ctx, exp[2]);
    }
  }
  return fns[exp](ctx);
};

//TODO should this be persisted in db so it's not tied to this process?
var last_state_machine_state = {};

module.exports = function(ctx, rulesets, callback){
  //TODO optimize by using the salience graph

  var all_rules = _.flatten(_.map(rulesets, function(rs){
    return _.values(rs.rules);
  }));

  λ.filter(all_rules, function(rule, next){
    if(!_.has(ctx.pico && ctx.pico.ruleset, rule.rid)){
      next(undefined, false);
      return;
    }
    var key = [ctx.pico.id, rule.rid, rule.rule_name].join('-');
    var curr_state = last_state_machine_state[key];
    if(!_.has(rule.select.state_machine, curr_state)){
      curr_state = 'start';
    }
    var stm = rule.select.state_machine[curr_state];

    var matching_pair = _.find(stm, function(s){
      return evalExpr(rule.select.eventexprs, ctx, s[0]);
    });
    var next_state = matching_pair ? matching_pair[1] : undefined;
    if(next_state === 'end'){
      last_state_machine_state[key] = 'start';//start from the begining next time
      next(undefined, true);
    }else{
      last_state_machine_state[key] = next_state;
      next(undefined, false);
    }
  }, callback);
};
