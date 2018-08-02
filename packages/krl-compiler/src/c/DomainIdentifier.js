module.exports = function (ast, comp, e) {
  return e('acall', e('id', 'ctx.modules.get'), [
    e('id', 'ctx'),
    e('str', ast.domain),
    e('str', ast.value)
  ])
}
