var _ = require("lodash");
var util = require("util");
var normalizeKRLArgs = require("./normalizeKRLArgs");

module.exports = function(param_order, fn){
    var fixArgs = _.partial(normalizeKRLArgs, param_order);
    var wfn = util.promisify(fn);
    return function(ctx, args){
        return wfn(ctx, fixArgs(args));
    };
};
