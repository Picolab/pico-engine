module.exports = function (e, domain, id, args, loc) {
  var moduleVal = e('acall',
    e('id', 'ctx.modules.get', loc),
    [
      e('id', 'ctx', loc),
      e('str', domain, loc),
      e('str', id, loc)
    ],
    loc
  )
  return e('acall', e('id', 'ctx.applyFn'), [
    moduleVal,
    e('id', 'ctx', loc),
    args
  ], loc)
}
