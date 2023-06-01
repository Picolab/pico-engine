module.exports = function (ast, comp, e) {
  return e('ternary',
    comp(ast.test),
    comp(ast.consequent),
    comp(ast.alternate)
  )
}
