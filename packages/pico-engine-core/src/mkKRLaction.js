var mkKRLfn = require("./mkKRLfn");

module.exports = function(paramOrder, fn){

    var kfn = mkKRLfn(paramOrder, fn);

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
