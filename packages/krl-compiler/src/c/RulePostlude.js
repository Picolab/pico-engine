module.exports = function (ast, comp, e) {
  var body = []
  if (ast.fired) {
    body.push(e('if', e('id', 'fired'), e('block', comp(ast.fired))))
  }
  if (ast.notfired) {
    body.push(e('if', e('!', e('id', 'fired')), e('block', comp(ast.notfired))))
  }
  if (ast.always) {
    body = body.concat(comp(ast.always))
  }
  return body
}
