var _ = require("lodash");
var cocb = require("co-callback");
var normalizeKRLArgs = require("./normalizeKRLArgs");

module.exports = function(param_order, fn){
    var fixArgs = _.partial(normalizeKRLArgs, param_order);
    return cocb.wrap(function(ctx, args, callback){
        fn(ctx, fixArgs(args), callback);
    });
};
