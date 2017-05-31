var _ = require("lodash");
var cocb = require("co-callback");
var runKRL = require("./runKRL");
var runAction = require("./runAction");
var selectRulesToEval = require("./selectRulesToEval");

var scheduleEvent = function(core, ctx, args, callback){
    if(!_.has(ctx, ["event", "eci"])){
        callback(new Error("schedule:event must be executed in response to an event"));
        return;
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
        callback(new Error("schedule:event must use `at` -or- `timespec`"));
        return;
    }
    if(args.at !== void 0){
        var at = new Date(args.at);
        if(at.toISOString() !== args.at){
            callback(new Error("schedule:event at must be an ISO date string (i.e. `.toISOString()`)"));
            return;
        }
        core.db.scheduleEventAt(at, event, function(err, val){
            if(err) return callback(err);
            core.scheduler.update();
            callback(null, val.id);
        });
        return;
    }
    if(!_.isString(args.timespec)){
        //TODO parse it to ensure it's shaped right
        callback(new Error("schedule:event `timespec` must be a cron format string"));
        return;
    }
    core.db.scheduleEventRepeat(args.timespec, event, function(err, val){
        if(err) return callback(err);
        core.scheduler.addCron(val.timespec, val.id, val.event);
        callback(null, val.id);
    });
};

var toResponse = function(ctx, type, val){
    if(type === "directive"){
        return {
            type: "directive",
            options: val.options,
            name: val.name,
            meta: {
                rid: ctx.rid,
                rule_name: ctx.rule_name,
                txn_id: "TODO",//TODO transactions
                eid: ctx.event.eid
            }
        };
    }
    if(type === "event:send"){
        return {
            type: "event:send",
            event: val.event,
        };
    }
    throw new Error("Unsupported action response type: " + type);
};


var evalRule = cocb.wrap(function*(ctx, rule){
    yield runKRL(rule.body, ctx, runAction);
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
        scheduleEvent: ctx.scheduleEvent,
        addActionResponse: ctx.addActionResponse,
        stopRulesetExecution: ctx.stopRulesetExecution,
    });

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
            yield evalRule(ctx, rule);
        });
    }else{
        yield evalRule(ctx, rule);
    }
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

    var responses = [];

    ctx = core.mkCTX({
        event: ctx.event,
        pico_id: ctx.pico_id,
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
                scheduleEvent: ctx.scheduleEvent,
                addActionResponse: ctx.addActionResponse,
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
        },
        scheduleEvent: cocb.toYieldable(function(sevent, callback){
            scheduleEvent(core, ctx, {
                domain: sevent.domain,
                type: sevent.type,
                attributes: sevent.attributes,

                at: sevent.at,
                timespec: sevent.timespec,
            }, callback);
        }),
        addActionResponse: function(ctx, type, val){
            var resp = toResponse(ctx, type, val);
            responses.push(resp);
            return resp;
        },
        stopRulesetExecution: function(){
            ctx.emit("debug", "`last` control statement is stopping ruleset execution");
            schedule = [];
        },
    });

    yield cocb.toYieldable(scheduleEventRAW)(ctx);

    //using a while loop b/c schedule is MUTABLE
    //Durring execution new events may be `raised` that will mutate the schedule
    while(schedule.length > 0){
        yield runEvent(schedule.shift());
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
    ctx.emit("episode_stop");

    return r;
});

module.exports = function(core, ctx, callback){
    cocb.run(processEvent(core, ctx), callback);
};
