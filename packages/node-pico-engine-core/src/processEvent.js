var _ = require("lodash");
var cocb = require("co-callback");
var runKRL = require("./runKRL");
var processAction = require("./processAction");
var selectRulesToEval = require("./selectRulesToEval");

var evalRule = cocb.wrap(function*(ctx, rule){
    if(_.isFunction(rule.prelude)){
        yield runKRL(rule.prelude, ctx);
    }

    var action_r = yield processAction(ctx, rule.action_block);

    if(action_r.did_fire){
        ctx.emit("debug", "fired");
        if(_.get(rule, ["postlude", "fired"])){
            yield runKRL(_.get(rule, ["postlude", "fired"]), ctx);
        }
    }else{
        ctx.emit("debug", "not fired");
        if(_.get(rule, ["postlude", "notfired"])){
            yield runKRL(_.get(rule, ["postlude", "notfired"]), ctx);
        }
    }
    if(_.get(rule, ["postlude", "always"])){
        yield runKRL(_.get(rule, ["postlude", "always"]), ctx);
    }

    return action_r.responses;
});

var runEvent = cocb.wrap(function*(scheduled){
    var rule = scheduled.rule;
    var ctx = scheduled.ctx;
    var core = scheduled.core;

    ctx.emit("debug", "rule selected: " + rule.rid + " -> " + rule.name);

    ctx = core.mkCTX({
        rid: rule.rid,
        rule_name: rule.name,
        scope: rule.scope,
        pico_id: ctx.pico_id,
        event: ctx.event,

        raiseEvent: ctx.raiseEvent,
        raiseError: ctx.raiseError,
        stopRulesetExecution: ctx.stopRulesetExecution,
    });

    var r = [];
    if(rule.foreach){
        yield runKRL(rule.foreach, ctx, function*(val, iter){
            var counter = _.size(val);
            var key;
            for(key in val){
                if(_.has(val, key)){
                    counter--;
                    yield iter(_.assign({}, ctx, {
                        foreach_is_final: counter === 0
                    }), [val[key], key, val]);
                }
            }
        }, function*(ctx){
            r.push(yield evalRule(ctx, rule));
        });
    }else{
        r.push(yield evalRule(ctx, rule));
    }
    return r;
});

var processEvent = cocb.wrap(function*(core, ctx){
    ctx.emit("debug", "event being processed");

    var schedule = [];
    var scheduleEventRAW = function(ctx, callback){
        selectRulesToEval(core, ctx, function(err, rules){
            if(err) return callback(err);
            _.each(rules, function(rule){
                ctx.emit("debug", "rule added to schedule: " + rule.rid + " -> " + rule.name);
                schedule.push({
                    ctx: ctx,
                    rule: rule,
                    core: core,
                });
            });
            if(schedule.length === 0){
                ctx.emit("debug", "no rules added to schedule");
            }
            callback();
        });
    };

    ctx = core.mkCTX({
        event: ctx.event,
        pico_id: ctx.pico_id,
        stopRulesetExecution: function(){
            ctx.emit("debug", "`last` control statement is stopping ruleset execution");
            schedule = [];
        },
        raiseEvent: cocb.toYieldable(function(revent, callback){
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
            var raise_ctx = core.mkCTX({
                event: event,
                pico_id: ctx.pico_id,//raise event is always to the same pico
                raiseEvent: ctx.raiseEvent,
                raiseError: ctx.raiseError,
                stopRulesetExecution: ctx.stopRulesetExecution,
            });
            raise_ctx.emit("debug", "adding raised event to schedule: " + revent.domain + "/" + revent.type);
            scheduleEventRAW(raise_ctx, callback);
        }),
        raiseError: function*(ctx, level, msg){

            //Because one error often cascades into others,
            //limit the number of errors from a single event to just one
            schedule = [];

            return yield ctx.raiseEvent({
                domain: "system",
                type: "error",
                attributes: {
                    level: level,
                    msg: msg,
                    error_rid: ctx.rid,
                    rule_name: ctx.rule_name,
                    genus: "user",
                    //species: ??,
                },
                //for_rid: ctx.rid,
            });
        }
    });

    yield cocb.toYieldable(scheduleEventRAW)(ctx);

    var responses = [];
    //using a while loop b/c schedule is MUTABLE
    //Durring execution new events may be `raised` that will mutate the schedule
    while(schedule.length > 0){
        responses.push(yield runEvent(schedule.shift()));
    }

    responses = _.flattenDeep(_.values(responses));

    //TODO remove this hack when compiler is selective about which actions return values
    responses = _.filter(responses, function(resp){
        return _.has(resp, "type");
    });

    var res_by_type = _.groupBy(responses, "type");

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
    ctx.emit("episode_stop");

    return r;
});

module.exports = function(core, ctx, callback){
    cocb.run(processEvent(core, ctx), callback);
};
