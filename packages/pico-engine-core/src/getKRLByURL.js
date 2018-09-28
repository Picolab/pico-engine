var fs = require('fs')
var urllib = require('url')
var request = require('request')

var httpGetKRL = function (url, callback) {
  request(url, function (err, resp, body) {
    if (err) {
      return callback(err)
    }
    if (resp.statusCode !== 200) {
      return callback(new Error('Got a statusCode=' + resp.statusCode + ' for: ' + url))
    }
    callback(null, body)
  })
}

module.exports = function (url) {
  return new Promise(function (resolve, reject) {
    var urlParsed = urllib.parse(url)
    if (urlParsed.protocol === 'file:') {
      fs.readFile(decodeURI(urlParsed.path), function (err, data) {
        if (err) reject(err)
        else resolve(data.toString())
      })
      return
    }
    httpGetKRL(url, function (err, body) {
      if (err) reject(err)
      else resolve(body)
    })
  })
}
