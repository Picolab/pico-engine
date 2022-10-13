var _ = require('lodash')

module.exports = function (astList, comp) {
  const declaredIds = []
  const compiled = {}
  for (const ast of astList) {
    if (ast.type !== 'Declaration' || ast.left.type !== 'Identifier') {
      throw comp.error(ast.loc, 'Only declarations should be in this block')
    }
    const id = ast.left.value
    if (declaredIds.includes(id)) {
      throw comp.error(ast.loc, 'Duplicate declaration: ' + id)
    }
    declaredIds.push(id)

    if (ast.right.type === 'Function' || ast.right.type === 'Action') {
      // don't compile yet, compile all expression declarations first
      comp.scope.set(ast.left.value, { type: 'Unknown' })
    } else {
      compiled[id] = comp(ast)
    }
  }

  // second pass for functions/actions
  for (const ast of astList) {
    const id = ast.left.value
    if (!compiled[id]) {
      compiled[id] = comp(ast)
    }
  }

  return _.map(declaredIds, function (id) {
    return compiled[id]
  })
}
