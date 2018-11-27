var _ = require('lodash')
var async = require('async')

module.exports = function (worker) {
  var queues = {}

  var getQ = function (picoId) {
    if (!_.has(queues, picoId)) {
      var q = async.queue(function (job, done) {
        job = JSON.parse(job)
        worker(picoId, job.type, job.data)
          .then(function (val) {
            done(null, val)
          })
          .catch(function (err) {
            setImmediate(function () {
              // wrapping in setImmediate resolves strange issues with UnhandledPromiseRejectionWarning
              // when infact we are handling the rejection
              done(err)
            })
          })
      })
      queues[picoId] = q
    }
    return queues[picoId]
  }

  return {
    enqueue: function (picoId, type, data, callback) {
      getQ(picoId).push(JSON.stringify({
        type: type,
        data: data
      }), callback)
    }
  }
}
