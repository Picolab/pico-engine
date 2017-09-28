var mkKRLfn = require("../mkKRLfn");
var mkKRLaction = require("../mkKRLaction");

module.exports = function(core){
    return {
        def: {
            list: mkKRLfn([
            ], function(args, ctx, callback){
                core.db.listScheduled(callback);
            }),

            remove: mkKRLaction([
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
