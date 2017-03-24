var _ = require("lodash");

var gen_by_type = {
    "String": function(ast, ind, gen){
        return JSON.stringify(ast.value);
    },
    "Number": function(ast, ind, gen){
        return JSON.stringify(ast.value);
    },
    "Identifier": function(ast, ind, gen){
        return ast.value;
    },
    "Boolean": function(ast, ind, gen){
        return ast.value ? "true" : "false";
    },
    "Keyword": function(ast, ind, gen){
        return ast.value;
    },
    "Chevron": function(ast, ind, gen){
        return "<<" + _.map(ast.value, function(v){
            return v.type === "String"
                ? v.value.replace(/>>/g, ">\\>")
                : "#{" + gen(v) + "}";
        }).join("") + ">>";
    },
    "RegExp": function(ast, ind, gen){
        var r = ast.value;
        return "re#" + r.source + "#"
            + (r.global ? "g" : "")
            + (r.ignoreCase ? "i" : "");
    },
    "Array": function(ast, ind, gen){
        return "[" + _.map(ast.value, function(ast){
            return gen(ast);
        }).join(", ") + "]";
    },
    "Map": function(ast, ind, gen){
        return "{" + _.map(ast.value, function(ast){
            return gen(ast);
        }).join(", ") + "}";
    },
    "MapKeyValuePair": function(ast, ind, gen){
        return gen(ast.key) + ": " + gen(ast.value);
    },
    "UnaryOperator": function(ast, ind, gen){
        return ast.op + (/^[a-z]/i.test(ast.op) ? " " : "") +  gen(ast.arg);
    },
    "InfixOperator": function(ast, ind, gen){
        var src = "";
        src += ast.left.type === "InfixOperator"
            ? "(" + gen(ast.left) + ")"
            : gen(ast.left);
        src += " " + ast.op + " ";
        src += ast.right.type === "InfixOperator"
            ? "(" + gen(ast.right) + ")"
            : gen(ast.right);
        return src;
    },
    "MemberExpression": function(ast, ind, gen){
        if(ast.method === "path"){
            return gen(ast.object) + "{" + gen(ast.property) + "}";
        }else if(ast.method === "index"){
            return gen(ast.object) + "[" + gen(ast.property) + "]";
        }
        return gen(ast.object) + "." + gen(ast.property);
    },
    "ConditionalExpression": function(ast, ind, gen){
        var src = "";
        src += gen(ast.test);
        src += " => ";
        src += gen(ast.consequent);
        src += " |\n";
        if(ast.alternate.type === "ConditionalExpression"){
            src += ind() + gen(ast.alternate);
        }else{
            src += ind(1) + gen(ast.alternate);
        }
        return src;
    },
    "Function": function(ast, ind, gen){
        return "function(" + _.map(ast.params, function(param){
            return gen(param);
        }).join(", ") + "){\n" + _.map(ast.body, function(stmt){
            return gen(stmt, 1);
        }).join(";\n") + "\n" + ind() + "}";
    },
    "Application": require("./g/Application"),
    "ExpressionStatement": function(ast, ind, gen){
        return ind() + gen(ast.expression);
    },
    "Declaration": function(ast, ind, gen){
        return ind() + gen(ast.left) + " " + ast.op + " " + gen(ast.right);
    },
    "Ruleset": function(ast, ind, gen){
        var src = "";
        src += ind() + "ruleset " + gen(ast.rid) + " {\n";
        if(!_.isEmpty(ast.meta)){
            src += ind() + gen(ast.meta, 1) + "\n";
        }
        if(!_.isEmpty(ast.global)){
            src += ind(1) + "global {\n";
            src += gen(ast.global, 2) + "\n";
            src += ind(1) + "}\n";
        }
        src += gen(ast.rules, 1) + "\n";
        src += ind() + "}";
        return src;
    },
    "RulesetID": function(ast, ind, gen){
        return ast.value;
    },
    "RulesetMeta": function(ast, ind, gen){
        var src = "";
        src += ind() + "meta {\n";
        src += gen(ast.properties, 1) + "\n";
        src += ind() + "}";
        return src;
    },
    "RulesetMetaProperty": function(ast, ind, gen){
        var src = ind() + gen(ast.key) + " ";
        var key = ast.key.value;
        if(key === "shares"){
            src += _.map(ast.value.ids, function(id){
                return gen(id);
            }).join(", ");
        }else if(key === "provides"){
            src += _.map(ast.value.ids, function(id){
                return gen(id);
            }).join(", ");
        }else if(_.get(ast, "value.type") === "Boolean"){
            src += ast.value.value ? "on" : "off";
        }else{
            src += gen(ast.value);
        }
        return src;
    },
    "Rule": function(ast, ind, gen){
        var src = "";
        src += ind() + "rule " + gen(ast.name);
        if(ast.rule_state !== "active"){
            src += " is " + ast.rule_state;
        }
        src += " {\n";
        if(ast.select){
            src += ind(1) + gen(ast.select, 1) + "\n";
        }
        if(!_.isEmpty(ast.prelude)){
            src += ind(1) + "pre {\n";
            src += gen(ast.prelude, 2) + "\n";
            src += ind(1) + "}\n";
        }
        if(ast.action_block){
            src += gen(ast.action_block, 1) + "\n";
        }
        if(ast.postlude){
            src += gen(ast.postlude, 1) + "\n";
        }
        src += ind() + "}";
        return src;
    },
    "RuleSelect": require("./g/RuleSelect"),
    "EventExpression": function(ast, ind, gen){
        var src = "";
        src += gen(ast.event_domain) + " " + gen(ast.event_type);
        if(!_.isEmpty(ast.attributes)){
            src += " " + _.map(ast.attributes, function(a){
                return gen(a, 1);
            }).join(" ");
        }
        if(ast.where){
            src += " where " + gen(ast.where);
        }
        if(!_.isEmpty(ast.setting)){
            src += " setting(" + _.map(ast.setting, function(a){
                return gen(a, 1);
            }).join(", ") + ")";
        }
        return src;
    },
    "AttributeMatch": function(ast, ind, gen){
        return gen(ast.key) + " " + gen(ast.value);
    },
    "EventOperator": require("./g/EventOperator"),
    "EventWithin": require("./g/EventWithin"),
    "RuleActionBlock": function(ast, ind, gen){
        var src = "";
        src += gen(ast.actions);
        return src;
    },
    "RuleAction": function(ast, ind, gen){
        var src = "";
        src += ind() + gen(ast.action) + "(" + gen(ast.args) + ")";
        if(!_.isEmpty(ast["with"])){
            src += " with\n" + gen(ast["with"], 1);
        }
        return src;
    },
    "EventAggregator": require("./g/EventAggregator"),
    "EventGroupOperator": require("./g/EventGroupOperator"),
    "RulePostlude": require("./g/RulePostlude")
};

module.exports = function(ast, options){
    options = options || {};
    var indent_str = _.isString(options.indent) ? options.indent : "  ";

    var generate = function generate(ast, indent_level){
        indent_level = indent_level || 0;
        if(!ast){
            return "";
        }
        if(_.isArray(ast)){
            return _.map(ast, function(a){
                return generate(a, indent_level);
            }).join("\n");
        }
        if(_.has(gen_by_type, ast.type)){
            var ind = function(n){
                return _.repeat(indent_str, indent_level + (n || 0));
            };
            var gen = function(ast, increase_indent_by){
                increase_indent_by = _.parseInt(increase_indent_by, 10) || 0;
                return generate(ast, indent_level + increase_indent_by);
            };
            return gen_by_type[ast.type](ast, ind, gen);
        }
        throw new Error("Unsupported ast node type: " + ast.type);
    };

    return generate(ast, 0);
};
