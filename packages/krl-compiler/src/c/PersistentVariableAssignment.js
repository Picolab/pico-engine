module.exports = function (ast, comp, e) {
  if (ast.op !== ':=') {
    throw comp.error(ast.loc, 'Unsuported PersistentVariableAssignment.op: ' + ast.op)
  }
  if (ast.left.type !== 'DomainIdentifier' || !/^(ent|app)$/.test(ast.left.domain)) {
    throw comp.error(ast.left.loc, 'PersistentVariableAssignment - only works on ent:* or app:* variables')
  }

  if (ast.right.type === 'Application' &&
    ast.right.callee.type === 'MemberExpression' &&
    ast.right.callee.object.type === 'DomainIdentifier' &&
    !ast.path_expression
  ) {
    const leftPVar = ast.left.domain + ':' + ast.left.value
    const rightPVar = ast.right.callee.object.domain + ':' + ast.right.callee.object.value
    if (leftPVar === rightPVar) {
      if (ast.right.callee.property.type === 'Identifier' && ast.right.callee.property.value === 'put') {
        // Performance Hint
        // ent:v := ent:v.put(k, d)
        // - should be -
        // ent:v{k} := d
        comp.warn(ast.right.callee.object.loc, 'Performance Hint: to leverage indexes use `' + leftPVar + '{key} := value` instead of .put(key, value)')
      } else if (ast.right.callee.property.type === 'Identifier' && ast.right.callee.property.value === 'append') {
        // Use the optimized append
        return e(';', e('acall', e('id', 'ctx.modules.append'), [
          e('id', 'ctx'),
          e('str', ast.left.domain, ast.left.loc),
          e('str', ast.left.value, ast.left.loc),
          e('array', comp(ast.right.args.args))
        ]))
      }
    }
  }

  var valueToStore = comp(ast.right)

  var key = e('str', ast.left.value, ast.left.loc)

  if (ast.path_expression) {
    key = e('obj', {
      key: key,
      path: comp(ast.path_expression)
    })
  }

  return e(';', e('acall', e('id', 'ctx.modules.set'), [
    e('id', 'ctx'),
    e('str', ast.left.domain, ast.left.loc),
    key,
    valueToStore
  ]))
}
