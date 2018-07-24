module.exports = function (ast, comp, e) {
  return e(
    ast.level === 'error' ? 'return' : ';',
    e('acall', e('id', 'ctx.raiseError'), [
      e('id', 'ctx'),
      e('string', ast.level),
      comp(ast.expression)
    ])
  )
}
