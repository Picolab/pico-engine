var _ = require("lodash");

var types = {};

types.isNull = function(val){
    return val === null || val === undefined || _.isNaN(val);
};

types.isNumber = function(val){
    return _.isNumber(val) && !_.isNaN(val);
};

types.typeOf = function(val){
    if(types.isNull(val)){
        return "Null";
    }else if(val === true || val === false){
        return "Boolean";
    }else if(_.isString(val)){
        return "String";
    }else if(types.isNumber(val)){
        return "Number";
    }else if(_.isRegExp(val)){
        return "RegExp";
    }else if(_.isArray(val)){
        return "Array";
    }else if(_.isPlainObject(val)){
        return "Map";
    }else if(_.isFunction(val)){
        if(val.is_an_action === true){
            return "Action";
        }
        return "Function";
    }
    return "JSObject";
};

types.toString = function(val){
    var val_type = types.typeOf(val);
    if(val_type === "String"){
        return val;
    }else if(val_type === "Null"){
        return "null";
    }else if(val_type === "Boolean"){
        return val ? "true" : "false";
    }else if(val_type === "Number"){
        return val + "";
    }else if(val_type === "RegExp"){
        //NOTE: val.flags doesn't work on old versions of JS
        var flags = "";
        if(val.global){
            flags += "g";
        }
        if(val.ignoreCase){
            flags += "i";
        }
        return "re#" + val.source + "#" + flags;
    }
    return "[" + val_type + "]";
};


module.exports = types;
