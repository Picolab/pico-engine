module.exports = function (ast, comp, e) {
  if (ast.domain === 'ent') {
    return e('acall', e('id', '$ctx.getEnt'), [
      e('str', ast.value)
    ])
  }
  if (ast.domain === 'event' && ast.value === 'attrs') {
    return e('id', '$event.data.attrs')
  }
  return e('acall', e('id', 'ctx.modules.get'), [
    e('id', 'ctx'),
    e('str', ast.domain),
    e('str', ast.value)
  ])
}
