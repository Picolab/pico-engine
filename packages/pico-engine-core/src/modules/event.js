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
    ], function (ctx, args) {
      return _.get(ctx, ['event', 'attrs', args.name], null)
    }),
    send: mkKRLaction([
      'event',
      'host'
    ], function (ctx, args) {
      // validate + normalize event, and make sure is not mutated
      let event = cleanEvent(args.event)
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
        return
      }
      core.signalEvent(event)
      // don't return the promise b/c it's fire-n-move on
    })
  }
  return {
    def: fns,
    get: function (ctx, id) {
      if (id === 'eid') {
        return _.get(ctx, ['event', 'eid'])
      } else if (id === 'attrs') {
        // the user may mutate their copy
        var attrs = _.cloneDeep(ctx.event.attrs)
        return attrs
      }
      throw new Error('Not defined `event:' + id + '`')
    }
  }
}
