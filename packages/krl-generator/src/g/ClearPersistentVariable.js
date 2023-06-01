module.exports = function (ast, ind, gen) {
  var src = ind() + 'clear ' + gen(ast.variable)

  if (ast.path_expression) {
    src += '{' + gen(ast.path_expression) + '}'
  }

  return src
}
