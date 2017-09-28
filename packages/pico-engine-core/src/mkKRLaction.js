var _ = require("lodash");
var cocb = require("co-callback");
var getArg = require("./getArg");

module.exports = function(arg_order, fn){

    var actionFn = cocb.toYieldable(function(ctx, args, callback){

        var args_obj = {};
        _.each(_.values(arg_order), function(arg, i){
            args_obj[arg] = getArg(args, arg, i);
        });

        fn(args_obj, ctx, function(err, data){
            if(err) return callback(err);

            callback(null, [// actions have multiple returns
                //modules return only one value
                data
            ]);
        });
    });

    actionFn.is_an_action = true;

    return actionFn;
};
