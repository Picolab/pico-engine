var mkKRLfn = require("../mkKRLfn");
var mkKRLaction = require("../mkKRLaction");

module.exports = function(core){
    return {
        def: {
            list: mkKRLfn([
            ], function(ctx, args, callback){
                core.db.listScheduled(callback);
            }),

            remove: mkKRLaction([
                "id",
            ], function(ctx, args, callback){

                //if it's a `repeat` we need to stop it
                core.scheduler.rmCron(args.id);

                core.db.removeScheduled(args.id, function(err){
                    if(err && !err.notFound) return callback(err);
                    //if event `at` we need to update the schedule
                    core.scheduler.update();
                    callback(null, err && err.notFound ? false : true);
                });
            }),
        }
    };
};
