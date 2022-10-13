module.exports = function (e, domain, id, args, loc) {
  var moduleVal = e('get',
    e('call', e('id', '$ctx.module', loc), [
      e('str', domain, loc)
    ], loc),
    e('str', id, loc),
    loc
  )

  return e('acall', moduleVal, [
    e('id', '$ctx', loc),
    args
  ], loc)
}
