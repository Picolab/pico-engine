var _ = require('lodash')

var genByType = _.fromPairs(_.map([
  'Action',
  'ActionBlock',
  'Application',
  'Arguments',
  'Array',
  'AttributeMatch',
  'Boolean',
  'Chevron',
  'ClearPersistentVariable',
  'ConditionalExpression',
  'Declaration',
  'DefAction',
  'DomainIdentifier',
  'ErrorStatement',
  'EventAggregator',
  'EventExpression',
  'EventGroupOperator',
  'EventOperator',
  'EventWithin',
  'Function',
  'GuardCondition',
  'Identifier',
  'InfixOperator',
  'Keyword',
  'LastStatement',
  'LogStatement',
  'Map',
  'MapKeyValuePair',
  'MemberExpression',
  'NamedArgument',
  'Null',
  'Number',
  'Parameter',
  'Parameters',
  'PersistentVariableAssignment',
  'RaiseEventStatement',
  'RegExp',
  'Rule',
  'RuleForEach',
  'RulePostlude',
  'RuleSelect',
  'Ruleset',
  'RulesetID',
  'RulesetMeta',
  'RulesetMetaProperty',
  'ScheduleEventStatement',
  'String',
  'UnaryOperator'
], function (type) {
  return [type, require('./g/' + type)]
}))

module.exports = function (ast, options) {
  options = options || {}
  var indentStr = _.isString(options.indent) ? options.indent : '    '

  var generate = function generate (ast, indentLevel) {
    indentLevel = indentLevel || 0
    if (!ast) {
      return ''
    }
    if (_.isArray(ast)) {
      return _.map(ast, function (a) {
        return generate(a, indentLevel)
      }).join('\n')
    }
    if (_.has(genByType, ast.type)) {
      var ind = function (n) {
        return _.repeat(indentStr, indentLevel + (n || 0))
      }
      var gen = function (ast, increaseIndentBy) {
        increaseIndentBy = _.parseInt(increaseIndentBy, 10) || 0
        return generate(ast, indentLevel + increaseIndentBy)
      }
      return genByType[ast.type](ast, ind, gen)
    }
    throw new Error('Unsupported ast node type: ' + ast.type)
  }

  return generate(ast, 0)
}
