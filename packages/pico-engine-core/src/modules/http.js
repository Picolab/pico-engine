let _ = require('lodash')
let ktypes = require('krl-stdlib/types')
let request = require('request')
let mkKRLaction = require('../mkKRLaction')

function ensureMap (arg, defaultTo) {
  return ktypes.isMap(arg)
    ? arg
    : defaultTo
}

function requestP (opts) {
  return new Promise(function (resolve, reject) {
    request(opts, function (err, res) {
      if (err) reject(err)
      else resolve(res)
    })
  })
}

let mkMethod = function (method, canAlsoBeUsedAsAFunction) {
  return mkKRLaction([
    // NOTE: order is significant so it's a breaking API change to change argument ordering
    'url',
    'qs',
    'headers',
    'body',
    'auth',
    'json',
    'form',
    'parseJSON',
    'autoraise'
  ], async function (ctx, args) {
    if (!_.has(args, 'url')) {
      throw new Error('http:' + method.toLowerCase() + ' needs a url string')
    }
    if (!ktypes.isString(args.url)) {
      throw new TypeError('http:' + method.toLowerCase() + ' was given ' + ktypes.toString(args.url) + ' instead of a url string')
    }

    let opts = {
      method: method,
      url: args.url,
      qs: ensureMap(args.qs, {}),
      headers: ensureMap(args.headers, {}),
      auth: ensureMap(args.auth)
    }

    if (_.has(args, 'body')) {
      opts.body = ktypes.toString(args.body)
    } else if (_.has(args, 'json')) {
      opts.body = ktypes.encode(args.json)
      if (!_.has(opts.headers, 'content-type')) {
        opts.headers['content-type'] = 'application/json'
      }
    } else if (_.has(args, 'form')) {
      opts.form = ensureMap(args.form)
    }

    let res = await requestP(opts)

    let r = {
      content: res.body,
      content_type: res.headers['content-type'],
      content_length: _.parseInt(res.headers['content-length'], 0) || 0,
      headers: res.headers,
      status_code: res.statusCode,
      status_line: res.statusMessage
    }
    if (args.parseJSON === true) {
      try {
        r.content = JSON.parse(r.content)
      } catch (e) {
        // just leave the content as is
      }
    }
    if (_.has(args, 'autoraise')) {
      r.label = ktypes.toString(args.autoraise)
      return ctx.raiseEvent({
        domain: 'http',
        type: method.toLowerCase(),
        attributes: r
        // for_rid: "",
      })
    } else {
      return r
    }
  }, canAlsoBeUsedAsAFunction)
}

module.exports = function (core) {
  return {
    def: {
      get: mkMethod('GET', true),
      head: mkMethod('HEAD', true),

      post: mkMethod('POST'),
      put: mkMethod('PUT'),
      patch: mkMethod('PATCH'),
      'delete': mkMethod('DELETE')
    }
  }
}
