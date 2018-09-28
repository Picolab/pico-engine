var _ = require('lodash')
var fs = require('fs')
var util = require('util')
var path = require('path')
var mkdirp = require('mkdirp')
var compiler = require('krl-compiler')
var versionKey = [
  require('pico-engine-core/package.json').version,
  require('krl-compiler/package.json').version
].join('-')

var fsExist = function (filePath, callback) {
  fs.stat(filePath, function (err, stats) {
    if (err) {
      if (err.code === 'ENOENT') {
        return callback(null, false)
      } else {
        return callback(err)
      }
    }
    callback(null, true)
  })
}

var storeFile = function (filePath, src, callback) {
  mkdirp(path.dirname(filePath), function (err) {
    if (err) return callback(err)
    fs.writeFile(filePath, src, {
      encoding: 'utf8'
    }, callback)
  })
}

module.exports = function (conf) {
  var rulesetsDir = conf.rulesets_dir
  var onWarning = conf.onWarning || _.noop

  return util.promisify(function (rsInfo, callback) {
    var hash = rsInfo.hash
    var krlSrc = rsInfo.src

    var file = path.resolve(
      rulesetsDir,
      versionKey,
      hash.substr(0, 2),
      hash.substr(2, 2),
      hash + '.js'
    )
    fsExist(file, function (err, doesExist) {
      if (err) return callback(err)
      if (doesExist) {
        callback(null, require(file))
        return
      }
      var out
      try {
        out = compiler(krlSrc, {
          parser_options: {
            filename: rsInfo.filename
          },
          inline_source_map: true
        })
      } catch (err) {
        return callback(err)
      }
      storeFile(file, out.code, function (err) {
        if (err) return callback(err)
        var rs = require(file)
        _.each(out.warnings, function (warning) {
          onWarning(rs.rid, warning)
        })
        callback(null, rs)
      })
    })
  })
}
