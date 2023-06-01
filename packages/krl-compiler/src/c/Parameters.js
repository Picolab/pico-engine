const _ = require('lodash')

module.exports = function (ast, comp, e) {
  const usedIds = {}
  let hasSeenDefault = false

  // javascript doesn't allow `await` in the defaults, so we need to do those in the function body
  const defaultSetups = []

  const params = _.map(ast.params, function (param) {
    var id = param.id.value
    if (usedIds[id]) {
      throw comp.error(param.id.loc, 'Duplicate parameter: ' + id)
    }
    usedIds[id] = true

    if (param['default']) {
      hasSeenDefault = true
    } else if (hasSeenDefault) {
      throw comp.error(param.loc, 'Cannot have a non-default parameter after a defaulted one')
    }

    const estree = comp(param)

    if (estree.type === 'AssignmentPattern') {
      switch (estree.right.type) {
        case 'Literal':
          break
        default:
          const right = estree.right
          estree.right = e('id', '$default')
          defaultSetups.push(e('if',
            e('==', estree.left, e('id', '$default')),
            e('block', [
              e(';', e('=', estree.left, right))
            ])
          ))
      }
    }
    return estree
  })

  return {
    params,
    defaultSetups
  }
}
