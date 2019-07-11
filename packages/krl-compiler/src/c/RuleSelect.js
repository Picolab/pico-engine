module.exports = function (ast, comp, e) {
  if (ast.kind !== 'when') {
    throw new Error('RuleSelect.kind not supported: ' + ast.kind)
  }

  const selectWhenRule = comp(ast.event)

  if (ast.within) {
    return e('call', e('id', '$env.SelectWhen.within'), [
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
}
