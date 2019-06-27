var _ = require('lodash')
var crypto = require('crypto')
var ktypes = require('krl-stdlib/types')
var mkKRLfn = require('../mkKRLfn')

var hashAlgorithms = Object.freeze(crypto.getHashes())

module.exports = function (core) {
  return {
    def: {

      base64encode: mkKRLfn([
        'str'
      ], function (ctx, args) {
        if (!_.has(args, 'str')) {
          throw new Error('math:base64encode needs a str string')
        }

        var str = ktypes.toString(args.str)
        return Buffer.from(str, 'utf8').toString('base64')
      }),

      base64decode: mkKRLfn([
        'str'
      ], function (ctx, args) {
        if (!_.has(args, 'str')) {
          throw new Error('math:base64decode needs a str string')
        }

        var str = ktypes.toString(args.str)
        return Buffer.from(str, 'base64').toString('utf8')
      }),

      hashAlgorithms: hashAlgorithms,

      hashFunctions: mkKRLfn([// DEPRECATED
      ], function (ctx, args) {
        ctx.log('warn', 'math:hashFunctions() is DEPRECATED use math:hashAlgorithms instead')
        return hashAlgorithms
      }),

      hash: mkKRLfn([
        'algorithm',
        'str',
        'encoding'
      ], function (ctx, args) {
        if (!_.has(args, 'algorithm')) {
          throw new Error('math:hash needs a algorithm string')
        }
        if (!_.has(args, 'str')) {
          throw new Error('math:hash needs a str string')
        }
        if (!_.includes(hashAlgorithms, args.algorithm)) {
          if (ktypes.isString(args.algorithm)) {
            throw new Error("math:hash doesn't recognize the hash algorithm " + args.algorithm)
          } else {
            throw new TypeError('math:hash was given ' + ktypes.toString(args.algorithm) + ' instead of a algorithm string')
          }
        }
        var encoding = args.encoding || 'hex'
        if (!_.includes(['hex', 'base64'], encoding)) {
          throw new Error('math:hash encoding must be "hex" or "base64" but was ' + encoding)
        }

        var str = ktypes.toString(args.str)
        var hash = crypto.createHash(args.algorithm)
        hash.update(str)

        return hash.digest(encoding)
      }),

      hmac: mkKRLfn([
        'algorithm',
        'key',
        'message',
        'encoding'
      ], function (ctx, args) {
        if (!_.has(args, 'algorithm')) {
          throw new Error('math:hmac needs a algorithm string')
        }
        if (!_.has(args, 'key')) {
          throw new Error('math:hmac needs a key string')
        }
        if (!_.has(args, 'message')) {
          throw new Error('math:hmac needs a message string')
        }
        if (!_.includes(hashAlgorithms, args.algorithm)) {
          if (ktypes.isString(args.algorithm)) {
            throw new Error("math:hmac doesn't recognize the hash algorithm " + args.algorithm)
          } else {
            throw new TypeError('math:hmac was given ' + ktypes.toString(args.algorithm) + ' instead of a algorithm string')
          }
        }
        var encoding = args.encoding || 'hex'
        if (!_.includes(['hex', 'base64'], encoding)) {
          throw new Error('math:hmac encoding must be "hex" or "base64" but was ' + encoding)
        }

        var key = ktypes.toString(args.key)
        var message = ktypes.toString(args.message)
        var hmac = crypto.createHmac(args.algorithm, key)
        hmac.update(message)

        return hmac.digest(encoding)
      }),

      abs: mkKRLfn([
        'number'
      ], function (ctx, args) {
        if (!_.has(args, 'number')) {
          throw new Error('math:abs needs a number')
        }

        return Math.abs(args.number)
      }),

      ceiling: mkKRLfn([
        'number',
        'precision'
      ], function (ctx, args) {
        if (!_.has(args, 'number')) {
          throw new Error('math:ceiling needs a number')
        }

        return _.ceil(args.number, args.precision)
      }),

      floor: mkKRLfn([
        'number',
        'precision'
      ], function (ctx, args) {
        if (!_.has(args, 'number')) {
          throw new Error('math:floor needs a number')
        }

        return _.floor(args.number, args.precision)
      }),

      int: mkKRLfn([
        'number'
      ], function (ctx, args) {
        if (!_.has(args, 'number')) {
          throw new Error('math:int needs a number')
        }

        return args.number >= 0 ? _.floor(args.number, 0) : _.ceil(args.number, 0)
      }),

      round: mkKRLfn([
        'number',
        'precision'
      ], function (ctx, args) {
        if (!_.has(args, 'number')) {
          throw new Error('math:round needs a number')
        }

        return _.round(args.number, args.precision)
      })

    }
  }
}
