var _ = require('lodash');
var KRLNull = require('./types/Null');
var KRLType = require('./types/KRLType');
var KRLString = require('./types/String');
var KRLNumber = require('./types/Number');
var KRLRegExp = require('./types/RegExp');

var fromJS = function fromJS(val){
  if(val instanceof KRLType){
    return val;
  }
  if(_.isArray(val)){
    return _.map(val, fromJS);
  }
  if(_.isPlainObject(val)){
    return _.mapValues(val, fromJS);
  }
  if(_.isRegExp(val)){
    return new KRLRegExp(val);
  }
  if(_.isString(val)){
    return new KRLString(val);
  }
  if(_.isNaN(val)){
    return new KRLNull(val);
  }
  if(_.isNumber(val)){
    return new KRLNumber(val);
  }
  return val;
};

module.exports = fromJS;
