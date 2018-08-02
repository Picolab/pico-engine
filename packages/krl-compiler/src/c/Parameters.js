var _ = require('lodash')

module.exports = function (ast, comp, e) {
  var usedIds = {}
  var hasSeenDefault = false
  return _.map(ast.params, function (param) {
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
    return comp(param)
  })
}
