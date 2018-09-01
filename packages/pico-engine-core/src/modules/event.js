var _ = require('lodash')
var ktypes = require('krl-stdlib/types')
var mkKRLfn = require('../mkKRLfn')
var mkKRLaction = require('../mkKRLaction')
var request = require('request')
var cleanEvent = require('../cleanEvent')

module.exports = function (core) {
  var fns = {
    attr: mkKRLfn([
      'name'
    ], function (ctx, args, callback) {
      callback(null, _.get(ctx, ['event', 'attrs', args.name], null))
    }),
    send: mkKRLaction([
      'event',
      'host'
    ], function (ctx, args, callback) {
      var event
      try {
        // validate + normalize event, and make sure is not mutated
        event = cleanEvent(args.event)
      } catch (err) {
        return callback(err)
      }
      if (args.host) {
        var url = args.host
        url += '/sky/event'
        url += '/' + event.eci
        url += '/' + event.eid
        url += '/' + event.domain
        url += '/' + event.type
        request({
          method: 'POST',
          url: url,
          headers: { 'content-type': 'application/json' },
          body: ktypes.encode(event.attrs)
        }, function (err, res, body) {
          if (err) {
            ctx.log('error', err + '')// TODO better handling
          }
          // ignore
        })
        callback()
        return
      }
      core.signalEvent(event)
      callback()
    })
  }
  return {
    def: fns,
    get: function (ctx, id, callback) {
      if (id === 'eid') {
        callback(null, _.get(ctx, ['event', 'eid']))
        return
      } else if (id === 'attrs') {
        // the user may mutate their copy
        var attrs = _.cloneDeep(ctx.event.attrs)
        callback(null, attrs)
        return
      }
      callback(new Error('Not defined `event:' + id + '`'))
    }
  }
}
