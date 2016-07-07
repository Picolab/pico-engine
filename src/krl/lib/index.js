var _ = require('lodash');
var KRLType = require('../KRLType');

module.exports = {
  '+': function(){
    var args = _.toArray(arguments);
    if(args.length === 0){
      return;
    }
    var getArg = function(i){
      var arg = args[i];
      if(arg instanceof KRLType){
        return arg.toJS();
      }
      return arg;
    };
    var r = getArg(0);
    var i;
    for(i = 1; i < args.length; i++){
      r = r + getArg(i);
    }
    return r;
  }
};
