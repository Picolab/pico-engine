var _ = require('lodash');
var toEstreeObject = require('./toEstreeObject');

var build = function(obj){
  if(_.isPlainObject(obj)){
    return toEstreeObject(_.mapValues(obj, build));
  }
  if(_.isArray(obj)){
    return {
      'type': 'ArrayExpression',
      'elements': _.map(obj, build)
    };
  }
  if(_.isString(obj)){
    return {
      'type': 'Literal',
      'value': obj
    };
  }
  if(obj === true || obj === false){
    return {
      'type': 'Literal',
      'value': obj,
      'raw': obj ? 'true' : 'false'
    };
  }
};

module.exports = build;
