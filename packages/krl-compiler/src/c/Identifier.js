module.exports = function (ast, comp, e, context) {
  return e('call', e('id', 'ctx.scope.get'), [e('str', ast.value)])
}
