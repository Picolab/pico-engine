module.exports = function (ast, comp, e) {
  if (ast.value < 0) {
    return e('-', e('number', -ast.value))
  }
  return e('number', ast.value)
}
