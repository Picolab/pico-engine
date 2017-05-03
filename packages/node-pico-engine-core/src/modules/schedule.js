//var _ = require("lodash");
var mkKRLfn = require("../mkKRLfn");

module.exports = function(core){
    return {
        def: {
            eventAt: mkKRLfn([
            ], function(args, ctx, callback){
                //TODO store the event and ctx.rid to DB
                core.db.storeScheduleEventAt({}, function(err, id){
                    if(err) return callback(err);
                    //TODO
                    callback(null, id);
                });
            }),
        }
    };
};
