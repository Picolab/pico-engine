var _ = require("lodash");
var mkTree = require("estree-builder");

var compByType = _.fromPairs(_.map([
    "Action",
    "ActionBlock",
    "Application",
    "Arguments",
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
    "Null",
    "Number",
    "Parameter",
    "Parameters",
    "PersistentVariableAssignment",
    "RaiseEventStatement",
    "RegExp",
    "Rule",
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

function isKrlLoc(loc){
    return _.isPlainObject(loc) && _.has(loc, "start") && _.has(loc, "end");
}

module.exports = function(ast, options){
    options = options || {};

    var toLoc = options.toLoc || _.noop;

    var mkE = function(defaultKrlLoc){
        var defaultLoc = toLoc(defaultKrlLoc.start, defaultKrlLoc.end);

        return function(){
            var args = Array.prototype.slice.call(arguments);
            var lastI = args.length - 1;
            if(args[0] === "json" && lastI <= 2){
                lastI = 2;
            }
            var last = args[lastI];
            if(isKrlLoc(last)){
                args[lastI] = toLoc(last.start, last.end);
            }else{
                args.push(defaultLoc);
            }
            if(args[0] === "acall"){
                return {
                    type: "AwaitExpression",
                    argument: mkTree.apply(null, ["call"].concat(_.tail(args))),
                    loc: args[args.length - 1]
                };
            }else if(args[0] === "asyncfn"){
                args[0] = "fn";
                var estree =  mkTree.apply(null, args);
                estree.async = true;
                return estree;
            }
            return mkTree.apply(null, args);
        };
    };

    var krlError = function(loc, message){
        var err = new Error(message);
        err.krl_compiler = {
            loc: loc && toLoc(loc.start, loc.end),
        };
        return err;
    };

    var warnings = [];

    var warn = function(loc, message){
        warnings.push({
            loc: loc && toLoc(loc.start, loc.end),
            message: message,
        });
    };

    var compile = function compile(ast, context){
        if(_.isArray(ast)){
            return _.map(ast, function(a){
                return compile(a);
            });
        }else if(!ast || !_.has(ast, "type")){
            throw krlError(ast.loc, "Invalid ast node: " + JSON.stringify(ast));
        }else if(!_.has(compByType, ast.type)){
            throw krlError(ast.loc, "Unsupported ast node type: " + ast.type);
        }
        var comp = compile;
        if(context){
            comp = function(ast, c){
                return compile(ast, c || context);
            };
        }
        comp.error = krlError;
        comp.warn = warn;

        var estree;
        try{
            estree = compByType[ast.type](ast, comp, mkE(ast.loc), context);
        }catch(e){
            if(!e.krl_compiler){
                e.krl_compiler = {
                    loc: toLoc(ast.loc.start, ast.loc.end),
                };
            }
            throw e;
        }
        return estree;
    };

    var body = compile(ast);
    body = _.isArray(body) ? body : [];
    return {
        body: body,
        warnings: warnings,
    };
};
