var ktypes = require('krl-stdlib/types')

module.exports = function (core) {
  return {
    get: function (ctx, id) {
      var key = ctx.getMyKey(id)
      if (ktypes.isNull(key)) {
        throw new Error('keys:' + id + ' not defined')
      }
      return key
    }
  }
}
