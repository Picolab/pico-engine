var _ = require("lodash");
var cuid = require("cuid");
var randomWords = require("random-words");

var stdlib = {};

var defVarArgOp = function(op, reducer){
  stdlib[op] = function(){
    if(arguments.length === 1){
      return;
    }
    var r = arguments[1];
    var i;
    for(i = 2; i < arguments.length; i++){
      r = reducer(r, arguments[i]);
    }
    return r;
  };
};

defVarArgOp("||", function(r, a){
  return r || a;
});
defVarArgOp("&&", function(r, a){
  return r && a;
});
defVarArgOp("<", function(r, a){
  return r < a;
});
defVarArgOp(">", function(r, a){
  return r > a;
});
defVarArgOp("<=", function(r, a){
  return r <= a;
});
defVarArgOp(">=", function(r, a){
  return r >= a;
});
defVarArgOp("==", function(r, a){
  return r === a;
});
defVarArgOp("!=", function(r, a){
  return r !== a;
});
defVarArgOp("+", function(r, a){
  return r + a;
});
defVarArgOp("-", function(r, a){
  return r - a;
});
defVarArgOp("*", function(r, a){
  return r * a;
});
defVarArgOp("/", function(r, a){
  return r / a;
});
defVarArgOp("%", function(r, a){
  return r % a;
});

stdlib.beesting = function(ctx, val){
  return val + "";
};

////////////////////////////////////////////////////////////////////////////////
//
//Operators
//
stdlib.as = function(ctx, val, type){
  var val_type = stdlib["typeof"](ctx, val);
  if(val_type === type){
    return val;
  }
  if(type === "Boolean"){
    if(val === "false"){
      return false;
    }
    return !!val;
  }
  if(val_type === "String"){
    if(type === "Number"){
      return parseFloat(val) || 0;
    }else if(type === "RegExp"){
      return new RegExp(val);
    }
  }else if(val_type === "Number"){
    if(type === "String"){
      return val + "";
    }
  }else if(val_type === "Boolean"){// eslint-disable-line
  }else if(val_type === "Null"){// eslint-disable-line
  }else if(val_type === "RegExp"){
    if(type === "String"){
      return val.source;
    }
  }else if(val_type === "Array"){// eslint-disable-line
  }else if(val_type === "Map"){// eslint-disable-line
  }
  throw new Error("Cannot use .as(\""+type+"\") operator with " + JSON.stringify(val));
};

stdlib.isnull = function(ctx, val){
  return val === null || val === undefined || _.isNaN(val);
};

stdlib.klog = function(ctx, val, message){
  ctx.emit("klog", val, message);
  return val;
};

