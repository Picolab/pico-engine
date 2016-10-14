var _ = require("lodash");
var Future = require("fibers/future");
var evalRuleInFiber = require("./evalRuleInFiber");
var selectRulesToEvalFuture = Future.wrap(require("./selectRulesToEval"));

module.exports = function(ctx, pico_id){
  ctx.emit("debug", "event being processed");

  ctx.pico = ctx.db.getPicoFuture(pico_id).wait();
  if(!ctx.pico){
    throw new Error("Invalid eci: " + ctx.event.eci);
  }

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

  var r = _.mapValues(res_by_type, function(responses, key){
    if(key === "directive"){
      return _.map(responses, function(d){
        return _.omit(d, "type");
      });
    }
    return responses;
  });

  if(_.has(r, "directive")){
    r.directives = r.directive;
    delete r.directive;
  }else{
    //we always want to return a directives array even if it's empty
    r.directives = [];
  }

  ctx.emit("debug", "event finished processing");

  return r;
};
