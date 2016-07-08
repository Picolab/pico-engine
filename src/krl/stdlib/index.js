var _ = require('lodash');


var stdlib = {};

stdlib['+'] = function(){
  if(arguments.length === 0){
    return;
  }
  var r = arguments[0];
  var i;
  for(i = 1; i < arguments.length; i++){
    r = r + arguments[i];
  }
  return r;
};
stdlib.beesting = function(val){
  return val + '';
};

////////////////////////////////////////////////////////////////////////////////
//
//Operators
//
stdlib.as = function(val, type){
  if(_.isString(val)){
    if(type === 'Number'){
      return parseFloat(val) || 0;
    }else if(type === 'RegExp'){
      return new RegExp(val);
    }
  }else if(_.isNumber(val) && !_.isNaN(val)){
    if(type === 'String'){
      return val + '';
    }
  }else if(_.isRegExp(val)){
    if(type === 'String'){
      return val.source;
    }
  }
  throw new Error('Cannot use .as("'+type+'") operator with ' + JSON.stringify(val));
};

stdlib.isnull = function(val){
  return val === null || val === undefined || _.isNaN(val);
};

stdlib.klog = function(val, message){
  console.log('[KLOG]', message, val);
};

stdlib['typeof'] = function(val){
  if(_.isString(val)){
    return 'String';
  }else if(_.isNumber(val) && !_.isNaN(val)){
    return 'Number';
  }else if(val === true || val === false){
    return 'Boolean';
  }else if(stdlib.isnull(val)){
    return 'Null';
  }else if(_.isRegExp(val)){
    return 'RegExp';
  }else if(_.isArray(val)){
    return 'Array';
  }else if(_.isPlainObject(val)){
    return 'Map';
  }
  //should we throw up?
};

//String operators
stdlib.capitalize = function(val){
  return (val + '').toUpperCase();
};
stdlib.lc = function(val){
  return (val + '').toLowerCase();
};

module.exports = stdlib;
