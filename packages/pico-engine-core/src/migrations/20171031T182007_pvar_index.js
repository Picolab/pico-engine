var _ = require('lodash')
var ktypes = require('krl-stdlib/types')
var dbRange = require('../dbRange')

module.exports = {
  up: function (ldb, callback) {
    var dbOps = []

    var onKV = function (data) {
      var keyPrefix = data.key
      var val = data.value

      // NOTE: not sharing code with DB.js b/c migrations should be immutable
      // i.e. produce the same result regardless of previous codebase states
      var indexType = ktypes.typeOf(val)
      var rootValue = { type: indexType }
      switch (indexType) {
        case 'Null':
          rootValue.value = null
          break
        case 'Function':
        case 'Action':
          rootValue.type = 'String'
          rootValue.value = ktypes.toString(val)
          break
        case 'Map':
        case 'Array':
          _.each(val, function (v, k) {
            dbOps.push({
              type: 'put',
              key: keyPrefix.concat(['value', k]),
              value: v
            })
          })
          break
        default:
          rootValue.value = val
      }
      dbOps.push({
        type: 'put',
        key: keyPrefix,
        value: rootValue
      })
    }

    dbRange(ldb, {
      prefix: ['entvars']
    }, onKV, function (err) {
      if (err) return callback(err)

      dbRange(ldb, {
        prefix: ['appvars']
      }, onKV, function (err) {
        if (err) return callback(err)

        ldb.batch(dbOps, callback)
      })
    })
  }
}
