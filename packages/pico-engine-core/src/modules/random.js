var _ = require('lodash')
var cuid = require('cuid')
var ktypes = require('krl-stdlib/types')
var mkKRLfn = require('../mkKRLfn')
var randomWords = require('random-words')

var fixLowerUpperArgs = function (args, round) {
  var lowerNum = ktypes.toNumberOrNull(args.lower)
  if (round && lowerNum !== null) {
    lowerNum = _.round(lowerNum)
  }

  var upperNum = ktypes.toNumberOrNull(args.upper)
  if (round && upperNum !== null) {
    upperNum = _.round(upperNum)
  }

  var upper

  if (upperNum === null) {
    upper = lowerNum === null ? 1 : 0
  } else {
    upper = upperNum
  }

  return {
    lower: lowerNum === null ? 0 : lowerNum,
    upper: upper
  }
}

module.exports = function (core) {
  return {
    def: {

      uuid: mkKRLfn([
      ], function (ctx, args, callback) {
        callback(null, cuid())
      }),

      word: mkKRLfn([
      ], function (ctx, args, callback) {
        callback(null, randomWords())
      }),

      integer: mkKRLfn([
        'upper',
        'lower'
      ], function (ctx, argsOrig, callback) {
        var args = fixLowerUpperArgs(argsOrig, true)

        callback(null, _.random(args.lower, args.upper))
      }),

      number: mkKRLfn([
        'upper',
        'lower'
      ], function (ctx, argsOrig, callback) {
        var args = fixLowerUpperArgs(argsOrig)

        callback(null, _.random(args.lower, args.upper, true))
      })

    }
  }
}
