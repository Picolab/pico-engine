const callStdLibFn = require('../utils/callStdLibFn')
const jsIdent = require('../utils/jsIdent')

var ePathSet = function (ast, comp, e, path) {
  return e(';', e('call', e('id', 'ctx.scope.set'), [
    e('str', ast.left.object.value, ast.left.loc),
    callStdLibFn(e, 'set', [
      comp(ast.left.object),
      path,
      comp(ast.right)
    ], ast.left.loc)
  ]))
}

module.exports = function (ast, comp, e) {
  if (ast.op !== '=') {
    throw comp.error(ast.loc, 'Unsuported Declaration.op: ' + ast.op)
  }
  if (ast.left.type === 'MemberExpression') {
    // TODO This is actually an assignment, should we allow this?
    if (ast.left.method === 'path') {
      return ePathSet(ast, comp, e, comp(ast.left.property))
    } else if (ast.left.method === 'index') {
      return ePathSet(ast, comp, e, e('array', [
        comp(ast.left.property)
      ], ast.left.property.loc))
    }
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
