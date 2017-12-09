var _ = require("lodash");
var mkTree = require("estree-builder");

var comp_by_type = _.fromPairs(_.map([
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
        comp.error = krlError;
        comp.warn = warn;

        var estree;
        try{
            estree = comp_by_type[ast.type](ast, comp, mkE(ast.loc), context);
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
