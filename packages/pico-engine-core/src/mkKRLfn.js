var _ = require("lodash");
var cocb = require("co-callback");

module.exports = function(arg_order, fn){
    return cocb.toYieldable(function(ctx, args, callback){
        var args_obj = {};
        _.each(args, function(arg, key){
            if(_.has(arg_order, key)){
                args_obj[arg_order[key]] = arg;
            }else{
                args_obj[key] = arg;
            }
        });
        fn(args_obj, ctx, callback);
    });
};
