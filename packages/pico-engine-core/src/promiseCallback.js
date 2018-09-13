module.exports = function promiseCallback (callback) {
  if (!callback) {
    var promise = new Promise(function (resolve, reject) {
      callback = function callback (err, value) {
        err ? reject(err) : resolve(value)
      }
    })
    callback.promise = promise
  }
  return callback
}
