var cocb = require("co-callback");

module.exports = function(){
    var args = Array.prototype.slice.call(arguments);
    var fn = args.shift();
    return cocb.promiseRun(function*(){
        return yield fn.apply(null, args);
    });
};
