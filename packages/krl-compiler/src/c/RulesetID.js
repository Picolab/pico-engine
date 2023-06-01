module.exports = function (ast, comp, e) {
  return e('string', ast.value)
}
