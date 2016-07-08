var _ = require('lodash');
var KRLType = require('../types/KRLType');
var KRLNumber = require('../types/Number');
var KRLString = require('../types/String');

module.exports = {
  '+': function(){
    var args = _.toArray(arguments);
    if(args.length === 0){
      return;
    }
    var getArg = function(i){
      var arg = args[i];
      if(arg instanceof KRLType){
        return arg.as('javascript');
      }
      return arg;
    };
    var r = getArg(0);
    var i;
    for(i = 1; i < args.length; i++){
      r = r + getArg(i);
    }
    if(_.isNumber(r)){
      return new KRLNumber(r);
    }
    return new KRLString(r + '');
  },
  'beesting': function(val){
    if(val instanceof KRLType){
      return val.as('String');
    }
    return new KRLString(val + '');
  }
};
