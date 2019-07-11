module.exports = function (ast, comp, e) {
  // TODO ?? for_rid: ast.for_rid ? comp(ast.for_rid) : e('nil')

  return e(';', e('acall', e('id', '$ctx.rsCtx.raiseEvent'), [
    e('string', ast.event_domain.value, ast.event_domain.loc),
    comp(ast.event_type),
    e('obj', {
      attrs: ast.event_attrs ? comp(ast.event_attrs) : e('nil')
    })
  ]))
}
