var _ = require('lodash')

module.exports = function (e, name, args, loc) {
  return e('acall',
    e('id', 'ctx.callKRLstdlib', loc),
    [
      e('string', name, loc),
      _.isArray(args)
        ? e('array', args)
        : args
    ],
    loc
  )
}
