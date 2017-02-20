var co = require("co");

module.exports = function(){
    var args = Array.prototype.slice.call(arguments);
    var fn = args.shift();
    return co(function*(){
        return yield fn.apply(null, args);
    });
};
