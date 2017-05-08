var _ = require("lodash");
var mkKRLfn = require("../mkKRLfn");

module.exports = function(core){
    return {
        def: {
            eventAt: mkKRLfn([
                "at",

                "domain",
                "type",
                "attributes",
            ], function(args, ctx, callback){
                if(!_.has(ctx, ["event", "eci"])){
                    callback(new Error("schedule:eventAt must be executed in response to an event"));
                    return;
                }

                var at = new Date(args.at);
                if(at.toISOString() !== args.at){
                    callback(new Error("schedule:eventAt at must be an ISO date string (i.e. `.toISOString()`)"));
                    return;
                }
                var event = {
                    eci: ctx.event.eci,//in theory we are only running in an event postlude
                    eid: ctx.event.eid,
                    domain: args.domain,
                    type: args.type,
                    attrs: args.attributes,
                };
                core.db.scheduleEventAt(at, event, function(err, val){
                    if(err) return callback(err);
                    core.scheduler.update();
                    callback(null, val.id);
                });
            }),
            eventRepeat: mkKRLfn([
                "timespec",

                "domain",
                "type",
                "attributes",
            ], function(args, ctx, callback){
                if(!_.isString(args.timespec)){
                    //TODO parse it to ensure it's shaped right
                    callback(new Error("schedule:eventRepeat `timespec` must be a cron format string"));
                    return;
                }
                if(!_.has(ctx, ["event", "eci"])){
                    callback(new Error("schedule:eventRepeat must be executed in response to an event"));
                    return;
                }

                var event = {
                    eci: ctx.event.eci,//in theory we are only running in an event postlude
                    eid: ctx.event.eid,
                    domain: args.domain,
                    type: args.type,
                    attrs: args.attributes,
                };
                core.db.scheduleEventRepeat(args.timespec, event, function(err, val){
                    if(err) return callback(err);
                    core.scheduler.addCron(val.timespec, val.id, val.event);
                    callback(null, val.id);
                });
            }),
            remove: mkKRLfn([
                "id",
            ], function(args, ctx, callback){

                //if it's a `repeat` we need to stop it
                core.scheduler.rmCron(args.id);

                core.db.removeScheduled(args.id, function(err){
                    if(err) return callback(err);
                    //if event `at` we need to update the schedule
                    core.scheduler.update();
                    callback();
                });
            }),
        }
    };
};
