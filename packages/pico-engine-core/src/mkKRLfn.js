var _ = require('lodash')
var util = require('util')
var normalizeKRLArgs = require('./normalizeKRLArgs')

module.exports = function (paramOrder, fn) {
  var fixArgs = _.partial(normalizeKRLArgs, paramOrder)
  var wfn = util.promisify(fn)
  return function (ctx, args) {
    return wfn(ctx, fixArgs(args))
  }
}