stdlib["typeof"] = function(ctx, val){
  if(_.isString(val)){
    return "String";
  }else if(_.isNumber(val) && !_.isNaN(val)){
    return "Number";
  }else if(val === true || val === false){
    return "Boolean";
  }else if(stdlib.isnull(ctx, val)){
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

stdlib.sprintf = function(ctx, val, template){
  if(_.isNumber(val)){
    return template.replace(/%d/g, val + "");
  }else if(_.isString(val)){
    return template.replace(/%s/g, val);
  }
  return template;
};

stdlib.defaultsTo = function(ctx, val,defaultVal,message){
  if(_.size(val) === 0){
    if(message !== undefined) ctx.emit("debug", "[DEFAULTSTO] " + message);
    return defaultVal;
  } else {
    return val;
  }
};

//Number operators//////////////////////////////////////////////////////////////
stdlib.chr = function(ctx, val){
  return String.fromCharCode(val);
};
stdlib.range = function(ctx, val, end){
  return _.range(val, end + 1);
};

//String operators//////////////////////////////////////////////////////////////
stdlib.capitalize = function(ctx, val){
  return val[0].toUpperCase() + val.slice(1);
};
stdlib.decode = function(ctx, val){
  return JSON.parse(val);
};
stdlib.extract = function(ctx, val, regex){
  var r = val.match(regex);
  if(!r){
    return [];
  }
  if(regex.global){
    return r;
  }
  return r.slice(1);
};
stdlib.lc = function(ctx, val){
  return val.toLowerCase();
};
stdlib.match = function(ctx, val, regex){
  return regex.test(val);
};
stdlib.ord = function(ctx, val){
  var code = val.charCodeAt(0);
  return _.isNaN(code) ? undefined : code;
};
stdlib.replace = function(ctx, val, regex, replacement){
  return val.replace(regex, replacement);
};
stdlib.split = function(ctx, val, split_on){
  return val.split(split_on);
};
stdlib.substr = function(ctx, val, start, len){
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
stdlib.uc = function(ctx, val){
  return val.toUpperCase();
};

//Collection operators//////////////////////////////////////////////////////////
stdlib.all = function(ctx, val, iter){
  return _.every(val, iter);
};
stdlib.notall = function(ctx, val, iter){
  return _.some(val, _.negate(iter));
};
stdlib.any = function(ctx, val, iter){
  return _.some(val, iter);
};
stdlib.none = function(ctx, val, iter){
  return _.every(val, _.negate(iter));
};
stdlib.append = function(ctx, val, others){
  return _.concat.apply(void 0, _.tail(_.toArray(arguments)));
};
stdlib.collect = function(ctx, val, iter){
  return _.groupBy(val, iter);
};
stdlib.filter = function(ctx, val, iter){
  if(_.isPlainObject(val)){
    var r = {};
    _.each(val, function(v, k, o){
      if(iter(v, k, o)){
        r[k] = v;
      }
    });
    return r;
  }
  return _.filter(val, iter);
};
stdlib.head = function(ctx, val){
  return _.head(val);
};
stdlib.tail = function(ctx, val){
  return _.tail(val);
};
stdlib.index = function(ctx, val, elm){
  return _.indexOf(val, elm);
};
stdlib.join = function(ctx, val, str){
  return _.join(val, str);
};
stdlib.length = function(ctx, val){
  return _.size(val);
};
stdlib.map = function(ctx, val, iter){
  if(_.isPlainObject(val)){
    return _.mapValues(val, iter);
  }
  return _.map(val, iter);
};
stdlib.pairwise = function(ctx, vals, iter){
  return _.zipWith.apply(void 0, _.tail(_.toArray(arguments)));
};
stdlib.reduce = function(ctx, val, iter, dflt){
  if(_.size(val) === 0){
    if(arguments.length < 4){
      return 0;
    }
    return dflt;
  }
  if(_.size(val) === 1){
    if(arguments.length < 4){
      return _.head(val);
    }
    return iter(dflt, _.head(val));
  }
  return _.reduce.apply(void 0, _.tail(_.toArray(arguments)));
};
stdlib.reverse = function(ctx, val){
  return _.reverse(_.clone(val));
};
stdlib.slice = function(ctx, val, start, end){
  if(start < 0 || start > _.size(val)){
    return;
  }
  if(arguments.length < 4){
    return _.slice(val, 0, start + 1);
  }
  if(end < 0 || end > _.size(val)){
    return;
  }
  return _.slice(val, start, end + 1);
};
stdlib.splice = function(ctx, val, start, n_elms, value){
  var part1 = _.slice(val, 0, start);
  var part2 = _.slice(val, start + n_elms);
  if(arguments.length < 5){
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
  return function(ctx, val, sort_by){
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
stdlib["delete"] = function(ctx, val, path){
  //TODO optimize
  var n_val = _.cloneDeep(val);
  _.unset(n_val, path);
  return n_val;
};
stdlib.put = function(ctx, val, path, to_set){
  if(arguments.length < 4){
    return _.assign({}, val, path);
  }
  //TODO optimize
  var n_val = _.cloneDeep(val);
  _.update(n_val, path, function(at_p){
    return _.assign(at_p, to_set);
  });
  return n_val;
};
stdlib.encode = function(ctx, val){
  //TODO options???
  return JSON.stringify(val);
};
stdlib.keys = function(ctx, val, path){
  if(path){
    return _.keys(_.get(val, path));
  }
  return _.keys(val);
};
stdlib.values = function(ctx, val, path){
  if(path){
    return _.values(_.get(val, path));
  }
  return _.values(val);
};
stdlib.intersection = function(ctx, a, b){
  return _.intersection(a, b);
};
stdlib.union = function(ctx, a, b){
  return _.unionWith(a, b, _.isEqual);
};
stdlib.difference = function(ctx, a, b){
  return _.differenceWith(a, b, _.isEqual);
};
stdlib.has = function(ctx, val, other){
  return _.every(other, function(e){
    return _.includes(val, e);
  });
};
stdlib.once = function(ctx, val){
  //TODO optimize
  var r = [];
  _.each(_.groupBy(val), function(group){
    if(_.size(group) === 1){
      r.push(_.head(group));
    }
  });
  return r;
};
stdlib.duplicates = function(ctx, val){
  //TODO optimize
  var r = [];
  _.each(_.groupBy(val), function(group){
    if(_.size(group) > 1){
      r.push(_.head(group));
    }
  });
  return r;
};
stdlib.randomWord = function(ctx){
  return randomWords();
};
stdlib.uuid = function(ctx){
  return cuid();
};

stdlib.unique = function(ctx, val){
  return _.uniq(val);
};

stdlib["get"] = function(ctx, obj, path) {
  return _.get(obj,path);
};

stdlib["set"] = function(ctx, obj, path, val) {
  return _.set(obj,path,val);
};

module.exports = stdlib;
