var _ = require("lodash");
var Future = require("fibers/future");
var evalRuleInFiber = require("./evalRuleInFiber");
var selectRulesToEvalFuture = Future.wrap(require("./selectRulesToEval"));

module.exports = function(ctx){
  ctx.emit("debug", "event recieved");

  ctx.pico = ctx.db.getPicoByECIFuture(ctx.event.eci).wait();
  if(!ctx.pico){
    throw new Error("Invalid eci: " + ctx.event.eci);
  }

  ctx.emit("debug", "pico selected");

  var rules = selectRulesToEvalFuture(ctx).wait();
  var responses = _.map(rules, function(rule){

    ctx.emit("debug", "rule selected: " + rule.rid + " -> " + rule.name);

    ctx.rid = rule.rid;
    ctx.rule = rule;
    ctx.scope = rule.scope;
    if(_.has(ctx.rulesets, rule.rid)){
      ctx.modules_used = ctx.rulesets[rule.rid].modules_used;
    }

    return evalRuleInFiber(rule, ctx);
  });

  var res_by_type = _.groupBy(_.flattenDeep(_.values(responses)), "type");

  //TODO other types
  return {
    directives:  _.map(res_by_type.directive, function(d){
      return _.omit(d, "type");
    })
  };
};
