let _ = require('lodash')
let DB = require('./DB')
let cuid = require('cuid')
let ktypes = require('krl-stdlib/types')
let runKRL = require('./runKRL')
let Modules = require('./modules')
let DepGraph = require('dependency-graph').DepGraph
let PicoQueue = require('./PicoQueue')
let Scheduler = require('./Scheduler')
let runAction = require('./runAction')
let cleanEvent = require('./cleanEvent')
let cleanQuery = require('./cleanQuery')
let krlStdlib = require('krl-stdlib')
let getKRLByURL = require('./getKRLByURL')
let SymbolTable = require('symbol-table')
let EventEmitter = require('events')
let processEvent = require('./processEvent')
let processQuery = require('./processQuery')
let ChannelPolicy = require('./ChannelPolicy')
let RulesetRegistry = require('./RulesetRegistry')
let normalizeKRLArgs = require('./normalizeKRLArgs')
let promiseCallback = require('./promiseCallback')
let krlCompiler = require('krl-compiler')
const sodium = require('libsodium-wrappers')

const rootKRLScope = SymbolTable()
_.each(krlStdlib, function (fn, fnName) {
  if (!_.isFunction(fn)) {
    return
  }
  rootKRLScope.set(fnName, function (ctx, args) {
    if (_.isArray(args)) {
      args = [ctx].concat(args)
    } else {
      args[0] = ctx
    }
    return Promise.resolve(fn.apply(void 0, args))
  })
})

function applyFn (fn, ctx, args) {
  if (ktypes.isAction(fn)) {
    if (ktypes.isFunction(fn.also_krlFn_of_this_action)) {
      return fn.also_krlFn_of_this_action(ctx, args)
    }
    throw new Error('actions can only be called in the rule action block')
  }
  if (!ktypes.isFunction(fn)) {
    throw new Error(ktypes.typeOf(fn) + ' is not a function')
  }
  return fn(ctx, args)
}

let logLevels = {
  'info': true,
  'debug': true,
  'warn': true,
  'error': true
}

function compileAndLoadRulesetInline (rsInfo) {
  let jsSrc = krlCompiler(rsInfo.src, {
    inline_source_map: true
  }).code
  return eval(jsSrc)// eslint-disable-line no-eval
}

