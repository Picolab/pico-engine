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
        }
    };
};
