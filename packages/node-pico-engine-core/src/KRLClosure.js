var _ = require("lodash");
var getArg = require("./getArg");

module.exports = function(ctx, fn){
    return function(ctx2, args){
        return fn(_.assign({}, ctx2, {
            rid: ctx.rid,//keep your original rid
            scope: ctx.scope.push(),

            args: args,//TODO remove
            getArg: getArg,//TODO remove
        }), function(name, index){
            return getArg(args);
        });
    };
};
