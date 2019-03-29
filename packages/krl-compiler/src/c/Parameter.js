const jsIdent = require('../utils/jsIdent')

module.exports = function (ast, comp, e) {
  const argId = e('id', jsIdent(ast.id.value), ast.id.loc)

  if (ast['default']) {
    return {
      type: 'AssignmentPattern',
      left: argId,
      right: comp(ast['default'])
    }
  }
  return argId
}
