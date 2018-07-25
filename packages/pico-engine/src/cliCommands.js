var _ = require('lodash')
var DB = require('pico-engine-core/src/DB')
var path = require('path')
var leveldown = require('leveldown')

var getDB = function (conf) {
  return DB({
    db: leveldown(path.join(conf.home, 'db'))
  })
}

var printErr = function (err) {
  console.error('' + err)
}

module.exports = {
  'conf': function (conf) {
    console.log(JSON.stringify(conf, void 0, 2))
  },
  'schedule:list': function (conf) {
    var db = getDB(conf)
    db.listScheduled(function (err, list) {
      if (err) return printErr(err)
      list.forEach(function (s) {
        var str = s.id + ' '
        if (s.at) {
          str += 'at ' + s.at
        }
        if (s.timespec) {
          str += 'repeat ' + s.timespec
        }
        str += ' ' + s.event.eci +
                  '/' + s.event.eid +
                  '/' + s.event.domain +
                  '/' + s.event.type +
                  ' ' + JSON.stringify(s.event.attrs)
        console.log(str)
      })
    })
  },
  'schedule:remove': function (conf, args) {
    var id = args._[1]
    if (!_.isString(id)) {
      console.error('Missing id')
      return
    }
    var db = getDB(conf)
    if (id === 'all') {
      db.listScheduled(function (err, list) {
        if (err) return printErr(err)
        list.forEach(function (s) {
          db.removeScheduled(s.id, function (err) {
            if (err) return printErr(err)
          })
        })
      })
      return
    }
    db.removeScheduled(id, function (err) {
      if (err) return printErr(err)
      console.log('removed ' + id)
    })
  }
}
