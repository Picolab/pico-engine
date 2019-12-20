var _ = require('lodash')

module.exports = function (astList, comp) {
  var usedIDs = {}
  return _.map(astList, function (ast) {
    var id
    if (ast.type === 'Declaration') {
      if (ast.left.type === 'Identifier') {
        id = ast.left.value
      }
    } else {
      throw comp.error(ast.loc, 'Only declarations should be in this block')
    }
    if (id) {
      if (usedIDs[id]) {
        // TODO make this an error, but right now some code relies on this
        comp.warn(ast.loc, 'Duplicate declaration: ' + id)
      }
      usedIDs[id] = true
    }
    return comp(ast)
  })
}
