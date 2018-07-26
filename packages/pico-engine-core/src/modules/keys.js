var ktypes = require('krl-stdlib/types')

module.exports = function (core) {
  return {
    get: function (ctx, id, callback) {
      var key = ctx.getMyKey(id)
      if (ktypes.isNull(key)) {
        callback(new Error('keys:' + id + ' not defined'))
        return
      }
      callback(null, key)
    }
  }
}
