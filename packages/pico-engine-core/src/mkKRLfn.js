var _ = require("lodash");
var cocb = require("co-callback");
var getArg = require("./getArg");

module.exports = function(arg_order, fn){
    return cocb.toYieldable(function(ctx, args, callback){
        var args_obj = {};
        _.each(_.values(arg_order).slice(0, args.length), function(arg, i){
            args_obj[arg] = getArg(args, arg, i);
        });
        fn(args_obj, ctx, callback);
    });
};
