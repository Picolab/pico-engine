var _ = require("lodash");
var mkTree = require("estree-builder");

var comp_by_type = {
    "String": require("./c/String"),
    "Number": require("./c/Number"),
    "Identifier": require("./c/Identifier"),
    "Chevron": require("./c/Chevron"),
    "Boolean": require("./c/Boolean"),
    "RegExp": require("./c/RegExp"),
    "DomainIdentifier": require("./c/DomainIdentifier"),
    "MemberExpression": require("./c/MemberExpression"),
    "Array": require("./c/Array"),
    "Map": require("./c/Map"),
    "MapKeyValuePair": require("./c/MapKeyValuePair"),
    "Application": require("./c/Application"),
    "UnaryOperator": require("./c/UnaryOperator"),
    "InfixOperator": require("./c/InfixOperator"),
    "ConditionalExpression": require("./c/ConditionalExpression"),
    "Function": require("./c/Function"),
    "PersistentVariableAssignment": require("./c/PersistentVariableAssignment"),
    "Declaration": require("./c/Declaration"),
    "DefAction": require("./c/DefAction"),
    "LastStatement": require("./c/LastStatement"),
    "LogStatement": require("./c/LogStatement"),
    "ExpressionStatement": require("./c/ExpressionStatement"),
    "GuardCondition": require("./c/GuardCondition"),
    "Ruleset": require("./c/Ruleset"),
    "RulesetID": require("./c/RulesetID"),
    "RulesetMeta": require("./c/RulesetMeta"),
    "Rule": require("./c/Rule"),
    "RuleSelect": require("./c/RuleSelect"),
    "RuleForEach": require("./c/RuleForEach"),
    "EventWithin": require("./c/EventWithin"),
    "EventExpression": require("./c/EventExpression"),
    "RuleActionBlock": require("./c/RuleActionBlock"),
    "RuleAction": require("./c/RuleAction"),
    "RulePostlude": require("./c/RulePostlude"),
    "ScheduleEventStatement": require("./c/ScheduleEventStatement"),
    "RaiseEventStatement": require("./c/RaiseEventStatement"),
    "RaiseEventAttributes": require("./c/RaiseEventAttributes")
};

var isKRL_loc = function(loc){
    return _.isPlainObject(loc) && _.has(loc, "start") && _.has(loc, "end");
};

module.exports = function(ast, options){
    options = options || {};

    var toLoc = options.toLoc || _.noop;

    var mkE = function(default_krl_loc){
        var default_loc = toLoc(default_krl_loc.start, default_krl_loc.end);

        return function(){
            var args = Array.prototype.slice.call(arguments);
            var last_i = args.length - 1;
            if(args[0] === "json" && last_i <= 2){
                last_i = 2;
            }
            var last = args[last_i];
            if(isKRL_loc(last)){
                args[last_i] = toLoc(last.start, last.end);
            }else{
                args.push(default_loc);
            }
            if(args[0] === "ycall"){
                return mkTree("yield",
                    mkTree.apply(null, ["call"].concat(_.tail(args))),
                    args[args.length - 1]
                );
            }
            return mkTree.apply(null, args);
        };
    };

    var compile = function compile(ast, context){
        if(_.isArray(ast)){
            return _.map(ast, function(a){
                return compile(a);
            });
        }else if(!_.has(ast, "type")){
            throw new Error("Invalid ast node: " + JSON.stringify(ast));
        }else if(!_.has(comp_by_type, ast.type)){
            throw new Error("Unsupported ast node type: " + ast.type);
        }
        var comp = compile;
        if(context){
            comp = function(ast, c){
                return compile(ast, c || context);
            };
        }
        return comp_by_type[ast.type](ast, comp, mkE(ast.loc), context);
    };

    return compile(ast);
};
