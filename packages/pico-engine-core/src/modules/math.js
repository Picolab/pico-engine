var _ = require('lodash')
var crypto = require('crypto')
var ktypes = require('krl-stdlib/types')
var mkKRLfn = require('../mkKRLfn')

var supportedHashFns = crypto.getHashes()

module.exports = function (core) {
  return {
    def: {

      base64encode: mkKRLfn([
        'str'
      ], function (ctx, args, callback) {
        if (!_.has(args, 'str')) {
          return callback(new Error('math:base64encode needs a str string'))
        }

        var str = ktypes.toString(args.str)
        callback(null, Buffer.from(str, 'utf8').toString('base64'))
      }),

      base64decode: mkKRLfn([
        'str'
      ], function (ctx, args, callback) {
        if (!_.has(args, 'str')) {
          return callback(new Error('math:base64decode needs a str string'))
        }

        var str = ktypes.toString(args.str)
        callback(null, Buffer.from(str, 'base64').toString('utf8'))
      }),

      hashFunctions: mkKRLfn([
      ], function (ctx, args, callback) {
        callback(null, supportedHashFns)
      }),

      hash: mkKRLfn([
        'hashFn',
        'toHash'
      ], function (ctx, args, callback) {
        if (!_.has(args, 'hashFn')) {
          return callback(new Error('math:hash needs a hashFn string'))
        }
        if (!_.has(args, 'toHash')) {
          return callback(new Error('math:hash needs a toHash string'))
        }
        if (!_.includes(supportedHashFns, args.hashFn)) {
          if (ktypes.isString(args.hashFn)) {
            return callback(new Error("math:hash doesn't recognize the hash algorithm " + args.hashFn))
          } else {
            return callback(new TypeError('math:hash was given ' + ktypes.toString(args.hashFn) + ' instead of a hashFn string'))
          }
        }

        var str = ktypes.toString(args.toHash)
        var hash = crypto.createHash(args.hashFn)
        hash.update(str)

        callback(null, hash.digest('hex'))
      }),

      hmac: mkKRLfn([
        'hashFn',
        'key',
        'message',
        'encoding'
      ], function (ctx, args, callback) {
        if (!_.has(args, 'hashFn')) {
          return callback(new Error('math:hmac needs a hashFn string'))
        }
        if (!_.has(args, 'key')) {
          return callback(new Error('math:hmac needs a key string'))
        }
        if (!_.has(args, 'message')) {
          return callback(new Error('math:hmac needs a message string'))
        }
        if (!_.includes(supportedHashFns, args.hashFn)) {
          if (ktypes.isString(args.hashFn)) {
            return callback(new Error("math:hmac doesn't recognize the hash algorithm " + args.hashFn))
          } else {
            return callback(new TypeError('math:hmac was given ' + ktypes.toString(args.hashFn) + ' instead of a hashFn string'))
          }
        }
        var encoding = args.encoding || 'hex'
        if (!_.includes(['hex', 'base64'], encoding)) {
          return callback(new Error('math:hmac encoding must be "hex" or "base64" but was ' + encoding))
        }

        var key = ktypes.toString(args.key)
        var message = ktypes.toString(args.message)
        var hmac = crypto.createHmac(args.hashFn, key)
        hmac.update(message)

        callback(null, hmac.digest(encoding))
      })

    }
  }
}
