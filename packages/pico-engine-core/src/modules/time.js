var _ = require('lodash')
var moment = require('moment-timezone')
var ktypes = require('krl-stdlib/types')
var mkKRLfn = require('../mkKRLfn')
var strftime = require('strftime')

var newDate = function (dateStr, parseUtc) {
  var parse = function (str) {
    return parseUtc
      ? moment.utc(str, moment.ISO_8601)
      : moment(str, moment.ISO_8601)
  }
  var d = parse(dateStr)
  if (!d.isValid()) {
    var today = (new Date()).toISOString().split('T')[0]
    d = parse(today + 'T' + dateStr)
    if (!d.isValid()) {
      d = parse(today.replace(/-/g, '') + 'T' + dateStr)
    }
  }
  if (!d.isValid()) {
    return null // invalid date string dateStr
  }
  return d
}

module.exports = function (core) {
  return {
    def: {
      now: mkKRLfn([
        'opts'
      ], function (ctx, args) {
        var d = moment()
        if (_.has(args, 'opts')) {
          if (!ktypes.isMap(args.opts)) {
            throw new TypeError('time:now was given ' + ktypes.toString(args.opts) + ' instead of an opts map')
          }
          if (_.has(args.opts, 'tz')) {
            d.tz(args.opts.tz)
          }
        }
        return d.toISOString()
      }),
      'new': mkKRLfn([
        'date'
      ], function (ctx, args) {
        if (!_.has(args, 'date')) {
          throw new Error('time:new needs a date string')
        }

        var dateStr = ktypes.toString(args.date)
        var d = ktypes.isNumber(args.date) ? new Date(args.date) : newDate(dateStr, true)
        if (d === null) {
          if (ktypes.isString(args.date)) {
            throw new Error('time:new was given an invalid date string (' + dateStr + ')')
          }
          throw new TypeError('time:new was given ' + ktypes.toString(dateStr) + ' instead of a date string')
        }
        return d.toISOString()
      }),
      'add': mkKRLfn([
        'date',
        'spec'
      ], function (ctx, args) {
        if (!_.has(args, 'date')) {
          throw new Error('time:add needs a date string')
        }
        if (!_.has(args, 'spec')) {
          throw new Error('time:add needs a spec map')
        }

        var dateStr = ktypes.toString(args.date)
        var d = newDate(dateStr, true)
        if (d === null) {
          if (ktypes.isString(args.date)) {
            throw new Error('time:add was given an invalid date string (' + dateStr + ')')
          }
          throw new TypeError('time:add was given ' + ktypes.toString(dateStr) + ' instead of a date string')
        }

        if (!ktypes.isMap(args.spec)) {
          throw new TypeError('time:add was given ' + ktypes.toString(args.spec) + ' instead of a spec map')
        }

        d.add(args.spec)

        return d.toISOString()
      }),
      'strftime': mkKRLfn([
        'date',
        'fmt'
      ], function (ctx, args) {
        if (!_.has(args, 'date')) {
          throw new Error('time:strftime needs a date string')
        }
        if (!_.has(args, 'fmt')) {
          throw new Error('time:strftime needs a fmt string')
        }

        var dateStr = ktypes.toString(args.date)
        var d = newDate(dateStr)
        if (d === null) {
          if (ktypes.isString(args.date)) {
            throw new Error('time:strftime was given an invalid date string (' + dateStr + ')')
          }
          throw new TypeError('time:strftime was given ' + ktypes.toString(dateStr) + ' instead of a date string')
        }

        if (!ktypes.isString(args.fmt)) {
          throw new TypeError('time:strftime was given ' + ktypes.toString(args.fmt) + ' instead of a fmt string')
        }

        return strftime(args.fmt, d.toDate())
      })
    }
  }
}
