module.exports = function (ast, comp, e) {
  if (ast.variable.domain !== 'ent') {
    throw comp.error(ast.loc, 'ClearPersistentVariable only works for `ent:`, not `' + ast.op + ':`')
  }
  var key = e('str', ast.variable.value, ast.variable.loc)

  if (ast.path_expression) {
    // TODO optimize
    return e(';', e('acall', e('id', '$ctx.rsCtx.putEnt'), [
      key,
      e('acall', e('id', '$stdlib.delete'), [
        e('id', '$ctx'),
        e('array', [
          e('acall', e('id', '$ctx.rsCtx.getEnt'), [key]),
          comp(ast.path_expression)
        ])
      ])
    ]))
  }

  return e(';', e('acall', e('id', '$ctx.rsCtx.delEnt'), [key]))
}
