var _ = require('lodash')
var cuid = require('cuid')
var test = require('ava')
var encode = require('encoding-down')
var dbRange = require('../../src/dbRange')
var levelup = require('levelup')
var memdown = require('memdown')
var bytewise = require('bytewise')
var safeJsonCodec = require('level-json-coerce-null')
var migration = require('../../src/migrations/20171031T182007_pvar_index')

test.cb('migration - pvar_index', function (t) {
  var ldb = levelup(encode(memdown(cuid()), {
    keyEncoding: bytewise,
    valueEncoding: safeJsonCodec
  }))
  var dbOps = []
  var put = function (varname, value) {
    dbOps.push({
      type: 'put',
      key: ['entvars', 'p0', 'r0', varname],
      value: value
    })
    dbOps.push({
      type: 'put',
      key: ['appvars', 'r0', varname],
      value: value
    })
  }

  put('v0', { foo: 'bar', baz: 1 })
  put('v1', [1, 2, 3, 'ok'])
  put('v2', 'hi')
  put('v3', true)
  put('v4', 123.45)

  ldb.batch(dbOps, function (err) {
    if (err) return t.end(err)
    migration.up(ldb, function (err) {
      if (err) return t.end(err)
      var entvars = {}
      var appvars = {}
      dbRange(ldb, {
        prefix: []
      }, function (data) {
        if (data.key[0] === 'entvars') {
          _.set(entvars, data.key.slice(3), data.value)
        } else if (data.key[0] === 'appvars') {
          _.set(appvars, data.key.slice(2), data.value)
        }
      }, function (err) {
        if (err) return t.end(err)

        t.deepEqual(entvars, appvars, 'ent and app should be the same for these tests')

        t.deepEqual(entvars.v0, {
          type: 'Map',
          value: { foo: 'bar', baz: 1 }
        })
        t.deepEqual(entvars.v1, {
          type: 'Array',
          value: [1, 2, 3, 'ok']
        })
        t.deepEqual(entvars.v2, {
          type: 'String',
          value: 'hi'
        })
        t.deepEqual(entvars.v3, {
          type: 'Boolean',
          value: true
        })
        t.deepEqual(entvars.v4, {
          type: 'Number',
          value: 123.45
        })

        t.end()
      })
    })
  })
})
