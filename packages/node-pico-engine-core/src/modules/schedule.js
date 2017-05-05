//var _ = require("lodash");
var mkKRLfn = require("../mkKRLfn");

module.exports = function(core){
    return {
        def: {
            eventAt: mkKRLfn([
                "opts",
            ], function(args, ctx, callback){
                var opts = args.opts;

                var at = new Date(opts.at);
                var event = {
                    domain: opts.domain,
                    type: opts.type,
                    attributes: opts.attributes,
                };
                core.db.scheduleEventAt(at, event, function(err, id){
                    if(err) return callback(err);
                    core.scheduler.update();
                    callback(null, id);
                });
            }),
        }
    };
};
