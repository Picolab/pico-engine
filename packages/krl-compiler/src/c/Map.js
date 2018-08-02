module.exports = function (ast, comp, e) {
  return e('obj-raw', comp(ast.value))
}
