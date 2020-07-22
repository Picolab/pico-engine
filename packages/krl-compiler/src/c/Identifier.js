const krlStdlib = require('krl-stdlib')

module.exports = function (ast, comp, e, context) {
  const id = ast.value
  if (!comp.scope.has(id)) {
    throw comp.error(ast.loc, 'Undefined id: ' + id)
  }
  if (krlStdlib.stdlib[id] && !comp.stdlibToInject[id] && comp.scope.getItsHeight(id) === 1) {
    comp.stdlibToInject[id] = ast
  }
  return e('id', comp.jsId(id))
}
