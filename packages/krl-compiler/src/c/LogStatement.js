module.exports = function (ast, comp, e) {
  return e(';', e('call', e('id', 'ctx.log'), [
    e('string', ast.level),
    comp(ast.expression)
  ]))
}
