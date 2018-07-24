module.exports = function (ast, ind, gen) {
  var src = ind() + 'log '
  src += ast.level + ' '
  src += gen(ast.expression)
  return src
}
