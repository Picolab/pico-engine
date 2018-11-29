var _ = require('lodash')

module.exports = function (e, name, args, loc) {
  return e('acall', e('id', 'ctx.applyFn'), [
    e('call', e('id', 'ctx.scope.get', loc), [e('string', name, loc)], loc),
    e('id', 'ctx'),
    _.isArray(args)
      ? e('array', args)
      : args
  ])
}
