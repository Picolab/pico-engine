var _ = require('lodash')
var util = require('util')
var normalizeKRLArgs = require('./normalizeKRLArgs')

module.exports = function (paramOrder, fn) {
  var fixArgs = _.partial(normalizeKRLArgs, paramOrder)
  if (fn.length === 3) {
    // TODO remove this
    fn = util.promisify(fn)
  }
  return function (ctx, args) {
    return fn(ctx, fixArgs(args))
  }
}
