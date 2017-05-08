var _ = require("lodash");
var mkKRLfn = require("../mkKRLfn");

module.exports = function(core){
    return {
        def: {
            eventAt: mkKRLfn([
                "opts",
            ], function(args, ctx, callback){
                var opts = args.opts;

                if(!_.has(ctx, ["event", "eci"])){
                    callback(new Error("schedule:eventAt must be executed in response to an event"));
                    return;
                }

                var at = new Date(opts.at);
                if(at.toISOString() !== opts.at){
                    callback(new Error("schedule:eventAt at must be an ISO date string (i.e. `.toISOString()`)"));
                    return;
                }
                var event = {
                    eci: ctx.event.eci,//in theory we are only running in an event postlude
                    eid: ctx.event.eid,
                    domain: opts.domain,
                    type: opts.type,
                    attrs: opts.attributes,
                };
                core.db.scheduleEventAt(at, event, function(err, val){
                    if(err) return callback(err);
                    core.scheduler.update();
                    callback(null, val.id);
                });
            }),
            eventRepeat: mkKRLfn([
                "opts",
            ], function(args, ctx, callback){
                var opts = args.opts;

                if(!_.isString(opts.timespec)){
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
                    domain: opts.domain,
                    type: opts.type,
                    attrs: opts.attributes,
                };
                core.db.scheduleEventRepeat(opts.timespec, event, function(err, val){
                    if(err) return callback(err);
                    core.scheduler.addCron(val.timespec, val.id, val.event);
                    callback(null, val.id);
                });
            }),
        }
    };
};
