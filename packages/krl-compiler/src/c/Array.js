module.exports = function (ast, comp, e) {
  return e('array', comp(ast.value))
}
