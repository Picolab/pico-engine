module.exports = function (ast, ind, gen) {
  var src
  var selectWhen = gen(ast.event)
  src = 'select ' + ast.kind
  src += selectWhen[0] === '\n' ? '' : ' '
  src += selectWhen
  if (ast.within) {
    src += '\n' + ind(1) + gen(ast.within)
  }
  return src
}
