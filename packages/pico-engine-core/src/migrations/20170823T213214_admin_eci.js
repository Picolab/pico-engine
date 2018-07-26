var _ = require('lodash')
var dbRange = require('../dbRange')
var sovrinDID = require('sovrin-did')

function newChannelBase (opts) {
  var did = sovrinDID.gen()
  var channel = {
    id: did.did,
    pico_id: opts.pico_id,
    name: opts.name,
    type: opts.type,
    sovrin: did
  }
  var dbOps = [
    {
      type: 'put',
      key: ['channel', channel.id],
      value: channel
    },
    {
      type: 'put',
      key: ['pico-eci-list', channel.pico_id, channel.id],
      value: true
    }
  ]
  return {
    channel: channel,
    dbOps: dbOps
  }
}

module.exports = {
  up: function (ldb, callback) {
    var dbOps = []

    ldb.get(['root_pico'], function (err, rootPico) {
      if (err) {
        if (err.notFound) {
          rootPico = {}
        } else {
          return callback(err)
        }
      }

      dbRange(ldb, {
        prefix: ['pico']
      }, function (data) {
        var picoId = data.key[1]

        var c = newChannelBase({
          pico_id: picoId,
          name: 'admin',
          type: 'secret'
        })

        dbOps = dbOps.concat(c.dbOps)

        var pico = _.assign({}, data.value, {
          admin_eci: c.channel.id
        })

        dbOps.push({
          type: 'put',
          key: ['pico', picoId],
          value: pico
        })

        if (rootPico.id === picoId) {
          dbOps.push({
            type: 'put',
            key: ['root_pico'],
            value: pico
          })
        }
      }, function (err) {
        if (err) return callback(err)

        ldb.batch(dbOps, callback)
      })
    })
  }
}
