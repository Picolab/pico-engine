var _ = require('lodash')

module.exports = function (ast, comp, e) {
  var body = []

  var condition = ast.condition
    ? comp(ast.condition)
    : e('true')

  body.push(e('var', 'fired', condition))

  var ifBody = []

  var blockType = _.isString(ast.block_type)
    ? ast.block_type
    : 'every'

  if (blockType === 'choose') {
    ifBody.push(e('switch', comp(ast.discriminant), _.map(ast.actions, function (action) {
      if (!action.label || action.label.type !== 'Identifier') {
        throw comp.error(action.loc, 'all actions inside a `choose` block need a label')
      }
      return e('case', e('string', action.label.value, action.label.loc), [
        e(';', comp(action), action.loc),
        e('break', action.loc)
      ], action.loc)
    })))
  } else if (blockType === 'sample') {
    ifBody.push(e('switch', e('call', e('id', 'Math.floor'), [
      e('*', e('call', e('id', 'Math.random'), []), e('number', _.size(ast.actions)))
    ]), _.map(ast.actions, function (action, i) {
      return e('case', e('number', i, action.loc), [
        e(';', comp(action), action.loc),
        e('break', action.loc)
      ], action.loc)
    })))
  } else if (blockType === 'every') {
    ifBody = ifBody.concat(_.map(ast.actions, function (action) {
      return e(';', comp(action))
    }))
  } else {
    throw new Error('ActionBlock.blockType = "' + blockType + '" not supported')
  }

  body.push(e('if', e('id', 'fired'), e('block', ifBody)))

  return body
}
