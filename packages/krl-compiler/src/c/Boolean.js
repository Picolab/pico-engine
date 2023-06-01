module.exports = function (ast, comp, e) {
  return e(ast.value ? 'true' : 'false')
}
