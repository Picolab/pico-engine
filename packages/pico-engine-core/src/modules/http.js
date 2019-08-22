let _ = require('lodash')
let ktypes = require('krl-stdlib/types')
let request = require('request')
let cleanEvent = require('../cleanEvent')
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

async function httpBase (method, ctx, args) {
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
  if (args.dontFollowRedirect) {
    opts.followRedirect = false
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
  return r
}

function mkMethod (core, method, canAlsoBeUsedAsAFunction) {
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
    'autoraise',
    'autosend',
    'dontFollowRedirect'
  ], async function (ctx, args) {
    if (!_.has(args, 'url')) {
      throw new Error('http:' + method.toLowerCase() + ' needs a url string')
    }
    if (!ktypes.isString(args.url)) {
      throw new TypeError('http:' + method.toLowerCase() + ' was given ' + ktypes.toString(args.url) + ' instead of a url string')
    }

    if (_.has(args, 'autosend')) {
      const event = cleanEvent(args.autosend)
      httpBase(method, ctx, args)
        .then(r => {
          core.signalEvent(Object.assign({}, event, {
            attrs: Object.assign({}, event.attrs, r)
          }))
        })
        .catch(err => {
          ctx.log('error', err + '')// TODO better handling
        })
      return
    }

    const r = await httpBase(method, ctx, args)

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
      get: mkMethod(core, 'GET', true),
      head: mkMethod(core, 'HEAD', true),

      post: mkMethod(core, 'POST'),
      put: mkMethod(core, 'PUT'),
      patch: mkMethod(core, 'PATCH'),
      'delete': mkMethod(core, 'DELETE')
    }
  }
}
