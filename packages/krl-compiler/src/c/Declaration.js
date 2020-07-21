module.exports = function (ast, comp, e) {
  if (ast.op !== '=') {
    throw comp.error(ast.loc, 'Unsuported Declaration.op: ' + ast.op)
  }
  if (ast.left.type === 'MemberExpression') {
    throw comp.error(ast.left.loc, 'This is an assignment, not a declaration')
  }
  if (ast.left.type !== 'Identifier') {
    throw comp.error(ast.loc, 'Cannot declare ' + ast.left.type)
  }
  if (ast.left.value === 'null') {
    throw comp.error(ast.loc, 'Cannot declare: ' + ast.left.value)
  }

  if (ast.right.type === 'Function' || ast.right.type === 'Action') {
    // for recursion, declare the symbol first, then assign type if found
    comp.scope.set(ast.left.value, { type: 'Unknown' })
  }
  const estree = comp(ast.right)
  comp.scope.set(ast.left.value, estree.$$Annotation
    ? estree.$$Annotation
    : { type: 'Unknown' })

  return e('const',
    e('id', comp.jsId(ast.left.value), ast.left.loc),
    estree
  )
}
