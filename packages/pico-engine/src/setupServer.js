var _ = require('lodash')
var path = require('path')
var express = require('express')
var bodyParser = require('body-parser')
var compiler = require('krl-compiler')
var version = require('../package.json').version
var oauthServer = require('./oauth_server')
var mime = require('mime-types')
var urllib = require('url')
var fs = require('fs')
var split = require('split')
var through2 = require('through2')

function mergeGetPost (req) {
  // give preference to post body params
  return _.assign({}, req.query, req.body, { _headers: req.headers })
}

module.exports = function (pe, conf) {
  var app = express()
  app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    next()
  })
  app.use(express.static(path.resolve(__dirname, '..', 'public')))
  app.use(bodyParser.json({ limit: '512mb', type: [ 'application/json', 'application/octet-stream', 'application/ssi-agent-wire' ] }))
  app.use(bodyParser.urlencoded({ limit: '512mb', type: 'application/x-www-form-urlencoded', extended: false }))

  app.use(function (req, res, next) { // needed by oauthServer
    req.pe = pe
    next()
  })
  app.use(function (req, res, next) { // root pico lookup of rewrites
    var result = /^(\/[A-Za-z0-9_.-]+)(\/.*)/.exec(req.url)
    if (!result) return (next())
    var fpc = result[1]
    if (fpc === '/sky' || fpc === '/api' ||
        fpc === '/authorize' || fpc === '/approve' || fpc === '/token' ||
        fpc === '/login' || fpc === '/new-account') {
      next()
    } else {
      console.log('[SEEK SHORTCUT] ' + fpc)
      pe.getRootECI().then(function (rootEci) {
        var query = {
          eci: rootEci,
          rid: 'io.picolabs.rewrite',
          name: 'getRewrite',
          args: { fpc: fpc }
        }
        return pe.runQuery(query)
      })
        .then(function (data) {
          if (data) {
            var eventOrQuery =
                            data.kind === 'event' ? '/sky/event/' : '/sky/cloud/'
            req.url = eventOrQuery + data.eci + fpc + result[2]
            console.log('[RE-WRITE] ' + req.url)
          } else {
            console.log('[NO DATA]')
          }
          next()
        })
        .catch(next)
    }
  })

  app.all('/sky/event/:eci/:eid/:domain/:type', function (req, res, next) {
    var event = {
      eci: req.params.eci,
      eid: req.params.eid,
      domain: req.params.domain,
      type: req.params.type,
      attrs: mergeGetPost(req)
    }
    pe.signalEvent(event).then(function (response) {
      if (response.directives) {
        var _res
        // some special cases
        _res = _.filter(response.directives, { name: '_cookie' })
        if (_res) {
          _.forEach(_res, function (v) {
            if (v.options && v.options.cookie) {
              res.append('Set-Cookie', v.options.cookie)
            }
          })
        }
        _res = _.find(response.directives, { name: '_txt' })
        if (_res && _res.options.content) {
          res.header('Content-Type', 'text/plain')
          return res.end(_res.options.content)
        }
        _res = _.find(response.directives, { name: '_html' })
        if (_res && _res.options.content) {
          res.header('Content-Type', 'text/html')
          return res.end(_res.options.content)
        }
        _res = _.find(response.directives, { name: '_gif' })
        if (_res && _res.options.content) {
          res.header('Content-Type', 'image/gif')
          var data = _res.options.content
          res.write(Buffer.from(Uint8Array.from(data)), 'binary')
          return res.end()
        }
        _res = _.find(response.directives, { name: '_redirect' })
        if (_res && _res.options.url) {
          return res.redirect(_res.options.url)
        }
      }
      res.json(response)
    })
      .catch(next)
  })

  app.all('/sky/cloud/:eci/:rid/:function', function (req, res, next) {
    var funcPart = req.params['function'].split('.')
    var respType = mime.contentType(funcPart[1])
    var query = {
      eci: req.params.eci,
      rid: req.params.rid,
      name: funcPart[0],
      args: mergeGetPost(req)
    }
    pe.runQuery(query).then(function (data) {
      if (_.isFunction(data)) {
        data(res)
      } else if (respType && funcPart[1] === 'gif') {
        res.header('Content-Type', respType)
        res.write(Buffer.from(Uint8Array.from(data)), 'binary')
        res.end()
      } else if (respType && funcPart[1] !== 'json') {
        res.header('Content-Type', respType)
        res.end(data)
      } else {
        res.json(data)
      }
    })
      .catch(next)
  })

  app.get('/authorize', oauthServer.authorize)

  app.post('/approve', oauthServer.approve)

  app.post('/token', oauthServer.token)

  app.post('/new-account', oauthServer.new_account)

  app.post('/login', oauthServer.login)

  app.all('/api/engine-version', function (req, res, next) {
    res.json({ 'version': version })
  })

  var toLegacyPVar = function (val) {
    var value = val && val.value
    if (!value && val) {
      if (val.type === 'Map') {
        value = {}
      } else if (val.type === 'Array') {
        value = []
      }
    }
    return value
  }

  app.all('/api/legacy-ui-data-dump', function (req, res, next) {
    (async function () {
      var dbData = {}
      function dumpRange (prefix) {
        return pe.dbRange({ prefix }, function (data) {
          _.set(dbData, data.key, data.value)
        })
      }
      await pe.dbRange({
        prefix: ['entvars']
      }, function (data) {
        const rid = data.key[2]
        if (rid === 'io.picolabs.subscription' ||
            rid === 'io.picolabs.visual_params' ||
            rid === 'io.picolabs.wrangler'
        ) {
          _.set(dbData, data.key, data.value)
        }
      })
      await dumpRange(['channel'])
      await dumpRange(['pico'])
      await dumpRange(['pico-children'])
      await dumpRange(['pico-ruleset'])
      await dumpRange(['policy'])

      _.each(dbData.entvars, function (byRid, picoId) {
        _.each(byRid, function (vars, rid) {
          _.each(vars, function (val, name) {
            _.set(dbData, ['pico', picoId, rid, 'vars', name], toLegacyPVar(val))
          })
        })
      })
      _.each(dbData['pico-children'], function (children, picoId) {
        _.set(dbData, [
          'pico',
          picoId,
          'io.picolabs.wrangler',
          'vars',
          'children'
        ], _.map(children, function (val, id) {
          return {
            id: id,
            eci: _.get(dbData, ['pico', id, 'admin_eci'])
          }
        }))
      })

      _.each(dbData.channel, function (chan, eci) {
        _.set(dbData, ['pico', chan.pico_id, 'channel', eci], chan)
        _.set(dbData, ['channel', eci, 'pico_id'], chan.pico_id)
        // keep it secret
        delete chan.sovrin.secret
      })
      _.each(dbData['pico-ruleset'], function (data, picoId) {
        _.each(data, function (val, rid) {
          _.set(dbData, ['pico', picoId, 'ruleset', rid], val)
        })
      })

      const enabledRIDs = await pe.dbRange({
        prefix: ['rulesets', 'enabled'],
        keys: true,
        values: false
      }, function (key) {
        return key[2]
      })

      res.json({
        channel: dbData.channel,
        pico: dbData.pico,
        policy: dbData.policy,
        enabledRIDs: enabledRIDs
      })
    }()).catch(next)
  })
  app.all('/api/legacy-ui-get-vars/:picoId/:rid', function (req, res, next) {
    const { picoId, rid } = req.params
    ;(async function () {
      var dbData = {}
      await pe.dbRange({
        prefix: ['appvars', rid]
      }, function (data) {
        _.set(dbData, data.key, data.value)
      })
      await pe.dbRange({
        prefix: ['entvars', picoId, rid]
      }, function (data) {
        _.set(dbData, data.key, data.value)
      })
      const result = []
      _.each(_.get(dbData, ['appvars', rid]), function (val, name) {
        result.push({ kind: 'app', name, val: toLegacyPVar(val) })
      })
      _.each(_.get(dbData, ['entvars', picoId, rid]), function (val, name) {
        result.push({ kind: 'ent', name, val: toLegacyPVar(val) })
      })
      res.json(result)
    }()).catch(next)
  })

  app.all('/api/root-eci', function (req, res, next) {
    pe.getRootECI().then(function (rootEci) {
      res.json({ ok: true, eci: rootEci })
    })
      .catch(next)
  })

  app.all('/api/pico/:id/rm-channel/:eci', function (req, res, next) {
    pe.removeChannel(req.params.eci).then(function () {
      res.json({ ok: true })
    })
      .catch(next)
  })

  app.all('/api/pico/:id/rm-ruleset/:rid', function (req, res, next) {
    pe.uninstallRuleset(req.params.id, req.params.rid).then(function () {
      res.json({ ok: true })
    })
      .catch(next)
  })

  app.all('/api/pico/:id/rm-ent-var/:rid/:var_name', function (req, res, next) {
    pe.delEntVar(req.params.id, req.params.rid, req.params.var_name).then(function () {
      res.json({ ok: true })
    })
      .catch(next)
  })

  app.all('/api/pico/:id/logs', function (req, res, next) {
    var picoId = req.params.id
    res.setHeader('Content-Type', 'application/json')
    res.write('[')
    fs.createReadStream(conf.log_path)
      .pipe(split())
      .pipe(through2(function (chunk, enc, callback) {
        const line = chunk.toString()
        if (line.indexOf(picoId) < 0) {
          // not my pico
          return callback()
        }
        let entry
        try {
          entry = JSON.parse(line)
        } catch (err) {
        }
        if (!entry || !entry.context || entry.context.pico_id !== picoId) {
          // not my pico
          return callback()
        }
        const time = (new Date(entry.time)).getTime()
        if ((Date.now() - time) > 1000 * 60 * 60 * 12) {
          // too old
          return callback()
        }

        // keep
        res.write(JSON.stringify({
          time: entry.time,
          krl_level: entry.krl_level,
          txn_id: entry.context.txn_id,
          msg: entry.msg
        }) + ',')
        callback()
      }))
      .on('finish', () => {
        // so we don't have a dangling `,`
        res.end('null]')
      })
      .on('error', err => {
        res.end(err + '')
      })
  })

  app.all('/api/ruleset/compile', function (req, res, next) {
    var args = mergeGetPost(req)

    try {
      res.json({ ok: true, code: compiler(args.src).code })
    } catch (err) {
      res.status(400).json({ error: err.toString() })
    }
  })

  app.all('/api/ruleset/register', function (req, res, next) {
    var args = mergeGetPost(req)

    var onRegister = function (data) {
      res.json({ ok: true, rid: data.rid, hash: data.hash })
    }
    if (_.isString(args.src)) {
      pe.registerRuleset(args.src, {})
        .then(onRegister)
        .catch(next)
    } else if (_.isString(args.url)) {
      pe.registerRulesetURL(args.url)
        .then(onRegister)
        .catch(next)
    } else {
      next(new Error('expected `src` or `url`'))
    }
  })

  app.all('/api/ruleset/flush/:rid', function (req, res, next) {
    pe.flushRuleset(req.params.rid).then(function (data) {
      console.log('Ruleset successfully flushed: ' + data.rid)
      res.json({ ok: true, rid: data.rid, hash: data.hash })
    })
      .catch(next)
  })

  app.all('/api/ruleset/unregister/:rid', function (req, res, next) {
    pe.unregisterRuleset(req.params.rid).then(function () {
      res.json({ ok: true })
    })
      .catch(next)
  })

  app.all('/api/ruleset-page', function (req, res, next) {
    (async function () {
      var data = {
        version: version,
        r: {}
      }

      const dbData = {}
      await pe.dbRange({
        prefix: ['rulesets']
      }, function (data) {
        _.set(dbData, data.key, data.value)
      })

      _.each(_.get(dbData, ['rulesets', 'versions']), function (versions, rid) {
        _.each(versions, function (hashes, date) {
          _.each(hashes, function (val, hash) {
            var rs = _.get(dbData, ['rulesets', 'krl', hash])
            _.set(data, ['r', rid, 'by_hash', hash], rs)
            if (hash === _.get(dbData, ['rulesets', 'enabled', rid, 'hash'])) {
              _.set(data, ['r', rid, 'enabled_hash'], hash)
            }
          })
        })

        var latestHash = _.get(_.head(
          _(versions)
            .map(function (hashes, date) {
              return { date: new Date(date), hash: _.head(_.keys(hashes)) }
            })
            .sortBy('date')
            .reverse()
            .value()
        ), 'hash')

        _.set(data, ['r', rid, 'rid'], rid)
        _.set(data, ['r', rid, 'latest_hash'], latestHash)

        // TODO based off pe.start(system_rulesets)
        // _.set(data, ['r', rid, 'is_system_ruleset'], /^io\.picolabs/.test(rid))
        var isSystemRuleset = false
        if ( // files in `krl` folder
          rid === 'io.picolabs.account_management' ||
          rid === 'io.picolabs.collection' ||
          rid === 'io.picolabs.cookies' ||
          rid === 'io.picolabs.did_auth_only' ||
          rid === 'io.picolabs.did_simulation' ||
          rid === 'io.picolabs.ds' ||
          rid === 'io.picolabs.logging' ||
          rid === 'io.picolabs.null_owner' ||
          rid === 'io.picolabs.oauth_server' ||
          rid === 'io.picolabs.owner_authentication' ||
          rid === 'io.picolabs.policy' ||
          rid === 'io.picolabs.rewrite' ||
          rid === 'io.picolabs.subscription' ||
          rid === 'io.picolabs.test' ||
          rid === 'io.picolabs.use_honeypot' ||
          rid === 'io.picolabs.visual_params' ||
          rid === 'io.picolabs.wrangler' ||
          rid === 'io.picolabs.wrangler.profile' ||
          false
        ) {
          isSystemRuleset = true
        }
        _.set(data, ['r', rid, 'is_system_ruleset'], isSystemRuleset)
      })

      data.ruleset_list = _(data.r)
        .groupBy(function (rs) {
          return rs.is_system_ruleset
            ? 'sys'
            : 'usr'
        })
        .mapValues(function (list) {
          return _.sortBy(_.map(list, function (rs) {
            return {
              rid: rs.rid,
              not_enabled: !_.isString(rs.enabled_hash)
            }
          }), 'rid')
        })
        .value()

      data.ok = true
      res.json(data)
    }()).catch(next)
  })

  app.use(function (err, req, res, next) {
    var code = 500
    if (err.picoCore_pico_movedToHost) {
      var newHostURL = urllib.resolve(err.picoCore_pico_movedToHost, req.url)
      res.redirect(302, newHostURL)
      return
    } else if (err.picoCore_pico_isLeaving) {
      code = 410
    }
    if (_.isNumber(err.statusCode)) {
      code = err.statusCode
    } else if (err && err.notFound) {
      code = 404
    }
    res.status(code).json({ error: err.message })
  })

  return app
}
