var Fiber = require("fibers");

module.exports = function(fn, that, args, callback){
  Fiber(function(){
    try{
      callback(undefined, fn.apply(that, args));
    }catch(err){
      callback(err);
    }
  }).run();
};
