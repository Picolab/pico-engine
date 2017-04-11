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
    "DomainIdentifier": require("./g/DomainIdentifier"),
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
    "Map": require("./g/Map"),
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
    "MemberExpression": require("./g/MemberExpression"),
    "ConditionalExpression": require("./g/ConditionalExpression"),
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
    "GuardCondition": require("./g/GuardCondition"),
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
    "RulesetMetaProperty": require("./g/RulesetMetaProperty"),
    "Rule": require("./g/Rule"),
    "RuleSelect": require("./g/RuleSelect"),
    "RuleForEach": require("./g/RuleForEach"),
    "EventExpression": require("./g/EventExpression"),
    "AttributeMatch": function(ast, ind, gen){
        return gen(ast.key) + " " + gen(ast.value);
    },
    "EventOperator": require("./g/EventOperator"),
    "EventWithin": require("./g/EventWithin"),
    "RuleActionBlock": require("./g/RuleActionBlock"),
    "RuleAction": require("./g/RuleAction"),
    "DefAction": require("./g/DefAction"),
    "EventAggregator": require("./g/EventAggregator"),
    "EventGroupOperator": require("./g/EventGroupOperator"),
    "PersistentVariableAssignment": require("./g/PersistentVariableAssignment"),
    "RaiseEventStatement": require("./g/RaiseEventStatement"),
    "RaiseEventAttributes": require("./g/RaiseEventAttributes"),
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
