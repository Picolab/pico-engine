var applyInFiber = require("./applyInFiber");

module.exports = function(){
    var args = Array.prototype.slice.call(arguments);
    var fn = args.shift();
    return new Promise(function(resolve, reject){
        applyInFiber(fn, null, args, function(err, data){
            if(err) reject(err);
            else resolve(data);
        });
    });
};
