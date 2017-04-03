var cocb = require("co-callback");
var getArg = require("../getArg");

module.exports = {
    get: function(ctx, id, callback){
        callback(null, cocb.toYieldable(function(ctx, args, callback){
            var name = getArg(args, "name", 0);
            callback(null, name || 1);
        }));
    }
};
