var dbRange = require('../dbRange')

module.exports = {
  up: function (ldb, callback) {
    // /entvars/:pico_id/io.picolabs.pico/parent
    // /entvars/:pico_id/io.picolabs.pico/children

    var dbOps = []

    dbRange(ldb, {
      prefix: ['entvars']
    }, function (data) {
      var picoId = data.key[1]

      if (data.key[2] !== 'io.picolabs.pico') {
        return
      }
      if (data.key[3] === 'parent') {
        var parentId = data.value.id

        dbOps.push({
          type: 'put',
          key: ['pico', picoId],
          value: {
            id: picoId,
            parent_id: parentId
          }
        })
        dbOps.push({
          type: 'put',
          key: ['pico-children', parentId, picoId],
          value: true
        })
      }
    }, function (err) {
      if (err) return callback(err)

      dbRange(ldb, {
        prefix: ['channel'],
        limit: 1// the old schema relied on the first eci to be root
      }, function (data) {
        dbOps.push({
          type: 'put',
          key: ['root_pico'],
          value: {
            id: data.value.pico_id,
            eci: data.value.id
          }
        })
      }, function (err) {
        if (err) return callback(err)

        ldb.batch(dbOps, callback)
      })
    })
  }
}
