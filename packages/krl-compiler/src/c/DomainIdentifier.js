module.exports = function (ast, comp, e, context) {
  if (ast.domain === 'ent') {
    return e('acall', e('id', '$ctx.rsCtx.getEnt'), [
      e('str', ast.value)
    ])
  }
  if (ast.domain === 'event' && ast.value === 'attrs') {
    return e('id', '$event.data.attrs')
  }
  if (ast.domain === 'event' && ast.value === 'eci') {
    return e('id', '$event.eci')
  }
  if (ast.domain === 'event' && ast.value === 'attr') {
    throw comp.error(ast.loc, 'event:attr(key) is not supported. Use event:attrs{key} instead')
  }

  const mod = e('get', e('call', e('id', '$ctx.module'), [
    e('str', ast.domain)
  ]), e('str', ast.value))

  if (context && context.isGoingToBeApplied) {
    return mod
  }

  if (ast.domain === 'custom') {
    // TODO remove
    return mod
  }

  return e('call', mod, [e('id', '$ctx')])
}
