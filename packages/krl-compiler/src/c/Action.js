const _ = require('lodash')
const jsIdent = require('../utils/jsIdent')

module.exports = function (ast, comp, e) {
  if (!ast.action) {
    throw new Error('Missing RuleAction.action')
  }
  if (ast.action.type !== 'Identifier' && ast.action.type !== 'DomainIdentifier') {
    throw new Error('Unsuported RuleAction.action')
  }

  let actionFn = comp(ast.action)

  let actionType = actionFn.$$Annotation
    ? actionFn.$$Annotation.type
    : 'Unknown'

  switch (actionType) {
    case 'Action':
      break// great!
    case 'Unknown':
      // runtime check the type
      actionFn = e('call', e('id', '$env.krl.assertAction'), [actionFn])
      break// ok
    default:
      throw comp.error(ast.action.loc, 'Not an action')
  }

  let estree = e('acall', actionFn, [
    e('id', '$ctx'),
    comp(ast.args)
  ])

  if (_.size(ast.setting) === 1) {
    const id = ast.setting[0]
    comp.scope.set(id.value, { type: 'Unknown' })

    return e('var',
      e('id', jsIdent(id.value), id.loc),
      estree,
      id.loc
    )
  } else if (_.size(ast.setting) > 1) {
    throw comp.error(ast.setting[1].loc, 'Actions only return on value')
  } else {
    return e(';', estree, ast.loc)
  }
}
