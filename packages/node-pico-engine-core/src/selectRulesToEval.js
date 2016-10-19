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

var selectForPico = function(ctx, pico, callback){

  var to_run = _.get(ctx.salience_graph, [ctx.event.domain, ctx.event.type], {});

  var rules_to_select = [];
  _.each(to_run, function(rules, rid){
    if(!_.has(pico.ruleset, rid)){
      return;
    }
    if(_.has(ctx.event, "for_rid") && _.isString(ctx.event.for_rid)){
      if(rid !== ctx.event.for_rid){
        return;
      }
    }
    _.each(rules, function(is_on, rule_name){
      if(is_on){
        var rule = _.get(ctx.rulesets, [rid, "rules", rule_name]);
        if(rule){
          //shallow clone with it"s own scope for this run
          rules_to_select.push(_.assign({}, rule, {
            scope: ctx.rulesets[rid].scope.push()
          }));
        }
      }
    });
  });

  λ.filter(rules_to_select, function(rule, next){
    ctx.db.getStateMachineState(ctx.pico_id, rule, function(err, curr_state){
      if(err) return next(err);

      applyInFiber(getNextState, null, [_.assign({}, ctx, {
        rule: rule,
        scope: rule.scope
      }), curr_state], function(err, next_state){
        if(err) return next(err);

        ctx.db.putStateMachineState(ctx.pico_id, rule, next_state, function(err){
          next(err, next_state === "end");
        });
      });
    });
  }, function(err, rules){
    if(err) return callback(err);
    //rules in the same ruleset must fire in order
    callback(void 0, _.reduce(_.groupBy(rules, "rid"), function(acc, rules){
      return acc.concat(rules);
    }, []));
  });
};

module.exports = function(ctx, callback){
  //read this fresh everytime we select, b/c it might have changed during event processing
  ctx.db.getPico(ctx.pico_id, function(err, pico){
    if(err) return callback(err);
    selectForPico(ctx, pico, callback);
  });
};
