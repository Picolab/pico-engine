var _ = require('lodash')

module.exports = function (e, name, args, loc) {
  const stdlib = e('call', e('id', '$ctx.module'), [e('str', 'stdlib')])
  return e('acall', e('get', stdlib, e('str', name)), [
    e('id', '$ctx'),
    _.isArray(args)
      ? e('array', args)
      : args
  ])
}
