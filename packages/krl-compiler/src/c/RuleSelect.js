module.exports = function (ast, comp, e) {
  if (ast.kind !== 'when') {
    throw new Error('RuleSelect.kind not supported: ' + ast.kind)
  }

  var traverse = function (ast) {
    switch (ast.type) {
      case 'EventExpression':
        return comp(ast)
      case 'EventOperator':
      case 'EventGroupOperator':
        throw new Error('TODO compile select-when ops')
      default:
        throw new Error('invalid event ast node: ' + ast.type)
    }
  }

  var selectWhenRule = traverse(ast.event)

  if (ast.within) {
    throw new Error('TODO compile select-when within')
  }

  return selectWhenRule
}
