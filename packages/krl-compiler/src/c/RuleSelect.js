module.exports = function (ast, comp, e) {
  if (ast.kind === 'when') {
    const selectWhenRule = comp(ast.event)

    if (ast.within) {
      return e('call', e('id', '$ctx.krl.SelectWhen.within'), [
        comp(ast.within),
        selectWhenRule,
        e('fn', ['$event', '$state'], [
          e('return', e('call', e('id', 'Object.assign'), [
            e('obj', {}),
            e('id', '$state'),
            e('obj', {
              setting: e('obj', {})
            })
          ]))
        ])
      ])
    }

    return selectWhenRule
  } else if (ast.kind === 'where') {
    const expr = comp(ast.expression)

    return e('call', e('id', '$ctx.krl.SelectWhen.e'),
      [
        e('str', '*'),
        e('asyncfn', ['$event', '$state'], [
          e('return', e('obj', {
            match: expr,
            state: e('id', '$state')
          }))
        ])
      ]
    )
  }

  throw new Error('RuleSelect.kind not supported: ' + ast.kind)
}
