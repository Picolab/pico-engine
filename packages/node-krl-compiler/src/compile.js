var _ = require("lodash");
var mkTree = require("estree-builder");

var comp_by_type = _.fromPairs(_.map([
    "Application",
    "Array",
    "Boolean",
    "Chevron",
    "ClearPersistentVariable",
    "ConditionalExpression",
    "Declaration",
    "DefAction",
    "DomainIdentifier",
    "ErrorStatement",
    "EventExpression",
    "EventWithin",
    "ExpressionStatement",
    "Function",
    "GuardCondition",
    "Identifier",
    "InfixOperator",
    "LastStatement",
    "LogStatement",
    "Map",
    "MapKeyValuePair",
    "MemberExpression",
    "Number",
    "Parameter",
    "PersistentVariableAssignment",
    "RaiseEventAttributes",
    "RaiseEventStatement",
    "RegExp",
    "Rule",
    "RuleAction",
    "RuleActionBlock",
    "RuleForEach",
    "RulePostlude",
    "RuleSelect",
    "Ruleset",
    "RulesetID",
    "RulesetMeta",
    "ScheduleEventStatement",
    "String",
    "UnaryOperator",
], function(type){
    return [type, require("./c/" + type)];
}));

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
