var Future = require("fibers/future");

module.exports = function(fn){
  var fnF = Future.wrap(fn);
  return function(){
    return fnF.apply(this, arguments).wait();
  };
};
