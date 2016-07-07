var _ = require('lodash');
var KRLType = require('./KRLType');
var KRLString = require('./KRLString');

var toKRL = function toKRL(val){
  if(val instanceof KRLType){
    return val;
  }
  if(_.isArray(val)){
    return _.map(val, toKRL);
  }
  if(_.isPlainObject(val)){
    return _.mapValues(val, toKRL);
  }
  if(_.isString(val)){
    return KRLString(val);
  }
  return val;
};

module.exports = toKRL;
