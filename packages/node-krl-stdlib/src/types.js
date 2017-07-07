var _ = require("lodash");

var types = {};

types.isNull = function(val){
    return val === null || val === void 0 || _.isNaN(val);
};

types.isBoolean = function(val){
    return val === true || val === false;
};

types.isString = function(val){
    return _.isString(val);
};

types.isNumber = function(val){
    return _.isNumber(val) && !_.isNaN(val);
};

types.isRegExp = function(val){
    return _.isRegExp(val);
};

types.isArray = function(val){
    return _.isArray(val);
};

types.isMap = function(val){
    return _.isPlainObject(val);
};

types.isFunction = function(val){
    return _.isFunction(val) && !val.is_an_action;
};

types.isAction = function(val){
    return _.isFunction(val) && val.is_an_action === true;
};

types.typeOf = function(val){
    var krl_types = [
        "Null",
        "Boolean",
        "String",
        "Number",
        "RegExp",
        "Array",
        "Map",
        "Function",
        "Action",
    ];
    var i;
    var type;
    for(i = 0; i < krl_types.length; i++){
        type = krl_types[i];
        if(types["is" + type](val)){
            return type;
        }
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

types.encode = function(val, indent){
    indent = _.parseInt(indent, 10) || 0;//default to 0 (no indent)
    return JSON.stringify(val, function(k, v){
        switch(types.typeOf(v)){
        case "Null":
            return null;
        case "JSObject":
        case "RegExp":
        case "Function":
        case "Action":
            return types.toString(v);
        }
        return v;
    }, indent);
};

module.exports = types;
