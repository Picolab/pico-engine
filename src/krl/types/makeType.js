var _ = require('lodash');
var KRLType = require('./KRLType');

module.exports = function(Constructor, methods){
  Constructor.prototype = new KRLType();
  _.each(methods, function(fn, method){
    Constructor.prototype[method] = fn;
  });
  return Constructor;
};
