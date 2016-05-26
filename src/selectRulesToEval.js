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

module.exports = function(ctx, salience_graph, rulesets, callback){

  //NOTE: defaultsDeep mutates the first arg (we don't want to mutate salience_graph)
  var to_run = {};
  _.defaultsDeep(
    to_run,
    _.get(salience_graph, [ctx.event.domain, ctx.event.type], {}),
    _.get(salience_graph, ['', ctx.event.type], {}),
    _.get(salience_graph, [ctx.event.domain, ''], {}),
    _.get(salience_graph, ['', ''], {})
  );

  var rules_to_select = [];
  _.each(to_run, function(rules, rid){
    if(!_.has(ctx.pico.ruleset, rid)){
      return;
    }
    _.each(rules, function(is_on, rule_name){
      if(is_on){
        var rule = _.get(rulesets, [rid, 'rules', rule_name]);
        if(rule){
          rules_to_select.push(rule);
        }
      }
    });
  });

  λ.filter(rules_to_select, function(rule, next){
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
