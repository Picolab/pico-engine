const jsIdent = require('../utils/jsIdent')

module.exports = function (ast, comp, e) {
  let annotation = { type: 'Unknown' }

  let estree = e('id', jsIdent(ast.id.value), ast.id.loc)

  if (ast['default']) {
    const dflt = comp(ast['default'])
    if (dflt.$$Annotation) {
      annotation = dflt.$$Annotation
    }
    estree = {
      type: 'AssignmentPattern',
      left: estree,
      right: comp(ast['default'])
    }
  }

  comp.scope.set(ast.id.value, annotation)

  return estree
}
