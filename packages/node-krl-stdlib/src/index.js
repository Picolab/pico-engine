var _ = require("lodash");


var stdlib = {};

stdlib["+"] = function(){
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
  return val + "";
};

////////////////////////////////////////////////////////////////////////////////
//
//Operators
//
stdlib.as = function(val, type){
  if(_.isString(val)){
    if(type === "Number"){
      return parseFloat(val) || 0;
    }else if(type === "RegExp"){
      return new RegExp(val);
    }
  }else if(_.isNumber(val) && !_.isNaN(val)){
    if(type === "String"){
      return val + "";
    }
  }else if(_.isRegExp(val)){
    if(type === "String"){
      return val.source;
    }
  }
  throw new Error("Cannot use .as(\""+type+"\") operator with " + JSON.stringify(val));
};

stdlib.isnull = function(val){
  return val === null || val === undefined || _.isNaN(val);
};

stdlib.klog = function(val, message){
  console.log("[KLOG]", message, val);
};

stdlib["typeof"] = function(val){
  if(_.isString(val)){
    return "String";
  }else if(_.isNumber(val) && !_.isNaN(val)){
    return "Number";
  }else if(val === true || val === false){
    return "Boolean";
  }else if(stdlib.isnull(val)){
    return "Null";
  }else if(_.isRegExp(val)){
    return "RegExp";
  }else if(_.isArray(val)){
    return "Array";
  }else if(_.isPlainObject(val)){
    return "Map";
  }
  //should we throw up?
};

stdlib.sprintf = function(val, template){
  if(_.isNumber(val)){
    return template.replace(/%d/g, val + "");
  }else if(_.isString(val)){
    return template.replace(/%s/g, val);
  }
  return template;
};

//Number operators//////////////////////////////////////////////////////////////
stdlib.chr = function(val){
  return String.fromCharCode(val);
};
stdlib.range = function(val, end){
  return _.range(val, end + 1);
};

//String operators//////////////////////////////////////////////////////////////
stdlib.capitalize = function(val){
  return val[0].toUpperCase() + val.slice(1);
};
stdlib.decode = function(val){
  return JSON.parse(val);
};
stdlib.extract = function(val, regex){
  return val.match(regex);
};
stdlib.lc = function(val){
  return val.toLowerCase();
};
stdlib.match = function(val, regex){
  return regex.test(val);
};
stdlib.ord = function(val){
  var code = val.charCodeAt(0);
  return _.isNaN(code) ? undefined : code;
};
stdlib.replace = function(val, regex, replacement){
  return val.replace(regex, replacement);
};
stdlib.split = function(val, split_on){
  return val.split(split_on);
};
stdlib.substr = function(val, start, len){
  if(start > val.length){
    return;
  }
  var end;
  if(len === undefined){
    end = val.length;
  }else{
    if(len > 0){
      end = start + len;
    }else{
      end = val.length + len;
    }
  }
  return val.substring(start, end);
};
stdlib.uc = function(val){
  return val.toUpperCase();
};

//Collection operators//////////////////////////////////////////////////////////
stdlib.all = _.every;
stdlib.notall = function(val, iter){
  return _.some(val, _.negate(iter));
};
stdlib.any = _.some;
stdlib.none = function(val, iter){
  return _.every(val, _.negate(iter));
};
stdlib.append = _.concat;
stdlib.collect = _.groupBy;
stdlib.filter = _.filter;
stdlib.head = _.head;
stdlib.tail = _.tail;
stdlib.index = _.indexOf;
stdlib.join = _.join;
stdlib.length = _.size;
stdlib.map = _.map;
stdlib.pairwise = _.zipWith;
stdlib.reduce = function(val, iter, dflt){
  if(_.size(val) === 0){
    if(arguments.length < 3){
      return 0;
    }
    return dflt;
  }
  if(_.size(val) === 1){
    if(arguments.length < 3){
      return _.head(val);
    }
    return iter(dflt, _.head(val));
  }
  return _.reduce.apply(null, arguments);
};
stdlib.reverse = function(val){
  return _.reverse(_.clone(val));
};
stdlib.slice = function(val, start, end){
  if(start < 0 || start > _.size(val)){
    return;
  }
  if(arguments.length < 3){
    return _.slice(val, 0, start + 1);
  }
  if(end < 0 || end > _.size(val)){
    return;
  }
  return _.slice(val, start, end + 1);
};
stdlib.splice = function(val, start, n_elms, value){
  var part1 = _.slice(val, 0, start);
  var part2 = _.slice(val, start + n_elms);
  if(arguments.length < 4){
    return _.concat(part1, part2);
  }
  return _.concat(part1, value, part2);
};
stdlib.sort = (function(){
  var sorters = {
    "numeric": function(a, b){
      return a < b ? -1 : (a == b ? 0 : 1);
    },
    "ciremun": function(a, b){
      return a < b ? 1 : (a == b ? 0 : -1);
    }
  };
  return function(val, sort_by){
    if(sort_by === "reverse"){
      //TODO optimize by making a "reverse" sorter function
      return _.clone(val).sort().reverse();
    }
    return _.clone(val).sort(_.has(sorters, sort_by)
      ? sorters[sort_by]
      : sort_by
    );
  };
}());

module.exports = stdlib;
