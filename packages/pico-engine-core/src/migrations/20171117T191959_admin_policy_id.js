var _ = require('lodash')
var dbRange = require('../dbRange')

module.exports = {
  up: function (ldb, callback) {
    var dbOps = []

    // NOTE: not sharing with DB.js b/c migrations should be immutable
    //      i.e. produce the same result regardless of previous codebase states
    var ADMIN_POLICY_ID = 'allow-all-policy'// NOTE: we default to allow-all for now

    // the admin policy is hard wired in, so we should create it once before
    // the engine starts up (i.e. as this migration)
    dbOps.push({
      type: 'put',
      key: ['policy', ADMIN_POLICY_ID],
      value: {
        id: ADMIN_POLICY_ID,
        name: 'admin channel policy',
        event: { allow: [{}] },
        query: { allow: [{}] }
      }
    })

    // old engines don't have policy_ids, so just set them all to it
    dbRange(ldb, {
      prefix: ['channel']
    }, function (data) {
      if (_.has(data.value, 'policy_id')) {
        return
      }
      dbOps.push({
        type: 'put',
        key: data.key,
        value: _.assign({}, data.value, {
          policy_id: ADMIN_POLICY_ID
        })
      })
    }, function (err) {
      if (err) return callback(err)
      ldb.batch(dbOps, callback)
    })
  }
}
