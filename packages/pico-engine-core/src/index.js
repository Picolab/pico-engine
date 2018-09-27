var _ = require('lodash')
var DB = require('./DB')
var util = require('util')
var cuid = require('cuid')
var async = require('async')
var ktypes = require('krl-stdlib/types')
var runKRL = require('./runKRL')
var Modules = require('./modules')
var DepGraph = require('dependency-graph').DepGraph
var PicoQueue = require('./PicoQueue')
var Scheduler = require('./Scheduler')
var runAction = require('./runAction')
var cleanEvent = require('./cleanEvent')
var cleanQuery = require('./cleanQuery')
var krlStdlib = require('krl-stdlib')
var getKRLByURL = require('./getKRLByURL')
var SymbolTable = require('symbol-table')
var EventEmitter = require('events')
var processEvent = require('./processEvent')
var processQuery = require('./processQuery')
var ChannelPolicy = require('./ChannelPolicy')
var RulesetRegistry = require('./RulesetRegistry')
var normalizeKRLArgs = require('./normalizeKRLArgs')
var promiseCallback = require('./promiseCallback')
var krlCompiler = require('krl-compiler')

var applyFn = function (fn, ctx, args) {
  if (ktypes.isAction(fn)) {
    if (ktypes.isFunction(fn.also_krlFn_of_this_action)) {
      return fn.also_krlFn_of_this_action(ctx, args)
    }
    throw new Error('actions can only be called in the rule action block')
  }
  if (!ktypes.isFunction(fn)) {
    throw new Error('Not a function')
  }
  return fn(ctx, args)
}

var logLevels = {
  'info': true,
  'debug': true,
  'warn': true,
  'error': true
}

function compileAndLoadRulesetInline (rsInfo, callback) {
  var rs
  try {
    var jsSrc = krlCompiler(rsInfo.src, {
      inline_source_map: true
    }).code
    rs = eval(jsSrc)// eslint-disable-line no-eval
  } catch (err) {
    return callback(err)
  }
  callback(null, rs)
}

