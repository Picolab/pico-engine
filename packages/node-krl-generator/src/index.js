var _ = require("lodash");

var gen_by_type = _.fromPairs(_.map([
    "Application",
    "Array",
    "AttributeMatch",
    "Boolean",
    "Chevron",
    "ClearPersistentVariable",
    "ConditionalExpression",
    "Declaration",
    "DefAction",
    "DomainIdentifier",
    "ErrorStatement",
    "EventAggregator",
    "EventExpression",
    "EventGroupOperator",
    "EventOperator",
    "EventWithin",
    "ExpressionStatement",
    "Function",
    "GuardCondition",
    "Identifier",
    "InfixOperator",
    "Keyword",
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
    "RulesetMetaProperty",
    "ScheduleEventStatement",
    "String",
    "UnaryOperator",
], function(type){
    return [type, require("./g/" + type)];
}));

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
