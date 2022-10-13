const krlStdlib = require('krl-stdlib')

module.exports = function (ast, comp, e, context) {
  const id = ast.value
  if (krlStdlib.stdlib[id] && !comp.stdlibToInject[id] && comp.scope.getItsHeight(id) === 1) {
    comp.stdlibToInject[id] = ast
  }

  const estree = e('id', comp.jsId(id))

  const scopeMeta = comp.scope.get(id)
  if (typeof scopeMeta.type === 'string' && scopeMeta.type !== 'Unknown') {
    estree.$$Annotation = scopeMeta
  }

  return estree
}
