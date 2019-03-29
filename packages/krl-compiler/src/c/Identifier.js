const jsIdent = require('../utils/jsIdent')

module.exports = function (ast, comp, e, context) {
  return e('id', jsIdent(ast.value))
}
