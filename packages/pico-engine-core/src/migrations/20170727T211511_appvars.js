var dbRange = require('../dbRange')

module.exports = {
  up: function (ldb, callback) {
    // /resultset/:rid/vars/:varname -> /appvars/:rid/:varname

    var dbOps = []

    dbRange(ldb, {
      prefix: ['resultset']
    }, function (data) {
      if (data.key[2] !== 'vars') {
        return
      }
      var rid = data.key[1]
      var varname = data.key[3]

      dbOps.push({
        type: 'put',
        key: ['appvars', rid, varname],
        value: data.value
      })

      dbOps.push({ type: 'del', key: data.key })
    }, function (err) {
      if (err) return callback(err)

      ldb.batch(dbOps, callback)
    })
  }
}
