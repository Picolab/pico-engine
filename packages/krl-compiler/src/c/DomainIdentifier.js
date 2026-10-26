module.exports = function (ast, comp, e, context) {
  if (ast.domain === 'ent') {
    return e('acall', e('id', '$ctx.rsCtx.getEnt'), [
      e('str', ast.value)
    ])
  }
  const mod = e('get', e('call', e('id', '$ctx.module'), [
    e('str', ast.domain)
  ]), e('str', ast.value))

  if (context && context.isGoingToBeApplied) {
    return mod
  }

  return e('call', mod, [e('id', '$ctx')])
}
