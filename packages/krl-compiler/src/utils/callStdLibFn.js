var _ = require('lodash')

module.exports = function (e, name, args, loc) {
  return e('acall', e('id', '$krl.stdlib'), [
    e('str', name),
    _.isArray(args)
      ? e('array', args)
      : args
  ])
}
