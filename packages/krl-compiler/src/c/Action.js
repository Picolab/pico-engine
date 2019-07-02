module.exports = function (ast, comp, e) {
  if (!ast.action) {
    throw new Error('Missing RuleAction.action')
  }
  if (ast.action.type !== 'Identifier' && ast.action.type !== 'DomainIdentifier') {
    throw new Error('Unsuported RuleAction.action')
  }
  // TODO check annotation

  let actionFn

  if (ast.action.domain) {
    // e('str', ast.action.domain, ast.action.loc)
    // e('str', ast.action.value),
  } else {
    actionFn = comp(ast.action)
  }

  //
  // TODO
  // e('array', _.map(ast.setting, function (set) {
  //   return e('str', set.value, set.loc)
  // }))

  return e('acall', actionFn, [
    e('id', '$ctx'),
    comp(ast.args)
  ])
}
