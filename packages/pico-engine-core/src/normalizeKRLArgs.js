var _ = require("lodash");

module.exports = function(param_order, krl_args){
    var args = {};
    _.each(krl_args, function(arg, key){
        if(_.has(param_order, key)){
            args[param_order[key]] = arg;
        }else if(_.includes(param_order, key)){
            args[key] = arg;
        }
    });
    return args;
};
