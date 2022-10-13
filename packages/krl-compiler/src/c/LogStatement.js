module.exports = function (ast, comp, e) {
  return e(';', e('call', e('id', '$ctx.log.' + ast.level), [
    comp(ast.expression)
  ]))
}
