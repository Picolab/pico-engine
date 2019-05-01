var _ = require('lodash')

module.exports = function (e, name, args, loc) {
  return e('acall', e('get', e('id', '$stdlib'), e('str', name)), [
    e('id', '$ctx'),
    _.isArray(args)
      ? e('array', args)
      : args
  ])
}
