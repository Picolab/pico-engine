var _ = require("lodash");
var genWith = require("../genWith");

var by_key = {
    "shares": function(ast, ind, gen){
        return ind() + gen(ast.key) + " " + _.map(ast.value.ids, function(id){
            return gen(id);
        }).join(", ");
    },
    "provides": function(ast, ind, gen){
        var src = ind() + gen(ast.key) + " ";
        if(ast.value.operator && ast.value.operator.value === "keys"){
            src += "keys ";
            src += _.map(ast.value.ids, function(id){
                return gen(id);
            }).join(", ");
            if(!_.isEmpty(ast.value.rulesets)){
                src += " to ";
                src += _.map(ast.value.rulesets, function(r){
                    return gen(r);
                }).join(", ");
            }
        }else{
            src += _.map(ast.value.ids, function(id){
                return gen(id);
            }).join(", ");
        }
        return src;
    },
    "keys": function(ast, ind, gen){
        var src = ind() + "key ";
        src += _.map(ast.value, function(v){
            return gen(v);
        }).join(" ");
        return src;
    },
    "errors": function(ast, ind, gen){
        var src = ind() + gen(ast.key) + " ";
        src += "to " + gen(ast.value.rid);
        if(ast.value.version){
            src += " version " + gen(ast.value.version);
        }
        return src;
    },
    "configure": function(ast, ind, gen){
        var src = ind() + gen(ast.key) + " ";
        src += "using\n" + gen(ast.value.declarations, 1);
        return src;
    },
    "use": function(ast, ind, gen){
        var src = ind() + "use";
        src += " " + ast.value.kind;
        src += " " + gen(ast.value.rid);
        //TODO version
        if(ast.value.alias){
            src += "\n" + ind(1);
            src += "alias " + gen(ast.value.alias);
        }
        src += genWith(ast.value["with"], ind, gen, true);
        src += "\n";
        return src;
    },
};

module.exports = function(ast, ind, gen){
    var key = ast.key.value;
    if(_.has(by_key, key)){
        return by_key[key](ast, ind, gen);
    }else if(_.isString(ast.value.type)){
        var src = ind() + gen(ast.key) + " ";
        if(ast.value.type === "Boolean"){
            src += ast.value.value ? "on" : "off";
        }else{
            src += gen(ast.value);
        }
        if(key === "description"){
            src += "\n";
        }
        return src;
    }
    throw new Error("Unsupported RulesetMetaProperty " + key);
};
