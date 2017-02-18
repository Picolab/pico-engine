var Fiber = require("fibers");

module.exports = function(){
    var args = Array.prototype.slice.call(arguments);
    var fn = args.shift();
    return new Promise(function(resolve, reject){
        Fiber(function(){
            try{
                resolve(fn.apply(null, args));
            }catch(err){
                reject(err);
            }
        }).run();
    });
};
