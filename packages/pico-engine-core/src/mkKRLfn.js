var _ = require("lodash");
var cocb = require("co-callback");
var normalizeKRLArgs = require("./normalizeKRLArgs");

module.exports = function(param_order, fn){
    var fixArgs = _.partial(normalizeKRLArgs, param_order);
    var wfn = cocb.wrap(fn);
    return function(ctx, args){
        return wfn(ctx, fixArgs(args));
    };
};
