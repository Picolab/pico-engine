var _ = require("lodash");
var Future = require("fibers/future");
var evalRuleInFiber = require("./evalRuleInFiber");
var selectRulesToEvalFuture = Future.wrap(require("./selectRulesToEval"));

var runEvent = function(scheduled){
  var rule = scheduled.rule;
  var ctx = scheduled.ctx;

  ctx.emit("debug", "rule selected: " + rule.rid + " -> " + rule.name);

  ctx.rid = rule.rid;
  ctx.rule = rule;
  ctx.scope = rule.scope;
  if(_.has(ctx.rulesets, rule.rid)){
    ctx.modules_used = ctx.rulesets[rule.rid].modules_used;
  }

  return evalRuleInFiber(rule, ctx);
};

module.exports = function(ctx, mkCTX){
  ctx.emit("debug", "event being processed");

  var schedule = [];
  var scheduleEvent = function(ctx){
    var rules = selectRulesToEvalFuture(ctx).wait();
    _.each(rules, function(rule){
      ctx.emit("debug", "rule added to schedule: " + rule.rid + " -> " + rule.name);
      schedule.push({rule: rule, ctx: ctx});
    });
  };

  scheduleEvent(ctx);

  ctx.raiseEvent = function(revent){
    //shape the revent like a normal event
    var event = {
      eci: ctx.event.eci,//raise event is always to the same pico
      eid: ctx.event.eid,//inherit from parent event to aid in debugging
      domain: revent.domain,
      type: revent.type,
      attrs: revent.attributes,
      for_rid: revent.for_rid,
      timestamp: new Date()
    };
    //must make a new ctx for this raise b/c it's a different event
    var raise_ctx = mkCTX({
      event: event,
      pico_id: ctx.pico_id//raise event is always to the same pico
    });
    raise_ctx.raiseEvent = ctx.raiseEvent;
    raise_ctx.emit("debug", "adding raised event to schedule");
    scheduleEvent(raise_ctx);
  };


  var responses = [];
  //using a while loop b/c schedule is MUTABLE
  //Durring execution new events may be `raised` that will mutate the schedule
  while(schedule.length > 0){
    responses.push(runEvent(schedule.shift()));
  }

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
