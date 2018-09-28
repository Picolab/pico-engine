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
  'schedule:list': async function (conf) {
    var db = getDB(conf)
    try {
      let list = await db.listScheduled()
      for (let s of list) {
        let str = s.id + ' '
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
      }
    } catch (err) {
      printErr(err)
    }
  },
  'schedule:remove': async function (conf, args) {
    var id = args._[1]
    if (!_.isString(id)) {
      console.error('Missing id')
      return
    }
    var db = getDB(conf)
    try {
      let list = id === 'all'
        ? await db.listScheduled()
        : [id]
      for (let s of list) {
        await db.removeScheduled(s.id)
        console.log('removed ' + id)
      }
    } catch (err) {
      printErr(err)
    }
  }
}
