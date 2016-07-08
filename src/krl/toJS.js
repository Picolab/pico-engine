var _ = require('lodash');
var KRLType = require('./types/KRLType');

var toJS = function toJS(val){
  if(_.isArray(val)){
    return _.map(val, toJS);
  }
  if(_.isPlainObject(val)){
    return _.mapValues(val, toJS);
  }
  if(val instanceof KRLType){
    return val.as('javascript');
  }
  return val;
};

module.exports = toJS;