module.exports = function (conf) {
  var db = DB(conf.db)
  _.each(db, function (val, key) {
    if (_.isFunction(val)) {
      db[key + 'Yieldable'] = util.promisify(val)
    }
  })
  var host = conf.host
  var rootRIDs = _.uniq(_.filter(conf.rootRIDs, _.isString))
  var compileAndLoadRuleset = conf.compileAndLoadRuleset || compileAndLoadRulesetInline
  var compileAndLoadRulesetYieldable = util.promisify(compileAndLoadRuleset)

  var depGraph = new DepGraph()

  var core = {
    db: db,
    host: host,
    rsreg: RulesetRegistry()
  }

  var emitter = new EventEmitter()
  var modules = Modules(core, conf.modules)

  var mkCTX = function (ctx) {
    ctx.getMyKey = (function (rid) {
      // we do it this way so all the keys are not leaked out to other built in modules or rulesets
      return function (id) {
        return core.rsreg.getKey(rid, id)
      }
    }(ctx.rid))// pass in the rid at mkCTX creation so it is not later mutated

    if (ctx.event) {
      ctx.txn_id = ctx.event.txn_id
    }
    if (ctx.query) {
      ctx.txn_id = ctx.query.txn_id
    }

    ctx.modules = modules
    ctx.applyFn = applyFn
    var pushCTXScope = function (ctx2) {
      return mkCTX(_.assign({}, ctx2, {
        rid: ctx.rid, // keep your original rid
        scope: ctx.scope.push()
      }))
    }
    ctx.mkFunction = function (paramOrder, fn) {
      var fixArgs = _.partial(normalizeKRLArgs, paramOrder)
      return function (ctx2, args) {
        return fn(pushCTXScope(ctx2), fixArgs(args))
      }
    }
    ctx.mkAction = function (paramOrder, fn) {
      var fixArgs = _.partial(normalizeKRLArgs, paramOrder)
      var actionFn = function (ctx2, args) {
        return fn(pushCTXScope(ctx2), fixArgs(args), runAction)
      }
      actionFn.is_an_action = true
      return actionFn
    }

    ctx.emit = function (type, val) {
      var info = {}
      info.rid = ctx.rid
      info.txn_id = ctx.txn_id
      if (ctx.pico_id) {
        info.pico_id = ctx.pico_id
      }
      if (ctx.event) {
        info.event = {
          eci: ctx.event.eci,
          eid: ctx.event.eid,
          domain: ctx.event.domain,
          type: ctx.event.type,
          attrs: _.cloneDeep(ctx.event.attrs)
        }
        if (!info.eci) {
          info.eci = ctx.event.eci
        }
      }
      if (ctx.query) {
        info.query = {
          eci: ctx.query.eci,
          rid: ctx.query.rid,
          name: ctx.query.name,
          args: ctx.query.args
        }
        if (!info.rid) {
          info.rid = ctx.query.rid
        }
        if (!info.eci) {
          info.eci = ctx.query.eci
        }
      }
      // one reason `val` must come first is by convertion the "error"
      // event's first argument is the Error object. If `info` comes first
      // it will get confused thinking `info` is the error
      emitter.emit(type, val, info)
    }
    ctx.log = function (level, val) {
      if (!_.has(logLevels, level)) {
        throw new Error('Unsupported log level: ' + level)
      }
      // this 'log-' prefix distinguishes user declared log events from other system generated events
      ctx.emit('log-' + level, val)
    }
    ctx.callKRLstdlib = function (fnName, args) {
      if (_.isArray(args)) {
        args = [ctx].concat(args)
      } else {
        args[0] = ctx
      }
      var fn = krlStdlib[fnName]
      if (fn === void 0) {
        throw new Error('Not an operator: ' + fnName)
      }
      return Promise.resolve(fn.apply(void 0, args))
    }

    // don't allow anyone to mutate ctx on the fly
    Object.freeze(ctx)
    return ctx
  }
  core.mkCTX = mkCTX

  var initializeRulest = async function (rs) {
    rs.scope = SymbolTable()
    rs.modules_used = {}
    core.rsreg.setupOwnKeys(rs)

    var useArray = _.values(rs.meta && rs.meta.use)
    var i, use, depRs, ctx2
    for (i = 0; i < useArray.length; i++) {
      use = useArray[i]
      if (use.kind !== 'module') {
        throw new Error("Unsupported 'use' kind: " + use.kind)
      }
      depRs = core.rsreg.get(use.rid)
      if (!depRs) {
        throw new Error('Dependant module not loaded: ' + use.rid)
      }
      ctx2 = mkCTX({
        rid: depRs.rid,
        scope: SymbolTable()
      })
      if (_.isFunction(depRs.meta && depRs.meta.configure)) {
        await runKRL(depRs.meta.configure, ctx2)
      }
      if (_.isFunction(use['with'])) {
        await runKRL(use['with'], mkCTX({
          rid: rs.rid, // switch rid
          scope: ctx2.scope// must share scope
        }))
      }
      if (_.isFunction(depRs.global)) {
        await runKRL(depRs.global, ctx2)
      }
      rs.modules_used[use.alias] = {
        rid: use.rid,
        scope: ctx2.scope,
        provides: _.get(depRs, ['meta', 'provides'], [])
      }
      core.rsreg.provideKey(rs.rid, use.rid)
    }
    var ctx = mkCTX({
      rid: rs.rid,
      scope: rs.scope
    })
    if (_.isFunction(rs.meta && rs.meta.configure)) {
      await runKRL(rs.meta.configure, ctx)
    }
    core.rsreg.put(rs)
    if (_.isFunction(rs.global)) {
      await runKRL(rs.global, ctx)
    }
  }

  core.registerRuleset = function (krlSrc, metaData, callback) {
    callback = promiseCallback(callback)
    ;(async function () {
      var data = await db.storeRulesetYieldable(krlSrc, metaData)
      var rid = data.rid
      var hash = data.hash

      var rs = await compileAndLoadRulesetYieldable({
        rid: rid,
        src: krlSrc,
        hash: hash
      })

      if (depGraph.hasNode(rs.rid)) {
        // cleanup any left over dependencies with rid
        _.each(depGraph.dependenciesOf(rs.rid), function (rid) {
          depGraph.removeDependency(rs.rid, rid)
        })
      } else {
        depGraph.addNode(rs.rid)
      }

      try {
        _.each(rs.meta && rs.meta.use, function (use) {
          if (use.kind === 'module') {
            try {
              depGraph.addDependency(rs.rid, use.rid)
            } catch (e) {
              throw new Error('Dependant module not loaded: ' + use.rid)
            }
          }
        })

        // check for dependency cycles
        depGraph.overallOrder()// this will throw if there is a cycle

        // Now enable and initialize it
        await db.enableRulesetYieldable(hash)
        await initializeRulest(rs)
      } catch (err) {
        core.rsreg.del(rs.rid)
        depGraph.removeNode(rs.rid)
        db.disableRuleset(rs.rid, _.noop)// undo enable if failed
        throw err
      }

      return {
        rid: rs.rid,
        hash: hash
      }
    }())
      .then(function (data) {
        callback(null, data)
      })
      .catch(function (err) {
        process.nextTick(function () {
          // wrapping in nextTick resolves strange issues with UnhandledPromiseRejectionWarning
          // when infact we are handling the rejection
          callback(err)
        })
      })
    return callback.promise
  }

  var picoQ = PicoQueue(async function (picoId, type, data) {
    var status = await db.getPicoStatus(picoId)
    if (status.movedToHost) {
      let err = new Error('Pico moved to a new host')
      err.picoCore_pico_movedToHost = status.movedToHost
      throw err
    } else if (status.isLeaving) {
      let err = new Error('Pico is leaving this host')
      err.picoCore_pico_isLeaving = true
      throw err
    }

    // now handle the next task on the pico queue
    if (type === 'event') {
      var event = data
      event.timestamp = new Date(event.timestamp)// convert from JSON string to date
      return processEvent(core, mkCTX({
        event: event,
        pico_id: picoId
      }))
    } else if (type === 'query') {
      return processQuery(core, mkCTX({
        query: data,
        pico_id: picoId
      }))
    } else {
      throw new Error('invalid PicoQueue type:' + type)
    }
  })

  var picoTask = function (type, dataOrig, callback) {
    var data
    try {
      // validate + normalize event/query, and make sure is not mutated
      if (type === 'event') {
        data = cleanEvent(dataOrig)
        if (data.eid === 'none') {
          data.eid = cuid()
        }
      } else if (type === 'query') {
        data = cleanQuery(dataOrig)
      } else {
        throw new Error('invalid PicoQueue type:' + type)
      }
    } catch (err) {
      emitter.emit('error', err)
      callback(err)
      return
    }

    // events and queries have a txn_id and timestamp
    data.txn_id = cuid()
    data.timestamp = conf.___core_testing_mode && _.isDate(dataOrig.timestamp)
      ? dataOrig.timestamp
      : new Date()

    db.getChannelAndPolicy(data.eci, function (err, chann) {
      if (err) {
        emitter.emit('error', err)
        callback(err)
        return
      }

      var picoId = chann.pico_id

      var emit = mkCTX({
        pico_id: picoId,
        event: type === 'event' ? data : void 0,
        query: type === 'query' ? data : void 0
      }).emit

      emit('episode_start')
      if (type === 'event') {
        emit('debug', 'event received: ' + data.domain + '/' + data.type)
      } else if (type === 'query') {
        emit('debug', 'query received: ' + data.rid + '/' + data.name)
      }
      try {
        ChannelPolicy.assert(chann.policy, type, data)
      } catch (e) {
        onDone(e)
        return
      }

      picoQ.enqueue(picoId, type, data, onDone)

      emit('debug', type + ' added to pico queue: ' + picoId)

      function onDone (err, data) {
        if (err) {
          emit('error', err)
        } else {
          emit('debug', data)
        }
        // there should be no more emits after "episode_stop"
        emit('episode_stop')
        callback(err, data)
      }
    })
  }

  core.signalEvent = function (event, callback) {
    callback = promiseCallback(callback)
    picoTask('event', event, callback)
    return callback.promise
  }

  core.runQuery = function (query, callback) {
    callback = promiseCallback(callback)
    picoTask('query', query, callback)
    return callback.promise
  }

  core.registerAllEnabledRulesets = function (callback) {
    callback = promiseCallback(callback)
    var rsByRid = {}

    async.series([
      //
      // load Rulesets and track dependencies
      //
      function (nextStep) {
        var onRID = function (rid, next) {
          db.getEnabledRuleset(rid, function (err, data) {
            if (err) return next(err)
            compileAndLoadRuleset({
              rid: rid,
              src: data.src,
              hash: data.hash
            }, function (err, rs) {
              if (err) {
                // Emit an error and don't halt the engine
                var err2 = new Error('Failed to compile ' + rid + "! It is now disabled. You'll need to edit and re-register it.\nCause: " + err)
                err2.orig_error = err
                emitter.emit('error', err2, { rid: rid })
                // disable the ruleset since it's broken
                db.disableRuleset(rid, next)
                return
              }
              rsByRid[rs.rid] = rs
              depGraph.addNode(rs.rid)
              next()
            })
          })
        }
        db.listAllEnabledRIDs(function (err, rids) {
          if (err) return nextStep(err)
          async.each(rids, onRID, nextStep)
        })
      },

      //
      // initialize Rulesets according to dependency order
      //
      function (nextStep) {
        _.each(rsByRid, function (rs) {
          _.each(rs.meta && rs.meta.use, function (use) {
            if (use.kind === 'module') {
              depGraph.addDependency(rs.rid, use.rid)
            }
          })
        })
        var getRidOrder = function getRidOrder () {
          try {
            return depGraph.overallOrder()
          } catch (err) {
            var m = /Dependency Cycle Found: (.*)$/.exec(err + '')
            if (!m) {
              throw err
            }
            var cycleRids = _.uniq(m[1].split(' -> '))
            _.each(cycleRids, function (rid) {
              // remove the rids from the graph and disable it
              depGraph.removeNode(rid)
              db.disableRuleset(rid, _.noop)

              // Let the user know the rid was disabled
              var err2 = new Error('Failed to initialize ' + rid + ", it's in a dependency cycle. It is now disabled. You'll need to resolve the cycle then re-register it.\nCause: " + err)
              err2.orig_error = err
              emitter.emit('error', err2, { rid: rid })
            })
            return getRidOrder()
          }
        }
        // order they need to be loaded for dependencies to work
        var ridOrder = getRidOrder()

        async.eachSeries(ridOrder, function (rid, next) {
          var rs = rsByRid[rid]

          initializeRulest(rs).then(function () {
            next()
          }, function (err) {
            process.nextTick(function () {
              // wrapping in nextTick resolves strange issues with UnhandledPromiseRejectionWarning
              // when infact we are handling the rejection

              // Emit an error and don't halt the engine
              var err2 = new Error('Failed to initialize ' + rid + "! It is now disabled. You'll need to edit and re-register it.\nCause: " + err)
              err2.orig_error = err
              emitter.emit('error', err2, { rid: rid })
              // disable the ruleset since it's broken
              depGraph.removeNode(rid)
              db.disableRuleset(rid, next)
            })
          })
        }, nextStep)
      }
    ], callback)
    return callback.promise
  }

  core.unregisterRuleset = function (rid, callback) {
    // first assert rid is not depended on as a module
    try {
      core.rsreg.assertNoDependants(rid)
    } catch (err) {
      callback(err)
      return
    }
    db.isRulesetUsed(rid, function (err, isUsed) {
      if (err) return callback(err)
      if (isUsed) {
        callback(new Error('Unable to unregister "' + rid + '": it is installed on at least one pico'))
        return
      }
      db.deleteRuleset(rid, function (err) {
        if (err) return callback(err)

        core.rsreg.del(rid)

        callback()
      })
    })
  }

  core.scheduler = Scheduler({
    db: db,
    onError: function (err) {
      var info = { scheduler: true }
      emitter.emit('error', err, info)
    },
    onEvent: function (event) {
      core.signalEvent(event)
    },
    is_test_mode: !!conf.___core_testing_mode
  })

  core.registerRulesetURL = function (url, callback) {
    getKRLByURL(url, function (err, src) {
      if (err) return callback(err)
      core.registerRuleset(src, { url: url }, callback)
    })
  }
  core.flushRuleset = function (rid, callback) {
    db.getEnabledRuleset(rid, function (err, rsData) {
      if (err) return callback(err)
      var url = rsData.url
      if (!_.isString(url)) {
        callback(new Error('cannot flush a locally registered ruleset'))
        return
      }
      core.registerRulesetURL(url, callback)
    })
  }
  core.installRuleset = function (picoId, rid, callback) {
    callback = promiseCallback(callback)
    db.assertPicoID(picoId, function (err, picoId) {
      if (err) return callback(err)

      db.hasEnabledRid(rid, function (err, has) {
        if (err) return callback(err)
        if (!has) return callback(new Error('This rid is not found and/or enabled: ' + rid))

        db.addRulesetToPico(picoId, rid, callback)
      })
    })
    return callback.promise
  }

  core.uninstallRuleset = function (picoId, rid, callback) {
    db.assertPicoID(picoId, function (err, picoId) {
      if (err) return callback(err)

      db.removeRulesetFromPico(picoId, rid, callback)
    })
  }

  var resumeScheduler = function (callback) {
    db.listScheduled(function (err, vals) {
      if (err) return callback(err)

      // resume the cron jobs
      _.each(vals, function (val) {
        if (!_.isString(val.timespec)) {
          return
        }
        core.scheduler.addCron(val.timespec, val.id, val.event)
      })

      // resume `schedule .. at` queue
      core.scheduler.update()

      callback()
    })
  }

  var pe = {
    emitter: emitter,

    signalEvent: core.signalEvent,
    runQuery: core.runQuery,

    getRootECI: function (callback) {
      db.getRootPico(function (err, rootPico) {
        if (err) return callback(err)
        callback(null, rootPico.admin_eci)
      })
    },

    /// //////////////////
    // vvv deprecated vvv
    registerRuleset: core.registerRuleset,
    registerRulesetURL: core.registerRulesetURL,
    flushRuleset: core.flushRuleset,
    unregisterRuleset: core.unregisterRuleset,

    removeChannel: db.removeChannel,
    installRuleset: core.installRuleset,
    uninstallRuleset: core.uninstallRuleset,
    removePico: db.removePico,

    putEntVar: db.putEntVar,
    getEntVar: db.getEntVar,
    delEntVar: db.delEntVar,

    dbDump: db.toObj
    // ^^^ deprecated ^^^
    /// //////////////////
  }
  if (conf.___core_testing_mode) {
    pe.newPico = db.newPico
    pe.newPolicy = db.newPolicy
    pe.newChannel = db.newChannel
    pe.scheduleEventAtYieldable = db.scheduleEventAtYieldable
    pe.scheduler = core.scheduler
    pe.modules = modules
  }

  pe.start = function (systemRulesets, callback) {
    callback = promiseCallback(callback)
    async.series([
      db.checkAndRunMigrations,
      function (nextStep) {
        // compile+store+enable systemRulesets first
        async.each(systemRulesets, function (systemRuleset, next) {
          var krlSrc = systemRuleset.src
          var metaData = systemRuleset.meta
          db.storeRuleset(krlSrc, metaData, function (err, data) {
            if (err) return next(err)
            compileAndLoadRuleset({
              rid: data.rid,
              src: krlSrc,
              hash: data.hash
            }, function (err, rs) {
              if (err) return next(err)
              db.enableRuleset(data.hash, function (err) {
                next(err, { rs: rs, hash: data.hash })
              })
            })
          })
        }, nextStep)
      },
      function (next) {
        core.registerAllEnabledRulesets(next)
      },
      function (next) {
        if (_.isEmpty(rootRIDs)) {
          return next()
        }
        db.getRootPico(function (err, rootPico) {
          if (err && !err.notFound) {
            return next(err)
          } else if (!err) {
            return next()
          }
          db.newPico({}, next)
        })
      },
      function (next) {
        if (_.isEmpty(rootRIDs)) {
          return next()
        }
        db.getRootPico(function (err, rootPico) {
          if (err) return next(err)

          db.ridsOnPico(rootPico.id, function (err, rids) {
            if (err) return next(err)

            var toInstall = []
            _.each(rootRIDs, function (rid) {
              if (!_.includes(rids, rid)) {
                toInstall.push(rid)
              }
            })

            async.eachSeries(toInstall, function (rid, next) {
              core.installRuleset(rootPico.id, rid, next)
            }, next)
          })
        })
      },
      resumeScheduler
    ], callback)
    return callback.promise
  }

  return pe
}
