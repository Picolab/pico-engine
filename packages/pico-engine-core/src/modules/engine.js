let _ = require('lodash')
let bs58 = require('bs58')
let urllib = require('url')
let ktypes = require('krl-stdlib/types')
let krlParser = require('krl-parser')
let mkKRLfn = require('../mkKRLfn')
let sovrinDID = require('sovrin-did')
let mkKRLaction = require('../mkKRLaction')
let ADMIN_POLICY_ID = require('../DB').ADMIN_POLICY_ID

let assertArg = function (fnName, args, key, type) {
  if (!_.has(args, key)) {
    throw new Error('engine:' + fnName + ' argument `' + key + '` ' + type + ' is required')
  }
  if (ktypes.typeOf(args[key]) !== type) {
    throw new TypeError('engine:' + fnName + ' argument `' + key + '` should be ' + type + ' but was ' + ktypes.typeOf(args[key]))
  }
  return args[key]
}

let picoArgOrCtxPico = function (fnName, ctx, args, key) {
  key = key || 'pico_id'
  let picoId = _.has(args, key) ? args[key] : ctx.pico_id
  if (!ktypes.isString(picoId)) {
    throw new TypeError('engine:' + fnName + ' was given ' + ktypes.toString(args.eci) + ' instead of a ' + key + ' string')
  }
  return picoId
}

