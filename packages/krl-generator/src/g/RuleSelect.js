module.exports = function (ast, ind, gen) {
  if (ast.kind === 'where') {
    let src = 'select where ' + gen(ast.expression, 1)
    return src
  }
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
