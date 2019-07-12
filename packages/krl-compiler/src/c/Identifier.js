const jsIdent = require('../utils/jsIdent')

module.exports = function (ast, comp, e, context) {
  const id = ast.value
  if (!comp.scope.has(id)) {
    if (!comp.idsOutOfScope[id]) {
      comp.idsOutOfScope[id] = ast
    }
  }
  return e('id', jsIdent(id))
}
