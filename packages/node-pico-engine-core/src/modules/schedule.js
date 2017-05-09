var _ = require("lodash");
var mkKRLfn = require("../mkKRLfn");

module.exports = function(core){
    return {
        def: {
            event: mkKRLfn([
                "at",

                "timespec",

                "domain",
                "type",
                "attributes",
            ], function(args, ctx, callback){
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
            }),
            list: mkKRLfn([
            ], function(args, ctx, callback){
                core.db.listScheduled(callback);
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
