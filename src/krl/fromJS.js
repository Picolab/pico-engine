var _ = require('lodash');
var KRLType = require('./KRLType');
var KRLString = require('./KRLString');

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
  if(_.isString(val)){
    return new KRLString(val);
  }
  return val;
};

module.exports = fromJS;
