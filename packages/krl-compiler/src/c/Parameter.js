module.exports = function (ast, comp, e) {
  var mkIdStr = function () {
    return e('string', ast.id.value, ast.id.loc)
  }

  var getArg = e('get', e('id', 'args'), mkIdStr())

  var val = getArg

  if (ast['default']) {
    // only evaluate default if needed i.e. default may be calling an function
    val = e('?',
      e('call', e('id', 'args.hasOwnProperty'), [mkIdStr()]),
      getArg,
      comp(ast['default'])
    )
  }
  return e(';', e('call', e('id', 'ctx.scope.set'), [
    mkIdStr(),
    val
  ]))
}
