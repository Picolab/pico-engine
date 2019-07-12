const jsIdent = require('../utils/jsIdent')

module.exports = function (ast, comp, e) {
  if (ast.op !== '=') {
    throw comp.error(ast.loc, 'Unsuported Declaration.op: ' + ast.op)
  }
  if (ast.left.type === 'MemberExpression') {
    throw comp.error(ast.left.loc, 'This is an assignment, not a declaration')
  } else if (ast.left.type === 'Identifier') {
    if (ast.left.value === 'null') {
      throw comp.error(ast.loc, 'Cannot declare: ' + ast.left.value)
    }
    const estree = comp(ast.right)
    comp.scope.set(ast.left.value, estree.$$Annotation || { type: 'Unknown' })
    return e('const',
      e('id', jsIdent(ast.left.value), ast.left.loc),
      estree
    )
  }
  throw comp.error(ast.loc, 'Cannot declare ' + ast.left.type)
}