module.exports = function (core) {
  let fns = {

    getPicoIDByECI: mkKRLfn([
      'eci'
    ], async function (ctx, args) {
      if (!_.has(args, 'eci')) {
        throw new Error('engine:getPicoIDByECI needs an eci string')
      }
      if (!ktypes.isString(args.eci)) {
        throw new TypeError('engine:getPicoIDByECI was given ' + ktypes.toString(args.eci) + ' instead of an eci string')
      }

      let pico
      try {
        pico = await core.db.getPicoIDByECI(args.eci)
      } catch (err) {
        if (err && err.notFound) return
        throw err
      }
      return pico
    }),

    getParent: mkKRLfn([
      'pico_id'
    ], async function (ctx, args) {
      let picoId = picoArgOrCtxPico('getParent', ctx, args)
      try {
        picoId = await core.db.assertPicoID(picoId)
        let parentId = await core.db.getParent(picoId)
        return parentId
      } catch (err) {
        if (err && err.notFound) return
        throw err
      }
    }),

    getAdminECI: mkKRLfn([
      'pico_id'
    ], async function (ctx, args) {
      let picoId = picoArgOrCtxPico('getAdminECI', ctx, args)
      try {
        picoId = await core.db.assertPicoID(picoId)
        let eci = await core.db.getAdminECI(picoId)
        return eci
      } catch (err) {
        if (err && err.notFound) return
        throw err
      }
    }),

    listChildren: mkKRLfn([
      'pico_id'
    ], async function (ctx, args) {
      let picoId = picoArgOrCtxPico('listChildren', ctx, args)
      try {
        picoId = await core.db.assertPicoID(picoId)
        let children = await core.db.listChildren(picoId)
        return children
      } catch (err) {
        if (err && err.notFound) return
        throw err
      }
    }),

    listPolicies: mkKRLfn([
    ], function (ctx, args) {
      return core.db.listPolicies()
    }),

    listChannels: mkKRLfn([
      'pico_id'
    ], async function (ctx, args) {
      let picoId = picoArgOrCtxPico('listChannels', ctx, args)
      try {
        picoId = await core.db.assertPicoID(picoId)
      } catch (err) {
        if (err && err.notFound) return
        throw err
      }
      return core.db.listChannels(picoId)
    }),

    listInstalledRIDs: mkKRLfn([
      'pico_id'
    ], async function (ctx, args) {
      let picoId = picoArgOrCtxPico('listInstalledRIDs', ctx, args)
      try {
        picoId = await core.db.assertPicoID(picoId)
        let ridSet = await core.db.ridsOnPico(picoId)
        return _.keys(ridSet)
      } catch (err) {
        if (err && err.notFound) return
        throw err
      }
    }),

    listAllEnabledRIDs: mkKRLfn([
    ], function (ctx, args) {
      return core.db.listAllEnabledRIDs()
    }),

    doesKRLParse: mkKRLfn([
      'src'
    ], async function (ctx, args) {
      let srcGiven = _.has(args, 'src')
      if (!srcGiven || !ktypes.isString(args.src)) {
        throw new TypeError('engine:doesKRLParse was given ' + ktypes.toString(args.src) + ' instead of a KRL source string')
      }
      try {
        let ast = krlParser(args.src, {})
        return { 'parsed': true, 'ast': ast }
      } catch (err) {
        return { 'parsed': false, 'errorLoc': err.where }
      }
    }),

    describeRuleset: mkKRLfn([
      'rid'
    ], async function (ctx, args) {
      if (!_.has(args, 'rid')) {
        throw new Error('engine:describeRuleset needs a rid string')
      }
      if (!ktypes.isString(args.rid)) {
        throw new TypeError('engine:describeRuleset was given ' + ktypes.toString(args.rid) + ' instead of a rid string')
      }
      let data = await core.db.getEnabledRuleset(args.rid)
      if (!data) {
        return
      }
      let rid = data.rid
      return {
        rid: rid,
        src: data.src,
        hash: data.hash,
        url: data.url,
        timestamp_stored: data.timestamp_stored,
        timestamp_enable: data.timestamp_enable,
        meta: {
          name: _.get(core.rsreg.get(rid), ['meta', 'name']),
          description: _.get(core.rsreg.get(rid), ['meta', 'description']),
          author: _.get(core.rsreg.get(rid), ['meta', 'author'])
        }
      }
    }),

    newPico: mkKRLaction([
      'parent_id'
    ], async function (ctx, args) {
      let parentId = picoArgOrCtxPico('newPico', ctx, args, 'parent_id')

      parentId = await core.db.assertPicoID(parentId)

      return core.db.newPico({
        parent_id: parentId
      })
    }),

    removePico: mkKRLaction([
      'pico_id'
    ], async function (ctx, args) {
      let picoId = picoArgOrCtxPico('removePico', ctx, args)

      try {
        picoId = await core.db.assertPicoID(picoId)
      } catch (err) {
        if (err && err.notFound) return false
        throw err
      }

      let children = await core.db.listChildren(picoId)
      if (_.size(children) > 0) {
        throw new Error('Cannot remove pico "' + picoId + '" because it has ' + _.size(children) + ' children')
      }

      try {
        await core.db.removePico(picoId)
      } catch (err) {
        if (err && err.notFound) return false
        throw err
      }
      return true
    }),

    newPolicy: mkKRLaction([
      'policy'
    ], function (ctx, args) {
      return core.db.newPolicy(args.policy)
    }),

    removePolicy: mkKRLaction([
      'policy_id'
    ], async function (ctx, args) {
      let id = args.policy_id
      if (!_.isString(id)) {
        throw new TypeError('engine:removePolicy was given ' + ktypes.toString(id) + ' instead of a policy_id string')
      }
      try {
        await core.db.removePolicy(id)
        return true
      } catch (err) {
        if (err && err.notFound) return false
        throw err
      }
    }),

    newChannel: mkKRLaction([
      'pico_id',
      'name',
      'type',
      'policy_id'
    ], async function (ctx, args) {
      let picoId = picoArgOrCtxPico('newChannel', ctx, args)
      let policyId = ADMIN_POLICY_ID

      if (_.has(args, 'policy_id')) {
        if (!ktypes.isString(args.policy_id)) {
          throw new TypeError('engine:newChannel argument `policy_id` should be String but was ' + ktypes.typeOf(args.policy_id))
        }
        policyId = args.policy_id
      }

      if (!_.has(args, 'name')) {
        throw new Error('engine:newChannel needs a name string')
      }
      if (!_.has(args, 'type')) {
        throw new Error('engine:newChannel needs a type string')
      }

      picoId = await core.db.assertPicoID(picoId)

      policyId = await core.db.assertPolicyID(policyId)

      return core.db.newChannel({
        pico_id: picoId,
        name: ktypes.toString(args.name),
        type: ktypes.toString(args.type),
        policy_id: policyId
      })
    }),

    removeChannel: mkKRLaction([
      'eci'
    ], async function (ctx, args) {
      if (!_.has(args, 'eci')) {
        throw new Error('engine:removeChannel needs an eci string')
      }
      if (!ktypes.isString(args.eci)) {
        throw new TypeError('engine:removeChannel was given ' + ktypes.toString(args.eci) + ' instead of an eci string')
      }

      try {
        await core.db.removeChannel(args.eci)
        return true
      } catch (err) {
        if (err && err.notFound) return false
        throw err
      }
    }),

    registerRuleset: mkKRLaction([
      'url',
      'base'
    ], async function (ctx, args) {
      if (!_.has(args, 'url')) {
        throw new Error('engine:registerRuleset needs a url string')
      }
      if (!ktypes.isString(args.url)) {
        throw new TypeError('engine:registerRuleset was given ' + ktypes.toString(args.url) + ' instead of a url string')
      }

      let uri = ktypes.isString(args.base)
        ? urllib.resolve(args.base, args.url)
        : args.url
      let data = await core.registerRulesetURL(uri)
      return data.rid
    }),

    unregisterRuleset: mkKRLaction([
      'rid'
    ], async function (ctx, args) {
      if (!_.has(args, 'rid')) {
        throw new Error('engine:unregisterRuleset needs a rid string or array')
      }
      if (ktypes.isString(args.rid)) {
        await core.unregisterRuleset(args.rid)
        return
      }
      if (!ktypes.isArray(args.rid)) {
        throw new TypeError('engine:unregisterRuleset was given ' + ktypes.toString(args.rid) + ' instead of a rid string or array')
      }

      let rids = _.uniq(args.rid)

      for (let rid of rids) {
        if (!ktypes.isString(rid)) {
          throw new TypeError('engine:unregisterRuleset was given a rid array containing a non-string (' + ktypes.toString(rid) + ')')
        }
      }

      for (let rid of rids) {
        await core.unregisterRuleset(rid)
      }
    }),

    registerRulesetFromSrc: mkKRLaction([
      'src',
      'metaData'
    ], async function (ctx, args) {
      let srcGiven = _.has(args, 'src')
      let metaDataGiven = _.has(args, 'metaData')
      let meta = {}

      if (!srcGiven || !ktypes.isString(args.src)) {
        throw new TypeError('engine:registerRulesetFromSrc was given ' + ktypes.toString(args.src) + ' instead of a KRL source string')
      }

      if (metaDataGiven) {
        if (!ktypes.isMap(args.metaData)) {
          throw new TypeError('engine:registerRulesetFromSrc was given ' + ktypes.toString(args.meta) + ' instead of a Map for the metaData')
        }
        meta = args.metaData
      }
      let data = await core.registerRuleset(args.src, meta)
      return data
    }),

    installRuleset: mkKRLaction([
      'pico_id',
      'rid',
      'url',
      'base'
    ], async function (ctx, args) {
      let ridGiven = _.has(args, 'rid')
      if (!ridGiven && !_.has(args, 'url')) {
        throw new Error('engine:installRuleset needs either a rid string or array, or a url string')
      }

      let picoId = picoArgOrCtxPico('installRuleset', ctx, args)
      picoId = await core.db.assertPicoID(picoId)

      let install = function (rid) {
        return core.installRuleset(picoId, rid)
          .then(function () {
            return rid
          })
      }

      if (ridGiven) {
        let ridIsString = ktypes.isString(args.rid)
        if (!ridIsString && !ktypes.isArray(args.rid)) {
          throw new TypeError('engine:installRuleset was given ' + ktypes.toString(args.rid) + ' instead of a rid string or array')
        }
        if (ridIsString) {
          return install(args.rid)
        }

        let rids = _.uniq(args.rid)

        for (let rid of rids) {
          if (!ktypes.isString(rid)) {
            throw new TypeError('engine:installRuleset was given a rid array containing a non-string (' + ktypes.toString(rid) + ')')
          }
        }
        return Promise.all(_.map(rids, install))
      }

      if (!ktypes.isString(args.url)) {
        throw new TypeError('engine:installRuleset was given ' + ktypes.toString(args.url) + ' instead of a url string')
      }
      let uri = ktypes.isString(args.base)
        ? urllib.resolve(args.base, args.url)
        : args.url

      let results = await core.db.findRulesetsByURL(uri)
      let rids = _.uniq(_.map(results, 'rid'))
      if (_.size(rids) === 0) {
        let data = await core.registerRulesetURL(uri)
        return install(data.rid)
      }
      if (_.size(rids) !== 1) {
        throw new Error('More than one rid found for the given url: ' + rids.join(' , '))
      }
      return install(_.head(rids))
    }),

    uninstallRuleset: mkKRLaction([
      'pico_id',
      'rid'
    ], async function (ctx, args) {
      if (!_.has(args, 'rid')) {
        throw new Error('engine:uninstallRuleset needs a rid string or array')
      }

      let picoId = picoArgOrCtxPico('uninstallRuleset', ctx, args)
      picoId = await core.db.assertPicoID(picoId)

      let ridIsString = ktypes.isString(args.rid)
      if (!ridIsString && !ktypes.isArray(args.rid)) {
        throw new TypeError('engine:uninstallRuleset was given ' + ktypes.toString(args.rid) + ' instead of a rid string or array')
      }
      if (ridIsString) {
        await core.uninstallRuleset(picoId, args.rid)
        return
      }

      let rids = _.uniq(args.rid)
      for (let rid of rids) {
        if (!ktypes.isString(rid)) {
          throw new TypeError('engine:uninstallRuleset was given a rid array containing a non-string (' + ktypes.toString(rid) + ')')
        }
      }

      for (let rid of rids) {
        await core.uninstallRuleset(picoId, rid)
      }
    }),

    encryptChannelMessage: mkKRLfn([
      'eci',
      'message',
      'otherPublicKey'
    ], function (ctx, args) {
      let eci = assertArg('encryptChannelMessage', args, 'eci', 'String')
      let message = assertArg('encryptChannelMessage', args, 'message', 'String')
      let otherPublicKey = assertArg('encryptChannelMessage', args, 'otherPublicKey', 'String')

      return core.db.encryptChannelMessage(eci, message, otherPublicKey)
    }),

    decryptChannelMessage: mkKRLfn([
      'eci',
      'encryptedMessage',
      'nonce',
      'otherPublicKey'
    ], function (ctx, args) {
      let eci = assertArg('decryptChannelMessage', args, 'eci', 'String')
      let encryptedMessage = assertArg('decryptChannelMessage', args, 'encryptedMessage', 'String')
      let nonce = assertArg('decryptChannelMessage', args, 'nonce', 'String')
      let otherPublicKey = assertArg('decryptChannelMessage', args, 'otherPublicKey', 'String')

      return core.db.decryptChannelMessage(eci, encryptedMessage, nonce, otherPublicKey)
    }),

    signChannelMessage: mkKRLfn([
      'eci',
      'message'
    ], function (ctx, args) {
      let eci = assertArg('signChannelMessage', args, 'eci', 'String')
      let message = assertArg('signChannelMessage', args, 'message', 'String')

      return core.db.signChannelMessage(eci, message)
    }),

    verifySignedMessage: mkKRLfn([
      'verifyKey',
      'message'
    ], function (ctx, args) {
      let verifyKey = assertArg('verifySignedMessage', args, 'verifyKey', 'String')
      let message = assertArg('verifySignedMessage', args, 'message', 'String')

      try {
        message = bs58.decode(message)
        message = sovrinDID.verifySignedMessage(message, verifyKey)
        if (message === false) throw new Error('failed')
      } catch (e) {
        return false
      }

      return message
    }),

    exportPico: mkKRLfn([
      'pico_id'
    ], function (ctx, args) {
      let picoId = picoArgOrCtxPico('exportPico', ctx, args)

      return core.db.exportPico(picoId)
    }),

    importPico: mkKRLaction([
      'parent_id',
      'data'
    ], async function (ctx, args) {
      let parentId = picoArgOrCtxPico('importPico', ctx, args, 'parent_id')
      let data = args.data

      let newPicoID = await core.db.importPico(parentId, data)

      // initialize any newly imported rulesets
      await core.registerAllEnabledRulesets()

      return newPicoID
    }),

    setPicoStatus: mkKRLaction([
      'pico_id',
      'isLeaving',
      'movedToHost'
    ], async function (ctx, args) {
      let picoId = picoArgOrCtxPico('setPicoStatus', ctx, args)
      let isLeaving = args.isLeaving === true
      let movedToHost = ktypes.isString(args.movedToHost) ? args.movedToHost : null

      await core.db.setPicoStatus(picoId, isLeaving, movedToHost)

      return true
    }),

    getPicoStatus: mkKRLfn([
      'pico_id'
    ], function (ctx, args) {
      let picoId = picoArgOrCtxPico('setPicoStatus', ctx, args)

      return core.db.getPicoStatus(picoId)
    })

  }

  return {
    def: fns
  }
}
