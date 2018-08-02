module.exports = function (ast, comp, e) {
  return e('obj-prop', e('string', ast.key.value + '', ast.key.loc), comp(ast.value))
}
