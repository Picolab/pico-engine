var _ = require('lodash')
var normalizeKRLArgs = require('./normalizeKRLArgs')

module.exports = function (paramOrder, fn) {
  var fixArgs = _.partial(normalizeKRLArgs, paramOrder)
  return function (ctx, args) {
    return Promise.resolve(fn(ctx, fixArgs(args)))
  }
}
