module.exports = function (ast, comp, e) {
  var key = e('str', ast.variable.value, ast.variable.loc)

  if (ast.path_expression) {
    key = e('obj', {
      key: key,
      path: comp(ast.path_expression)
    })
  }

  return e(';', e('acall', e('id', 'ctx.modules.del'), [
    e('id', 'ctx'),
    e('str', ast.variable.domain, ast.variable.loc),
    key
  ]))
}
