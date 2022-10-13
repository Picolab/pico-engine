module.exports = function (ast, comp, e) {
  comp.scope.set(ast.id.value, { type: 'Unknown' })

  let estree = e('id', comp.jsId(ast.id.value), ast.id.loc)

  if (ast['default']) {
    const dflt = comp(ast['default'])
    if (dflt.$$Annotation) {
      comp.scope.set(ast.id.value, dflt.$$Annotation)
    }
    estree = {
      type: 'AssignmentPattern',
      left: estree,
      right: comp(ast['default'])
    }
  }

  return estree
}
