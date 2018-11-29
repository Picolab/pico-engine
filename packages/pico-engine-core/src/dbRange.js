var _ = require('lodash')

function dbRange (ldb, opts, onData, callbackOrig) {
  var hasCalledback = false
  var callback = function () {
    if (hasCalledback) return
    hasCalledback = true
    callbackOrig.apply(null, arguments)
  }

  if (_.has(opts, 'prefix')) {
    opts = _.assign({}, opts, {
      gte: opts.prefix,
      lte: opts.prefix.concat([undefined])// bytewise sorts with null at the bottom and undefined at the top
    })
    delete opts.prefix
  }
  var s = ldb.createReadStream(opts)
  var stopRange = function () {
    s.destroy()
    callback()
  }
  s.on('error', function (err) {
    callback(err)
  })
  s.on('end', callback)
  s.on('data', function (data) {
    onData(data, stopRange)
  })
}

dbRange.promise = function dbRangeP (ldb, opts, onData) {
  return new Promise(function (resolve, reject) {
    var arr = []
    dbRange(ldb, opts, function (data) {
      arr.push(Promise.resolve(onData(data)))
    }, function (err) {
      if (err) reject(err)
      Promise.all(arr).then(resolve).catch(reject)
    })
  })
}

module.exports = dbRange