module.exports = function (conf) {
  let db = DB(conf.db)
  let host = conf.host
  let rootRIDs = _.uniq(_.filter(conf.rootRIDs, _.isString))
  let compileAndLoadRuleset = conf.compileAndLoadRuleset || compileAndLoadRulesetInline

  let depGraph = new DepGraph()

  let core = {
    db: db,
    host: host,
    rsreg: RulesetRegistry()
  }

  let emitter = new EventEmitter()
  let modules = Modules(core, conf.modules)

  let mkCTX = function (ctx) {
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
    let pushCTXScope = function (ctx2) {
      return mkCTX(_.assign({}, ctx2, {
        rid: ctx.rid, // keep your original rid
        scope: ctx.scope.push()
      }))
    }
    ctx.mkFunction = function (paramOrder, fn) {
      let fixArgs = _.partial(normalizeKRLArgs, paramOrder)
      return function (ctx2, args) {
        return fn(pushCTXScope(ctx2), fixArgs(args))
      }
    }
    ctx.mkAction = function (paramOrder, fn) {
      let fixArgs = _.partial(normalizeKRLArgs, paramOrder)
      let actionFn = function (ctx2, args) {
        return fn(pushCTXScope(ctx2), fixArgs(args), runAction)
      }
      actionFn.is_an_action = true
      return actionFn
    }

    ctx.emit = function (type, val) {
      let info = {}
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

    // don't allow anyone to mutate ctx on the fly
    Object.freeze(ctx)
    return ctx
  }
  core.mkCTX = mkCTX

  async function initializeRulest (rs) {
    rs.scope = rootKRLScope.push()
    rs.modules_used = {}
    core.rsreg.setupOwnKeys(rs)

    for (let use of _.values(rs.meta && rs.meta.use)) {
      if (use.kind !== 'module') {
        throw new Error("Unsupported 'use' kind: " + use.kind)
      }
      let depRs = core.rsreg.get(use.rid)
      if (!depRs) {
        throw new Error('Dependant module not loaded: ' + use.rid)
      }
      let ctx2 = mkCTX({
        rid: depRs.rid,
        scope: rootKRLScope.push()
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
    let ctx = mkCTX({
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

  core.registerRuleset = async function (krlSrc, metaData) {
    let data = await db.storeRuleset(krlSrc, metaData)
    let rid = data.rid
    let hash = data.hash

    let rs = await compileAndLoadRuleset({
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
      await db.enableRuleset(hash)
      await initializeRulest(rs)
    } catch (err) {
      core.rsreg.del(rs.rid)
      depGraph.removeNode(rs.rid)
      db.disableRuleset(rs.rid)// undo enable if failed
      throw err
    }

    // have dependants re-load the module they depend on
    await reInitDependants(rs.rid)

    return {
      rid: rs.rid,
      hash: hash
    }
  }

  async function reInitDependants (rid, done = []) {
    if (done.indexOf(rid) < 0) {
      done.push(rid)
    }
    const dependants = core.rsreg.getImmediateDependants(rid)
    for (const dRid of dependants) {
      if (done.indexOf(dRid) < 0) { // only run once
        await initializeRulest(core.rsreg.get(dRid))
        done.push(dRid)
      }
    }
    // after the first level is done, proceed onward
    for (const dRid of dependants) {
      await reInitDependants(dRid, done)
    }
  }

  let picoQ = PicoQueue(async function (picoId, type, data) {
    let status = await db.getPicoStatus(picoId)
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
      let event = data
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

  function picoTask (type, dataOrig, callback) {
    let data
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

    db.getChannelAndPolicy(data.eci).then(function (chann) {
      let picoId = chann.pico_id

      let emit = mkCTX({
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
    }, function (err) {
      emitter.emit('error', err)
      callback(err)
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

  core.registerAllEnabledRulesets = async function () {
    let rsByRid = {}

    //
    // load Rulesets and track dependencies
    //
    let rids = await db.listAllEnabledRIDs()
    for (let rid of rids) {
      let data = await db.getEnabledRuleset(rid)
      let rs
      try {
        rs = await compileAndLoadRuleset({
          rid: rid,
          src: data.src,
          hash: data.hash
        })
      } catch (err) {
        // Emit an error and don't halt the engine
        let err2 = new Error('Failed to compile ' + rid + "! It is now disabled. You'll need to edit and re-register it.\nCause: " + err)
        err2.orig_error = err
        emitter.emit('error', err2, { rid: rid })
        // disable the ruleset since it's broken
        await db.disableRuleset(rid)
        continue
      }
      rsByRid[rs.rid] = rs
      depGraph.addNode(rs.rid)
    }

    //
    // initialize Rulesets according to dependency order
    //
    _.each(rsByRid, function (rs) {
      _.each(rs.meta && rs.meta.use, function (use) {
        if (use.kind === 'module') {
          depGraph.addDependency(rs.rid, use.rid)
        }
      })
    })
    function getRidOrder () {
      try {
        return depGraph.overallOrder()
      } catch (err) {
        let m = /Dependency Cycle Found: (.*)$/.exec(err + '')
        if (!m) {
          throw err
        }
        let cycleRids = _.uniq(m[1].split(' -> '))
        _.each(cycleRids, function (rid) {
          // remove the rids from the graph and disable it
          depGraph.removeNode(rid)
          db.disableRuleset(rid)

          // Let the user know the rid was disabled
          let err2 = new Error('Failed to initialize ' + rid + ", it's in a dependency cycle. It is now disabled. You'll need to resolve the cycle then re-register it.\nCause: " + err)
          err2.orig_error = err
          emitter.emit('error', err2, { rid: rid })
        })
        return getRidOrder()
      }
    }
    // order they need to be loaded for dependencies to work
    let ridOrder = getRidOrder()

    for (let rid of ridOrder) {
      let rs = rsByRid[rid]
      try {
        await initializeRulest(rs)
      } catch (err) {
        // Emit an error and don't halt the engine
        let err2 = new Error('Failed to initialize ' + rid + "! It is now disabled. You'll need to edit and re-register it.\nCause: " + err)
        err2.orig_error = err
        emitter.emit('error', err2, { rid: rid })
        // disable the ruleset since it's broken
        depGraph.removeNode(rid)
        await db.disableRuleset(rid)
        continue
      }
    }
  }

  core.unregisterRuleset = async function (rid) {
    // first assert rid is not depended on as a module
    core.rsreg.assertNoDependants(rid)

    let isUsed = await db.isRulesetUsed(rid)
    if (isUsed) {
      throw new Error('Unable to unregister "' + rid + '": it is installed on at least one pico')
    }
    await db.deleteRuleset(rid)

    core.rsreg.del(rid)
  }

  core.scheduler = Scheduler({
    db: db,
    onError: function (err) {
      let info = { scheduler: true }
      emitter.emit('error', err, info)
    },
    onEvent: function (event) {
      core.signalEvent(event)
    },
    is_test_mode: !!conf.___core_testing_mode
  })

  core.registerRulesetURL = async function (url) {
    let src = await getKRLByURL(url)
    return core.registerRuleset(src, { url: url })
  }
  core.flushRuleset = async function (rid) {
    let rsData = await db.getEnabledRuleset(rid)
    let url = rsData.url
    if (!_.isString(url)) {
      throw new Error('cannot flush a locally registered ruleset')
    }
    return core.registerRulesetURL(url)
  }
  core.installRuleset = async function (picoId, rid) {
    picoId = await db.assertPicoID(picoId)

    let has = await db.hasEnabledRid(rid)
    if (!has) throw new Error('This rid is not found and/or enabled: ' + rid)

    return db.addRulesetToPico(picoId, rid)
  }

  core.uninstallRuleset = async function (picoId, rid) {
    picoId = await db.assertPicoID(picoId)
    await db.removeRulesetFromPico(picoId, rid)
  }

  let pe = {
    emitter: emitter,

    signalEvent: core.signalEvent,
    runQuery: core.runQuery,

    getRootECI: function () {
      return db.getRootPico()
        .then(function (rootPico) {
          return rootPico.admin_eci
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

    delEntVar: db.delEntVar,

    dbRange: db.forRange // for legacy-ui api routes
    // ^^^ deprecated ^^^
    /// //////////////////
  }
  if (conf.___core_testing_mode) {
    pe.newPico = db.newPico
    pe.newPolicy = db.newPolicy
    pe.newChannel = db.newChannel
    pe.scheduleEventAt = db.scheduleEventAt
    pe.scheduler = core.scheduler
    pe.modules = modules
    pe.dbDump = db.toObj
  }

  pe.start = async function (systemRulesets) {
    systemRulesets = systemRulesets || []

    await sodium.ready

    await db.checkAndRunMigrations()

    // compile+store+enable systemRulesets first
    for (let systemRuleset of systemRulesets) {
      let src = systemRuleset.src
      let data = await db.storeRuleset(src, systemRuleset.meta)
      await compileAndLoadRuleset({
        rid: data.rid,
        src: src,
        hash: data.hash
      })
      await db.enableRuleset(data.hash)
    }

    // wake up the rulesets from the db
    await core.registerAllEnabledRulesets()

    // install rootRIDs on the root pico
    if (!_.isEmpty(rootRIDs)) {
      let rootPico
      try {
        rootPico = await db.getRootPico()
      } catch (err) {
        if (err && err.notFound) {
          // create the root pico
          await db.newPico({})
          rootPico = await db.getRootPico()
        } else {
          throw err
        }
      }
      let rids = db.ridsOnPico(rootPico.id)
      let toInstall = []
      _.each(rootRIDs, function (rid) {
        if (!_.includes(rids, rid)) {
          toInstall.push(rid)
        }
      })
      for (let rid of toInstall) {
        await core.installRuleset(rootPico.id, rid)
      }
    }

    // resumeScheduler
    let vals = await db.listScheduled()

    // resume the cron jobs
    _.each(vals, function (val) {
      if (!_.isString(val.timespec)) {
        return
      }
      core.scheduler.addCron(val.timespec, val.id, val.event)
    })

    // resume `schedule .. at` queue
    core.scheduler.update()
  }

  return pe
}
