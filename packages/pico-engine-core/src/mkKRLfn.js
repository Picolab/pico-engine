var _ = require("lodash");
var cocb = require("co-callback");

module.exports = function(arg_order, fn){
    return cocb.wrap(function(ctx, args, callback){
        var args_obj = {};
        _.each(args, function(arg, key){
            if(_.has(arg_order, key)){
                args_obj[arg_order[key]] = arg;
            }else if(_.includes(arg_order, key)){
                args_obj[key] = arg;
            }
        });
        fn(ctx, args_obj, callback);
    });
};
