module.exports = function (ast, comp, e) {
  const args = {}

  if (ast.event_domainAndType) {
    args.domainAndType = comp(ast.event_domainAndType)
  } else {
    args.domain = e('string', ast.event_domain.value, ast.event_domain.loc)
    args.type = comp(ast.event_type)
  }

  args.attributes = ast.event_attrs ? comp(ast.event_attrs) : e('nil')

  args.for_rid = ast.for_rid ? comp(ast.for_rid) : e('nil')

  return e(';', e('acall', e('id', 'ctx.raiseEvent'), [e('obj', args)]))
}
