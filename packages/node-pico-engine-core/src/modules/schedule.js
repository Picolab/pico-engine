//var _ = require("lodash");
var mkKRLfn = require("../mkKRLfn");

module.exports = function(core){
    return {
        def: {
            eventAt: mkKRLfn([
                "opts",
            ], function(args, ctx, callback){
                var opts = args.opts;

                var at = opts.at;
                var event = {
                    domain: opts.domain,
                    type: opts.type,
                    attributes: opts.attributes,
                };
                //TODO store the event and ctx.rid to DB
                core.db.scheduleEventAt(at, event, function(err, id){
                    if(err) return callback(err);
                    //TODO
                    callback(null, id);
                });
            }),
        }
    };
};
