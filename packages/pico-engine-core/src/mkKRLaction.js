var mkKRLfn = require("./mkKRLfn");

module.exports = function(arg_order, fn){

    var kfn = mkKRLfn(arg_order, fn);

    var actionFn = function(ctx, args){
        return kfn(ctx, args).then(function(data){
            return [// actions have multiple returns
                //modules return only one value
                data
            ];
        });
    };

    actionFn.is_an_action = true;

    return actionFn;
};
