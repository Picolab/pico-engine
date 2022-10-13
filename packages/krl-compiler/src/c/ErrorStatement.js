module.exports = function (ast, comp, e) {
  const ruleName = comp.scope.get('$rule_name')

  const raise = e(';', e('acall', e('id', '$ctx.rsCtx.raiseEvent'), [
    e('str', 'system'),
    e('str', 'error'),
    e('obj', {
      level: e('string', ast.level),
      data: comp(ast.expression),
      rid: e('id', '$ctx.rsCtx.ruleset.rid'),
      rule_name: typeof ruleName === 'string'
        ? e('string', ruleName)
        : e('null'),
      genus: e('string', 'user')
    }),
    e('id', '$ctx.rsCtx.ruleset.rid')
  ]))

  if (ast.level === 'error') {
    return e('block', [
      e(';', e('call', e('id', '$last'), [])),
      e(';', e('call', e('id', '$ctx.rsCtx.clearSchedule'), [])),
      raise,
      e('return')
    ])
  }
  return raise
}
