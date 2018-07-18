var _ = require("lodash");
var ktypes = require("krl-stdlib/types");
var runKRL = require("./runKRL");
var runAction = require("./runAction");
var selectRulesToEval = require("./selectRulesToEval");

async function scheduleEvent(core, ctx, args){
    if(!_.has(ctx, ["event", "eci"])){
        throw new Error("schedule:event must be executed in response to an event");
    }
    var event = {
        eci: ctx.event.eci,//in theory we are only running in an event postlude
        eid: ctx.event.eid,
        domain: args.domain,
        type: args.type,
        attrs: args.attributes,
    };

    if(false
        || args.at !== void 0 && args.timespec !== void 0
        || args.at === void 0 && args.timespec === void 0
    ){
        throw new Error("schedule:event must use `at` -or- `timespec`");
    }
    var val;
    if(args.at !== void 0){
        var at = new Date(args.at);
        if(at.toISOString() !== args.at){
            throw new Error("schedule:event at must be an ISO date string (i.e. `.toISOString()`)");
        }
        val = await core.db.scheduleEventAtYieldable(at, event);
        core.scheduler.update();
        return val.id;
    }
    if(!_.isString(args.timespec)){
        //TODO parse it to ensure it's shaped right
        throw new Error("schedule:event `timespec` must be a cron format string");
    }
    val = await core.db.scheduleEventRepeatYieldable(args.timespec, event);
    core.scheduler.addCron(val.timespec, val.id, val.event);
    return val.id;
}

function toResponse(ctx, type, val){
    if(type === "directive"){
        return {
            type: "directive",
            options: val.options,
            name: val.name,
            meta: {
                rid: ctx.rid,
                rule_name: ctx.rule_name,
                txn_id: ctx.txn_id,
                eid: ctx.event.eid
            }
        };
    }
    throw new Error("Unsupported action response type: " + type);
}

/**
 * used by `foreach` in krl
 * Array's use index numbers, maps use key strings
 */
function toPairs(v){
    if(ktypes.isArray(v)){
        var pairs = [];
        var i;
        for(i = 0; i < v.length; i++){
            pairs.push([i, v[i]]);
        }
        return pairs;
    }
    return _.toPairs(v);
}


function runRuleBody(core, rule_body_fns, scheduled){

    var rule = scheduled.rule;
    var pico_id = scheduled.pico_id;
    var event = scheduled.event;

    var ctx = core.mkCTX({
        rid: rule.rid,
        rule_name: rule.name,
        scope: rule.scope,
        pico_id: pico_id,
        event: event,

        raiseEvent: rule_body_fns.raiseEvent,
        raiseError: rule_body_fns.raiseError,
        scheduleEvent: rule_body_fns.scheduleEvent,
        addActionResponse: rule_body_fns.addActionResponse,
        stopRulesetExecution: rule_body_fns.stopRulesetExecution,
    });

    ctx.emit("debug", "rule selected: " + rule.rid + " -> " + rule.name);

    return runKRL(rule.body, ctx, runAction, toPairs);
}

module.exports = async function processEvent(core, ctx){
    ctx.emit("debug", "event being processed");

    //the schedule is the list of rules and events that need to be processed
    var schedule = [];
    var responses = [];//i.e. directives

    var addEventToSchedule = async function(ctx){
        var rules = await selectRulesToEval(core, ctx);
        _.each(rules, function(rule){
            ctx.emit("debug", "rule added to schedule: " + rule.rid + " -> " + rule.name);
            schedule.push({
                rule: rule,
                event: ctx.event,
                pico_id: ctx.pico_id,
            });
        });
        if(schedule.length === 0){
            ctx.emit("debug", "no rules added to schedule");
        }
    };

    await addEventToSchedule(ctx);

    //these are special functions only to be used inside a rule body
    var rule_body_fns = {
        raiseEvent: async function(revent){
            //shape the revent like a normal event
            var event = {
                eci: ctx.event.eci,//raise event is always to the same pico
                eid: ctx.event.eid,//inherit from parent event to aid in debugging
                domain: revent.domain,
                type: revent.type,
                attrs: revent.attributes,
                for_rid: revent.for_rid,
                txn_id: ctx.event.txn_id,//inherit from parent event
                timestamp: new Date()
            };
            //must make a new ctx for this raise b/c it's a different event
            var raise_ctx = core.mkCTX({
                event: event,
                pico_id: ctx.pico_id,//raise event is always to the same pico
            });
            raise_ctx.emit("debug", "adding raised event to schedule: " + revent.domain + "/" + revent.type);
            await addEventToSchedule(raise_ctx);
        },
        raiseError: function(ctx, level, data){

            if(level === "error"){
                //clear the schedule so no more rules are run
                schedule = [];
            }

            return ctx.raiseEvent({
                domain: "system",
                type: "error",
                attributes: {
                    level: level,
                    data: data,
                    rid: ctx.rid,
                    rule_name: ctx.rule_name,
                    genus: "user",
                    //species: ??,
                },
                for_rid: ctx.rid,
            });
        },
        scheduleEvent: function(sevent){
            return scheduleEvent(core, ctx, {
                domain: sevent.domain,
                type: sevent.type,
                attributes: sevent.attributes,

                at: sevent.at,
                timespec: sevent.timespec,
            });
        },
        addActionResponse: function(ctx, type, val){
            var resp = toResponse(ctx, type, val);
            responses.push(resp);
            return resp;
        },
        stopRulesetExecution: function(ctx){
            ctx.emit("debug", "`last` control statement is stopping ruleset execution");
            schedule = _.dropWhile(schedule, function(s){
                return s.rule.rid === ctx.rid;
            });
        },
    };

    //using a while loop b/c schedule is MUTABLE
    //Durring execution new events may be `raised` that will mutate the schedule
    while(schedule.length > 0){
        await runRuleBody(core, rule_body_fns, schedule.shift());
    }

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

    return r;
};
