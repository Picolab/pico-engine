var callStdLibFn = require('../utils/callStdLibFn')

module.exports = function (ast, comp, e) {
  if ((ast.op === '||') || (ast.op === '&&')) {
    return e(ast.op, comp(ast.left), comp(ast.right))
  }
  return callStdLibFn(e, ast.op, [
    comp(ast.left),
    comp(ast.right)
  ], ast.loc)
}
