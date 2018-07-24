var callStdLibFn = require('../utils/callStdLibFn')

module.exports = function (ast, comp, e) {
  if (ast.op === 'not') {
    return e('!', comp(ast.arg))
  }
  return callStdLibFn(e, ast.op, [
    comp(ast.arg)
  ], ast.loc)
}
