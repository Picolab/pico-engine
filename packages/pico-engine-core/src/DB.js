var _ = require('lodash')
var bs58 = require('bs58')
var cuid = require('cuid')
let util = require('util')
var async = require('async')
var crypto = require('crypto')
var encode = require('encoding-down')
var ktypes = require('krl-stdlib/types')
var dbRange = require('./dbRange')
var levelup = require('levelup')
var bytewise = require('bytewise')
var sovrinDID = require('sovrin-did')
var migrations = require('./migrations')
var ChannelPolicy = require('./ChannelPolicy')
var safeJsonCodec = require('level-json-coerce-null')
var extractRulesetID = require('./extractRulesetID')
var engineCoreVersion = require('../package.json').version
var promiseCallback = require('./promiseCallback')
const sodium = require('libsodium-wrappers')

// NOTE: for now we are going to default to an allow all policy
// This makes migrating easier while waiting for krl system rulesets to assume policy usage
var ADMIN_POLICY_ID = 'allow-all-policy'// NOTE: changing this requires a db migration

function omitChannelSecret (channel) {
  return _.assign({}, channel, {
    sovrin: _.omit(channel.sovrin, 'secret')
  })
}

// coerce the value into an array of key strings
function toKeyPath (path) {
  if (!ktypes.isArray(path)) {
    path = [path]
  }
  return _.map(path, function (key) {
    return ktypes.toString(key)
  })
}

async function discoverPVarLength (ldb, keyPrefix, ops) {
  ops = ops || {}
  let oldLength = 0
  await dbRange.promise(ldb, {
    prefix: keyPrefix.concat(['value']),
    values: false
  }, function (key) {
    const i = parseInt(key.slice(keyPrefix.length + 1)[0], 10)
    if (!_.isNaN(i)) {
      if (ops.excludeI === i) {
        return
      }
      oldLength = Math.max(oldLength, i + 1)
    }
  })
  return oldLength
}

async function putPVar (ldb, keyPrefix, query, val) {
  query = ktypes.isNull(query) ? [] : query
  query = ktypes.isArray(query) ? query : [query]
  // do this before toKeyPath b/c it will convert all parts to stings
  const isArrayIndex = _.isInteger(query[0]) && query[0] >= 0
  const path = toKeyPath(query)

  const oldRoot = (await ldb.getNF(keyPrefix)) || { type: 'Null', value: null }
  const dbOps = []

  if (_.size(path) > 0) {
    const subkeyPrefix = keyPrefix.concat(['value', path[0]])
    const subPath = _.tail(path)
    const root = {
      type: oldRoot.type
    }
    if (root.type !== 'Map' && root.type !== 'Array') {
      root.type = isArrayIndex ? 'Array' : 'Map'
    }
    if (root.type === 'Array' && !isArrayIndex) {
      root.type = 'Map'// convert to map if a non-index key comes in
    }

    // this `value` helps _.set in the toObj db dump set the right type
    root.value = root.type === 'Array' ? [] : {}

    if (root.type === 'Array') {
      let oldLength = oldRoot.length
      if (!_.isInteger(oldLength) || oldLength < 0) {
        oldLength = await discoverPVarLength(ldb, keyPrefix)
      }
      root.length = Math.max(oldLength, (parseInt(path[0], 10) || 0) + 1)
    }

    dbOps.push({ type: 'put', key: keyPrefix, value: root })

    if (_.isEmpty(subPath)) {
      dbOps.push({ type: 'put', key: subkeyPrefix, value: val })
    } else {
      let data = (await ldb.getNF(subkeyPrefix)) || {}
      data = _.set(data, subPath, val)
      dbOps.push({ type: 'put', key: subkeyPrefix, value: data })
    }
  } else {
    await dbRange.promise(ldb, {
      prefix: keyPrefix,
      values: false
    }, function (key) {
      dbOps.push({ type: 'del', key: key })
    })
    let root = {
      type: ktypes.typeOf(val)
    }
    switch (root.type) {
      case 'Null':
        root.value = null
        break
      case 'Function':
      case 'Action':
        root.type = 'String'
        root.value = ktypes.toString(val)
        break
      case 'Map':
      case 'Array':
        _.each(val, function (v, k) {
          k = ktypes.toString(k)// represent array i as strings, otherwise bytewise will create separate keys for int and string
          dbOps.push({
            type: 'put',
            key: keyPrefix.concat(['value', k]),
            value: v
          })
        })
        // this `value` helps _.set in the toObj db dump set the right type
        root.value = root.type === 'Array' ? [] : {}
        if (root.type === 'Array') {
          root.length = val.length
        }
        break
      default:
        root.value = val
    }
    dbOps.push({
      type: 'put',
      key: keyPrefix,
      value: root
    })
  }
  return filterNullOps(dbOps)
}

async function appendPVar (ldb, keyPrefix, values) {
  if (!_.isArray(values)) {
    throw new TypeError('appendPVar `values` must be an Array')
  }
  const oldRoot = (await ldb.getNF(keyPrefix)) || { type: 'Null', value: null }
  const dbOps = []
  let oldLength = 0

  switch (oldRoot.type) {
    case 'Array':
      oldLength = oldRoot.length
      if (!_.isInteger(oldLength) || oldLength < 0) {
        oldLength = await discoverPVarLength(ldb, keyPrefix)
      }
      break
    case 'Map':
      const mapValue = {}
      await dbRange.promise(ldb, {
        prefix: keyPrefix.concat(['value'])
      }, function (data) {
        dbOps.push({ type: 'del', key: data.key })
        const key = data.key.slice(keyPrefix.length + 1)[0]
        mapValue[key] = data.value
      })
      values = [mapValue].concat(values)
      break
    default:
      values = [oldRoot.value].concat(values)
      break
  }
  dbOps.push({
    type: 'put',
    key: keyPrefix,
    value: {
      type: 'Array',
      value: [],
      length: oldLength + values.length
    }
  })
  _.each(values, function (val, valI) {
    const i = ktypes.toString(oldLength + valI)// represent array i as strings, otherwise bytewise will create separate keys for int and string
    dbOps.push({
      type: 'put',
      key: keyPrefix.concat(['value', i]),
      value: val
    })
  })
  return filterNullOps(dbOps)
}

function filterNullOps (ops) {
  return ops.filter(function (op) {
    if (op.type === 'put') {
      if (ktypes.isNull(op.value)) {
        if (op.key[op.key.length - 2] === 'value') {
          return false
        }
      }
    }
    return true
  }).map(function (op) {
    if (ktypes.isMap(op.value)) {
      // remove nulls from nest Maps, so nested Maps behave the same ast top-level Maps
      op.value = _.pickBy(op.value, notKRLNull)
    }
    return op
  })
}

function notKRLNull (v) {
  return !ktypes.isNull(v)
}

const getPVar = util.promisify(function (ldb, keyPrefix, query, callback) {
  var path = ktypes.isNull(query) ? [] : toKeyPath(query)
  if (_.size(path) > 0) {
    var subKey = _.head(path)
    var subPath = _.tail(path)
    ldb.get(keyPrefix.concat(['value', subKey]), function (err, data) {
      if (err && err.notFound) {
        return callback()
      } else if (err) {
        return callback(err)
      }
      if (!_.isEmpty(subPath)) {
        data = _.get(data, subPath)
      }
      callback(null, data)
    })
    return
  }
  ldb.get(keyPrefix, function (err, data) {
    if (err && err.notFound) {
      return callback()
    } else if (err) {
      return callback(err)
    }
    if (data.type !== 'Map' && data.type !== 'Array') {
      return callback(null, data.value)
    }
    var value = data.type === 'Array' ? [] : {}
    if (data.type === 'Array') {
      value = []
      for (let i = 0; i < data.length; i++) {
        value.push(null)
      }
    }
    dbRange(ldb, {
      prefix: keyPrefix
    }, function (data) {
      if (data.key.length === (keyPrefix.length + 2)) {
        value[data.key[keyPrefix.length + 1]] = data.value
      }
    }, function (err) {
      callback(err, value)
    })
  })
})

async function delPVar (ldb, keyPrefix, query, callback) {
  const path = ktypes.isNull(query) ? [] : toKeyPath(query)

  const dbOps = []

  if (_.size(path) > 0) {
    const subkeyPrefix = keyPrefix.concat(['value', path[0]])
    const subPath = _.tail(path)

    let removedAKey = false
    if (_.isEmpty(subPath)) {
      dbOps.push({ type: 'del', key: subkeyPrefix })
      removedAKey = true
    } else {
      const data = (await ldb.getNF(subkeyPrefix)) || {}
      const val = _.omit(data, subPath)
      if (_.isEmpty(val)) {
        dbOps.push({ type: 'del', key: subkeyPrefix })
        removedAKey = true
      } else {
        dbOps.push({ type: 'put', key: subkeyPrefix, value: val })
      }
    }
    const removedI = parseInt(path[0], 10)
    if (removedAKey && _.isInteger(removedI) && removedI >= 0) {
      const oldRoot = (await ldb.getNF(keyPrefix)) || { type: 'Null', value: null }
      if (oldRoot.type === 'Array') {
        // the array may be sparce b/c delete is any arbitrary index
        // therefore we should re-scan the index everytime to find it's true length
        let newLength = await discoverPVarLength(ldb, keyPrefix, { excludeI: removedI })
        if (newLength !== oldRoot.length) {
          dbOps.push({
            type: 'put',
            key: keyPrefix,
            value: {
              type: 'Array',
              value: [],
              length: newLength
            }
          })
        }
      }
    }
  } else {
    // delete the whole thing
    await dbRange.promise(ldb, {
      prefix: keyPrefix,
      values: false
    }, function (key) {
      dbOps.push({ type: 'del', key: key })
    })
  }
  return dbOps
}

module.exports = function (opts) {
  var ldb = levelup(encode(opts.db, {
    keyEncoding: bytewise,
    valueEncoding: safeJsonCodec
  }))

  var newID = cuid
  var genDID = function () {
    const data = sovrinDID.gen()
    const indyPairs = sodium.crypto_sign_keypair()
    data.indyPublic = bs58.encode(Buffer.from(indyPairs.publicKey))
    data.secret.indyPrivate = bs58.encode(Buffer.from(indyPairs.privateKey))
    return data
  }
  if (opts.__use_sequential_ids_for_testing) {
    newID = (function () {
      var prefix = opts.__sequential_id_prefix_for_testing || 'id'
      var i = 0
      return function () {
        return prefix + i++
      }
    }())
    genDID = function () {
      var id = newID()
      return {
        did: id,
        verifyKey: 'verifyKey_' + id,
        secret: {
          seed: 'seed_' + id,
          signKey: 'signKey_' + id
        }
      }
    }
  }

  ldb.getNF = function (key) {
    return ldb.get(key)
      .catch(function (err) {
        return err && err.notFound
          ? null
          : Promise.reject(err)
      })
  }

  function forRange (opts, onData) {
    return dbRange.promise(ldb, opts, onData)
  }

  var getMigrationLog = function (callback) {
    var log = {}
    dbRange(ldb, {
      prefix: ['migration-log']
    }, function (data) {
      log[data.key[1]] = data.value
    }, function (err) {
      callback(err, log)
    })
  }
  var recordMigration = function (version, callback) {
    ldb.put(['migration-log', version + ''], {
      timestamp: (new Date()).toISOString()
    }, callback)
  }
  var removeMigration = function (version, callback) {
    ldb.del(['migration-log', version + ''], callback)
  }

  function newChannelBase (opts) {
    var did = genDID()
    var channel = {
      id: did.did,
      pico_id: opts.pico_id,
      name: opts.name,
      type: opts.type,
      policy_id: opts.policy_id,
      sovrin: did
    }
    var dbOps = [
      {
        type: 'put',
        key: ['channel', channel.id],
        value: channel
      },
      {
        type: 'put',
        key: ['pico-eci-list', channel.pico_id, channel.id],
        value: true
      }
    ]
    return {
      channel: channel,
      dbOps: dbOps
    }
  }

  function mkAdminChannel (picoId) {
    return newChannelBase({
      pico_id: picoId,
      name: 'admin',
      type: 'secret',
      policy_id: ADMIN_POLICY_ID
    })
  }

  function getEnabledRuleset (rid, callback) {
    ldb.get(['rulesets', 'enabled', rid], function (err, dataE) {
      if (err) return callback(err)
      ldb.get(['rulesets', 'krl', dataE.hash], function (err, dataK) {
        if (err) return callback(err)
        callback(null, {
          src: dataK.src,
          hash: dataE.hash,
          rid: dataK.rid,
          url: dataK.url,
          timestamp_stored: dataK.timestamp,
          timestamp_enable: dataE.timestamp
        })
      })
    })
  }

  function getEnabledRulesetP (rid) {
    return new Promise(function (resolve, reject) {
      getEnabledRuleset(rid, function (err, rs) {
        if (err && err.notFound) return resolve()
        if (err) return reject(err)
        else resolve(rs)
      })
    })
  }

  async function exportPico (id, result) {
    var pico
    try {
      pico = await ldb.get(['pico', id])
    } catch (err) {
      if (err && err.notFound) {
        return null
      }
      throw err
    }

    await forRange({
      prefix: ['pico-eci-list', pico.id]
    }, async function (data) {
      var eci = data.key[2]
      var channel = await ldb.get(['channel', eci])
      channel = _.omit(channel, 'pico_id')
      _.set(pico, ['channels', channel.id], channel)

      if (!result.policies || !result.policies[channel.policy_id]) {
        var policy = await ldb.get(['policy', channel.policy_id])
        _.set(result, ['policies', policy.id], _.omit(policy, 'id'))
      }
    })

    pico.rulesets = []
    await forRange({
      prefix: ['pico-ruleset', pico.id]
    }, function (data) {
      if (!data.value || !data.value.on) {
        return
      }
      var rid = data.key[2]
      if (_.has(result, ['rulesets', rid])) {
        return
      }
      pico.rulesets.push(rid)
      return getEnabledRulesetP(rid)
        .then(function (rs) {
          _.set(result, ['rulesets', rid], rs)
        })
    })

    await forRange({
      prefix: ['entvars', pico.id],
      values: false
    }, function (key) {
      return new Promise(function (resolve, reject) {
        getPVar(ldb, key, [], function (err, value) {
          if (err) reject(err)
          _.set(pico, ['entvars'].concat(key.slice(2)), value)
          resolve()
        })
      })
    })

    await forRange({
      prefix: ['state_machine', pico.id]
    }, function (data) {
      _.set(pico, ['state_machine'].concat(data.key.slice(2)), data.value)
    })

    await forRange({
      prefix: ['aggregator_var', pico.id]
    }, function (data) {
      _.set(pico, ['aggregator_var'].concat(data.key.slice(2)), data.value)
    })

    pico.children = []
    await forRange({
      prefix: ['pico-children', pico.id]
    }, function (data) {
      if (!data.value) return
      var picoId = data.key[2]
      return exportPico(picoId, result)
        .then(function (child) {
          pico.children.push(child)
        })
    })

    return pico
  }

  async function recursivelyGetAllChildrenPicoIDs (picoId) {
    var ids = []
    await forRange({
      prefix: ['pico-children', picoId]
    }, function (data) {
      if (!data.value) return
      var id = data.key[2]
      ids.push(id)
      return recursivelyGetAllChildrenPicoIDs(id)
        .then(function (subIDs) {
          ids = ids.concat(subIDs)
        })
    })
    return ids
  }

  async function getPicoID (id) {
    id = ktypes.toString(id)
    try {
      return await ldb.get(['pico', id])
    } catch (err) {
      if (err.notFound) {
        let err2 = new levelup.errors.NotFoundError('Pico not found: ' + id)
        err2.notFound = true
        throw err2
      }
      throw err
    }
  }

  function getPicoStatus (picoId) {
    return ldb.getNF(['pico-status', picoId])
      .then(function (data) {
        return {
          isLeaving: !!(data && data.isLeaving),
          movedToHost: data && ktypes.isString(data.movedToHost)
            ? data.movedToHost
            : null
        }
      })
      .catch(function (err) {
        if (err.notFound) {
          return {
            isLeaving: false,
            movedToHost: null
          }
        }
        return Promise.reject(err)
      })
  }

  function newPolicy (policy) {
    var newPolicy = ChannelPolicy.clean(policy)
    newPolicy.id = newID()
    return ldb.put(['policy', newPolicy.id], newPolicy)
      .then(function () {
        return newPolicy
      })
  }

  async function storeRuleset (krlSrc, meta, timestamp) {
    timestamp = timestamp || (new Date()).toISOString()

    var rid = extractRulesetID(krlSrc)
    if (!rid) {
      throw new Error('Ruleset name not found')
    }
    var shasum = crypto.createHash('sha256')
    shasum.update(krlSrc)
    var hash = shasum.digest('hex')

    var url = _.has(meta, 'url') && _.isString(meta.url)
      ? meta.url
      : null

    var dbOps = [
      {
        // the source of truth for a ruleset version
        type: 'put',
        key: ['rulesets', 'krl', hash],
        value: {
          src: krlSrc,
          rid: rid,
          url: url,
          timestamp: timestamp
        }
      },
      {
        // index to view all the versions of a given ruleset name
        type: 'put',
        key: ['rulesets', 'versions', rid, timestamp, hash],
        value: true
      }
    ]
    if (url) {
      // index to lookup by url
      dbOps.push({
        type: 'put',
        key: ['rulesets', 'url', url.toLowerCase().trim(), rid, hash],
        value: true
      })
    }
    await ldb.batch(dbOps)
    return { rid: rid, hash: hash }
  }

  async function enableRuleset (hash) {
    let data = await ldb.get(['rulesets', 'krl', hash])
    await ldb.put(['rulesets', 'enabled', data.rid], {
      hash: hash,
      timestamp: (new Date()).toISOString()
    })
  }

  return {
    ldb: opts.__expose_ldb_for_testing ? ldb : null,

    // for legacy-ui api routes
    forRange: forRange,

    toObj: async function () {
      var dump = {}
      await forRange({}, function (data) {
        if (!_.isArray(data.key)) {
          return
        }
        _.set(dump, data.key, data.value)
      })
      _.each(dump.channel, function (chan) {
        // keep it secret
        delete chan.sovrin.secret
      })
      return dump
    },

    /// ////////////////////////////////////////////////////////////////////
    //
    // Picos
    //
    getPicoIDByECI: util.promisify(function (eci, callback) {
      eci = ktypes.toString(eci)
      ldb.get(['channel', eci], function (err, data) {
        if (err && err.notFound) {
          err = new levelup.errors.NotFoundError('ECI not found: ' + eci)
          err.notFound = true
        }
        callback(err, data && data.pico_id)
      })
    }),

    assertPicoID: function (id) {
      return getPicoID(id)
        .then(function (pico) {
          return pico.id
        })
    },

    decryptChannelMessage: util.promisify(function (eci, encryptedMessage, nonce, otherPublicKey, callback) {
      eci = ktypes.toString(eci)
      encryptedMessage = ktypes.toString(encryptedMessage)
      nonce = ktypes.toString(nonce)
      otherPublicKey = ktypes.toString(otherPublicKey)
      ldb.get(['channel', eci], function (err, channel) {
        if (err) {
          if (err.notFound) {
            err = new levelup.errors.NotFoundError('ECI not found: ' + eci)
            err.notFound = true
          }
          callback(err)
          return
        }
        var decryptedMessage
        try {
          var sharedSecret = channel.sovrin.sharedSecret
          if (!sharedSecret) {
            var privateKey = channel.sovrin.secret.encryptionPrivateKey
            sharedSecret = sovrinDID.getSharedSecret(otherPublicKey, privateKey)
            ldb.put(['channel', eci, 'sovrin', 'secret', 'sharedSecret'], bs58.encode(Buffer.from(sharedSecret)), function (err) {
              if (err) {
                callback(err)
              }
            })
          } else {
            sharedSecret = bs58.decode(sharedSecret)
          }
          encryptedMessage = bs58.decode(encryptedMessage)
          nonce = bs58.decode(nonce)
          decryptedMessage = sovrinDID.decryptMessage(encryptedMessage, nonce, sharedSecret)
          if (decryptedMessage === false) throw new Error('failed to decryptedMessage')
        } catch (e) {
          // Failed to decrypt message
          callback(null, false)
          return
        }

        callback(null, decryptedMessage)
      })
    }),
    encryptChannelMessage: util.promisify(function (eci, message, otherPublicKey, callback) {
      eci = ktypes.toString(eci)
      message = ktypes.toString(message)
      otherPublicKey = ktypes.toString(otherPublicKey)
      ldb.get(['channel', eci], function (err, channel) {
        if (err) {
          if (err.notFound) {
            err = new levelup.errors.NotFoundError('ECI not found: ' + eci)
            err.notFound = true
          }
          callback(err)
          return
        }
        var privateKey = channel.sovrin.secret.encryptionPrivateKey
        privateKey = bs58.decode(privateKey)
        var sharedSecret = channel.sovrin.sharedSecret
        if (!sharedSecret) {
          sharedSecret = sovrinDID.getSharedSecret(otherPublicKey, privateKey)
          ldb.put(['channel', eci, 'sovrin', 'secret', 'sharedSecret'], bs58.encode(Buffer.from(sharedSecret)), function (err) {
            if (err) {
              callback(err)
            }
          })
        } else {
          sharedSecret = bs58.decode(sharedSecret)
        }
        var nonce = sovrinDID.getNonce()
        var encryptedMessage = sovrinDID.encryptMessage(message, nonce, sharedSecret)

        if (encryptedMessage === false) {
          callback(new Error('Failed to encrypt message'))
          return
        }

        var returnObj = {}
        returnObj.encryptedMessage = bs58.encode(Buffer.from(encryptedMessage))
        returnObj.nonce = bs58.encode(Buffer.from(nonce))
        callback(null, returnObj)
      })
    }),

    signChannelMessage: util.promisify(function (eci, message, callback) {
      eci = ktypes.toString(eci)
      message = ktypes.toString(message)
      ldb.get(['channel', eci], function (err, channel) {
        if (err) {
          if (err.notFound) {
            err = new levelup.errors.NotFoundError('ECI not found: ' + eci)
            err.notFound = true
          }
          callback(err)
          return
        }
        var signKey = channel.sovrin.secret.signKey
        var verifyKey = channel.sovrin.verifyKey
        var signedMessage = sovrinDID.signMessage(message, signKey, verifyKey)
        if (signedMessage === false) {
          callback(new Error('Failed to sign message'))
          return
        }
        signedMessage = bs58.encode(Buffer.from(signedMessage))
        callback(null, signedMessage)
      })
    }),

    getRootPico: function () {
      return ldb.get(['root_pico'])
    },

    getParent: util.promisify(function (picoId, callback) {
      ldb.get(['pico', picoId], function (err, data) {
        callback(err, (data && data.parent_id) || null)
      })
    }),
    getAdminECI: util.promisify(function (picoId, callback) {
      ldb.get(['pico', picoId], function (err, data) {
        callback(err, (data && data.admin_eci) || null)
      })
    }),
    listChildren: util.promisify(function (picoId, callback) {
      var children = []
      dbRange(ldb, {
        prefix: ['pico-children', picoId],
        values: false
      }, function (key) {
        children.push(key[2])
      }, function (err) {
        callback(err, children)
      })
    }),

    newPico: async function (opts) {
      var newPico = {
        id: newID(),
        parent_id: _.isString(opts.parent_id) && opts.parent_id.length > 0
          ? opts.parent_id
          : null
      }

      var c = mkAdminChannel(newPico.id)
      newPico.admin_eci = c.channel.id

      var dbOps = c.dbOps

      dbOps.push({
        type: 'put',
        key: ['pico', newPico.id],
        value: newPico
      })
      if (newPico.parent_id) {
        dbOps.push({
          type: 'put',
          key: ['pico-children', newPico.parent_id, newPico.id],
          value: true
        })
      } else {
        dbOps.push({
          type: 'put',
          key: ['root_pico'],
          value: newPico
        })
      }

      await ldb.batch(dbOps)

      return newPico
    },

    removePico: util.promisify(function (id, callback) {
      var dbOps = []

      var keyRange = function (prefix, fn) {
        return async.apply(dbRange, ldb, {
          prefix: prefix,
          values: false
        }, fn)
      }

      async.series([
        keyRange(['pico', id], function (key) {
          dbOps.push({ type: 'del', key: key })
        }),
        keyRange(['pico-eci-list', id], function (key) {
          var eci = key[2]
          dbOps.push({ type: 'del', key: key })
          dbOps.push({ type: 'del', key: ['channel', eci] })
          // TODO drop scheduled events ??
        }),
        keyRange(['entvars', id], function (key) {
          dbOps.push({ type: 'del', key: key })
        }),
        keyRange(['pico-ruleset', id], function (key) {
          dbOps.push({ type: 'del', key: key })
          dbOps.push({ type: 'del', key: ['ruleset-pico', key[2], key[1]] })
        }),
        keyRange(['pico-children', id], function (key) {
          dbOps.push({ type: 'del', key: key })
        }),
        function (next) {
          ldb.get(['pico', id], function (err, pico) {
            if ((err && err.notFound) || !pico) {
              next()
              return
            }
            if (err) return next(err)
            if (pico.parent_id) {
              keyRange(['pico-children', pico.parent_id, id], function (key) {
                dbOps.push({ type: 'del', key: key })
              })(next)
              return
            }
            ldb.get(['root_pico'], function (err, data) {
              if (err) return next(err)
              if (data.id === id) {
                dbOps.push({ type: 'del', key: ['root_pico'] })
              }
              next()
            })
          })
        }
      ], function (err) {
        if (err) return callback(err)
        ldb.batch(dbOps, callback)
      })
    }),

    exportPico: async function (id) {
      var result = {
        version: engineCoreVersion
      }
      result.pico = await exportPico(id, result)
      return result
    },

    importPico: async function (parentId, data) {
      if (!data || data.version !== engineCoreVersion) {
        throw new Error('importPico incompatible version')
      }

      // policies
      let polIdMap = {}
      for (let id of Object.keys(data.policies || {})) {
        let theirs = data.policies[id]
        theirs.id = id
        let mine = await ldb.getNF(['policy', id])
        if (mine && _.isEqual(mine, theirs)) {
          polIdMap[id] = id
        } else {
          let newP = await newPolicy(_.omit(theirs, 'id'))
          polIdMap[id] = newP.id
        }
      }

      // rulesets
      for (let rid of Object.keys(data.rulesets || {})) {
        let theirs = data.rulesets[rid]
        theirs.rid = rid
        let enabled = await ldb.getNF(['rulesets', 'enabled', rid])
        if (enabled) {
          if (theirs.hash === enabled.hash) {
            // good to go
          } else {
            throw new Error('Cannot import pico. This engine has a different version of ' + rid + ' enabled.')
          }
        } else {
          let rsinfo = await storeRuleset(theirs.src, { url: theirs.url })
          await enableRuleset(rsinfo.hash)
        }
      }

      if (!data.pico) {
        return null
      }

      async function importPicoBase (pico, parentId) {
        var dbOps = []

        var impPico = {
          id: newID(),
          parent_id: parentId,
          admin_eci: pico.admin_eci
        }

        _.each(pico.channels, function (channelOrig) {
          let channel = _.assign({}, channelOrig, {
            pico_id: impPico.id,
            policy_id: polIdMap[channelOrig.policy_id]
          })

          dbOps.push({
            type: 'put',
            key: ['channel', channel.id],
            value: channel
          })
          dbOps.push({
            type: 'put',
            key: ['pico-eci-list', channel.pico_id, channel.id],
            value: true
          })
        })
        if (!impPico.admin_eci) {
          let c = mkAdminChannel(impPico.id)
          impPico.admin_eci = c.channel.id
          dbOps.push(c.dbOps)
        }

        dbOps.push({
          type: 'put',
          key: ['pico', impPico.id],
          value: impPico
        })
        dbOps.push({
          type: 'put',
          key: ['pico-children', impPico.parent_id, impPico.id],
          value: true
        })

        _.each(pico.rulesets, function (rid) {
          dbOps.push({
            type: 'put',
            key: ['pico-ruleset', impPico.id, rid],
            value: { on: true }
          })
          dbOps.push({
            type: 'put',
            key: ['ruleset-pico', rid, impPico.id],
            value: { on: true }
          })
        })

        let toWaits = []
        _.each(pico.entvars, function (vars, rid) {
          _.each(vars, function (val, vname) {
            toWaits.push(putPVar(ldb, ['entvars', impPico.id, rid, vname], null, val))
          })
        })
        dbOps.push(await Promise.all(toWaits))

        _.each(pico.state_machine, function (rules, rid) {
          _.each(rules, function (data, rname) {
            dbOps.push({
              type: 'put',
              key: ['state_machine', impPico.id, rid, rname],
              value: data
            })
          })
        })

        _.each(pico.aggregator_var, function (rules, rid) {
          _.each(rules, function (vars, rname) {
            _.each(vars, function (val, varKey) {
              dbOps.push({
                type: 'put',
                key: ['aggregator_var', impPico.id, rid, rname, varKey],
                value: val
              })
            })
          })
        })

        await Promise.all(_.map(pico.children, function (subPico) {
          return importPicoBase(subPico, impPico.id)
            .then(function ([id, ops]) {
              dbOps.push(ops)
            })
        }))

        return [impPico.id, _.flattenDeep(dbOps)]
      }

      let [newPicoId, dbOps] = await importPicoBase(data.pico, parentId)
      await ldb.batch(dbOps)
      return newPicoId
    },

    setPicoStatus: async function (picoId, isLeaving, movedToHost) {
      let pico = await getPicoID(picoId)
      if (pico.parent_id) {
        let parentStatus = await getPicoStatus(pico.parent_id)
        if (parentStatus.isLeaving || parentStatus.movedToHost) {
          throw new Error('Cannot change pico status b/c its parent is transient')
        }
      }
      let status = {
        isLeaving: isLeaving,
        movedToHost: movedToHost
      }
      var childIDs = await recursivelyGetAllChildrenPicoIDs(pico.id)
      return ldb.batch([pico.id].concat(childIDs).map(function (id) {
        return {
          type: 'put',
          key: ['pico-status', id],
          value: status
        }
      }))
    },
    getPicoStatus: getPicoStatus,

    /// /////////////////////////////////////////////////////////////////////
    //
    // installed rulesets
    //
    ridsOnPico: util.promisify(function (picoId, callback) {
      var picoRids = {}
      dbRange(ldb, {
        prefix: ['pico-ruleset', picoId]
      }, function (data) {
        var rid = data.key[2]
        if (data.value && data.value.on === true) {
          picoRids[rid] = true
        }
      }, function (err) {
        callback(err, picoRids)
      })
    }),
    addRulesetToPico: async function (picoId, rid) {
      var val = {
        on: true
      }
      await ldb.batch([
        {
          type: 'put',
          key: ['pico-ruleset', picoId, rid],
          value: val
        },
        {
          type: 'put',
          key: ['ruleset-pico', rid, picoId],
          value: val
        }
      ])
    },
    removeRulesetFromPico: util.promisify(function (picoId, rid, callback) {
      var dbOps = [
        { type: 'del', key: ['pico-ruleset', picoId, rid] },
        { type: 'del', key: ['ruleset-pico', rid, picoId] }
      ]
      dbRange(ldb, {
        prefix: ['entvars', picoId, rid],
        values: false
      }, function (key) {
        dbOps.push({ type: 'del', key: key })
      }, function (err) {
        if (err) return callback(err)
        ldb.batch(dbOps, callback)
      })
    }),

    /// /////////////////////////////////////////////////////////////////////
    //
    // channels
    //
    newChannel: async function (opts) {
      var c = newChannelBase(opts)
      await ldb.batch(c.dbOps)
      return omitChannelSecret(c.channel)
    },
    listChannels: util.promisify(function (picoId, callback) {
      var eciList = []
      dbRange(ldb, {
        prefix: ['pico-eci-list', picoId],
        values: false
      }, function (key) {
        eciList.push(key[2])
      }, function (err) {
        if (err) return callback(err)
        async.map(eciList, function (eci, next) {
          ldb.get(['channel', eci], function (err, channel) {
            if (err) return next(err)
            next(null, omitChannelSecret(channel))
          })
        }, callback)
      })
    }),
    removeChannel: util.promisify(function (eci, callback) {
      ldb.get(['channel', eci], function (err, data) {
        if (err) return callback(err)

        ldb.get(['pico', data.pico_id], function (err, pico) {
          if (err) return callback(err)
          if (pico.admin_eci === eci) {
            callback(new Error("Cannot delete the pico's admin channel"))
            return
          }
          var dbOps = [
            { type: 'del', key: ['channel', eci] },
            { type: 'del', key: ['pico-eci-list', pico.id, eci] }
          ]
          ldb.batch(dbOps, callback)
        })
      })
    }),

    getChannelSecrets: async function (eci) {
      let data
      try {
        data = await ldb.get(['channel', eci])
      } catch (err) {
        if (err.notFound) {
          err = new levelup.errors.NotFoundError('ECI not found: ' + ktypes.toString(eci))//eslint-disable-line
          err.notFound = true
        }
        throw err
      }
      return data
    },

    getChannelAndPolicy: async function (eci) {
      let data
      try {
        data = await ldb.get(['channel', eci])
      } catch (err) {
        if (err.notFound) {
          err = new levelup.errors.NotFoundError('ECI not found: ' + ktypes.toString(eci))//eslint-disable-line
          err.notFound = true
        }
        throw err
      }
      var chann = omitChannelSecret(data)
      data = await ldb.get(['policy', chann.policy_id])
      chann.policy = data
      return chann
    },

    newPolicy: newPolicy,

    listPolicies: util.promisify(function (callback) {
      var list = []
      dbRange(ldb, {
        prefix: ['policy'],
        keys: false
      }, function (value) {
        list.push(value)
      }, function (err) {
        callback(err, list)
      })
    }),

    assertPolicyID: util.promisify(function (id, callback) {
      id = ktypes.toString(id)
      ldb.get(['policy', id], function (err) {
        if (err && err.notFound) {
          err = new levelup.errors.NotFoundError('Policy not found: ' + id)
          err.notFound = true
        }
        callback(err, err ? null : id)
      })
    }),

    removePolicy: util.promisify(function (id, callback) {
      id = ktypes.toString(id)
      ldb.get(['policy', id], function (err, policy) {
        if (err && err.notFound) {
          err = new levelup.errors.NotFoundError('Policy not found: ' + id)
          err.notFound = true
        }
        if (err) return callback(err)

        var isUsed = false
        dbRange(ldb, {
          prefix: ['channel'],
          keys: false
        }, function (chann, stopRange) {
          if (chann.policy_id === id) {
            isUsed = true
            stopRange()
          }
        }, function (err) {
          if (err) return callback(err)
          if (isUsed) {
            return callback(new Error('Policy ' + id + ' is in use, cannot remove.'))
          }
          ldb.del(['policy', id], callback)
        })
      })
    }),

    /// /////////////////////////////////////////////////////////////////////
    //
    // ent:*
    //
    putEntVar: async function (picoId, rid, varName, query, val) {
      const ops = await putPVar(ldb, ['entvars', picoId, rid, varName], query, val)
      await ldb.batch(ops)
    },
    appendEntVar: async function (picoId, rid, varName, values) {
      const ops = await appendPVar(ldb, ['entvars', picoId, rid, varName], values)
      await ldb.batch(ops)
    },
    getEntVar: function (picoId, rid, varName, query) {
      return getPVar(ldb, ['entvars', picoId, rid, varName], query)
    },
    delEntVar: async function (picoId, rid, varName, query) {
      const ops = await delPVar(ldb, ['entvars', picoId, rid, varName], query)
      await ldb.batch(ops)
    },

    /// /////////////////////////////////////////////////////////////////////
    //
    // app:*
    //
    putAppVar: async function (rid, varName, query, val) {
      const ops = await putPVar(ldb, ['appvars', rid, varName], query, val)
      await ldb.batch(ops)
    },
    appendAppVar: async function (rid, varName, values) {
      const ops = await appendPVar(ldb, ['appvars', rid, varName], values)
      await ldb.batch(ops)
    },
    getAppVar: function (rid, varName, query) {
      return getPVar(ldb, ['appvars', rid, varName], query)
    },
    delAppVar: async function (rid, varName, query) {
      const ops = await delPVar(ldb, ['appvars', rid, varName], query)
      await ldb.batch(ops)
    },

    /// /////////////////////////////////////////////////////////////////////
    //
    // event state machine and aggregators
    //
    getStateMachine: util.promisify(function (picoId, rule, callback) {
      var key = ['state_machine', picoId, rule.rid, rule.name]
      ldb.get(key, function (err, data) {
        if (err && !err.notFound) {
          return callback(err)
        }
        data = data || {}
        var states = _.filter(_.flattenDeep([data.state]), function (state) {
          return _.has(rule.select.state_machine, state)
        })
        if (states.length === 0) {
          data.state = 'start'
        } else if (states.length === 1) {
          data.state = states[0]
        } else {
          data.state = states
        }
        callback(null, data)
      })
    }),
    putStateMachine: function (picoId, rule, data) {
      var key = ['state_machine', picoId, rule.rid, rule.name]
      return ldb.put(key, data)
    },

    updateAggregatorVar: util.promisify(function (picoId, rule, varKey, updater, callback) {
      var key = [
        'aggregator_var',
        picoId,
        rule.rid,
        rule.name,
        varKey
      ]
      ldb.get(key, function (err, val) {
        if (err && !err.notFound) {
          return callback(err)
        }
        if (!_.isArray(val)) {
          val = []
        }
        val = updater(val)
        if (!_.isArray(val)) {
          val = []
        }
        ldb.put(key, val, function (err) {
          callback(err, val)
        })
      })
    }),

    /// /////////////////////////////////////////////////////////////////////
    //
    // rulesets
    //
    storeRuleset: storeRuleset,
    hasEnabledRid: util.promisify(function (rid, callback) {
      var hasFound = false
      dbRange(ldb, {
        prefix: ['rulesets', 'enabled', rid],
        values: false,
        limit: 1
      }, function (key) {
        hasFound = true
      }, function (err) {
        callback(err, hasFound)
      })
    }),
    findRulesetsByURL: util.promisify(function (url, callback) {
      var r = []
      dbRange(ldb, {
        prefix: ['rulesets', 'url', url.toLowerCase().trim()]
      }, function (data) {
        if (data.value) {
          r.push({
            rid: data.key[3],
            hash: data.key[4]
          })
        }
      }, function (err) {
        if (err) return callback(err)
        callback(null, r)
      })
    }),
    enableRuleset: enableRuleset,
    disableRuleset: function (rid) {
      return ldb.del(['rulesets', 'enabled', rid])
    },
    getEnabledRuleset: getEnabledRulesetP,
    listAllEnabledRIDs: util.promisify(function (callback) {
      var rids = []
      dbRange(ldb, {
        prefix: ['rulesets', 'enabled'],
        values: false
      }, function (key) {
        rids.push(key[2])
      }, function (err) {
        callback(err, rids)
      })
    }),
    isRulesetUsed: util.promisify(function (rid, callback) {
      var isUsed = false
      dbRange(ldb, {
        prefix: ['ruleset-pico', rid],
        values: false,
        limit: 1
      }, function (key) {
        isUsed = true
      }, function (err) {
        callback(err, isUsed)
      })
    }),
    deleteRuleset: util.promisify(function (rid, callback) {
      var toDel = [
        ['rulesets', 'enabled', rid]
      ]

      var hashes = []
      dbRange(ldb, {
        prefix: ['rulesets', 'versions', rid],
        values: false
      }, function (key) {
        var hash = key[4]

        toDel.push(key)
        toDel.push(['rulesets', 'krl', hash])
        hashes.push(hash)
      }, function (err) {
        if (err) return callback(err)
        async.each(hashes, function (hash, next) {
          ldb.get(['rulesets', 'krl', hash], function (err, data) {
            if (err) return next(err)
            if (_.isString(data.url)) {
              toDel.push([
                'rulesets',
                'url',
                data.url.toLowerCase().trim(),
                data.rid,
                hash
              ])
            }
            next()
          })
        }, function (err) {
          if (err) return callback(err)

          dbRange(ldb, {
            prefix: ['appvars', rid],
            values: false
          }, function (key) {
            toDel.push(key)
          }, function (err) {
            if (err) return callback(err)

            ldb.batch(_.map(toDel, function (key) {
              return { type: 'del', key: key }
            }), callback)
          })
        })
      })
    }),

    /// /////////////////////////////////////////////////////////////////////
    //
    // scheduled events
    //
    scheduleEventAt: util.promisify(function (at, event, callback) {
      var id = newID()

      var val = {
        id: id,
        at: at,
        event: event
      }

      ldb.batch([
        { type: 'put', key: ['scheduled', id], value: val },
        { type: 'put', key: ['scheduled_by_at', at, id], value: val }
      ], function (err) {
        if (err) return callback(err)

        callback(null, val)
      })
    }),
    nextScheduleEventAt: function (callback) {
      callback = promiseCallback(callback)
      var r
      dbRange(ldb, {
        prefix: ['scheduled_by_at'],
        limit: 1// peek the first one
      }, function (data) {
        r = {
          id: data.value.id,
          at: data.key[1], // Date object
          event: data.value.event
        }
      }, function (err) {
        callback(err, r)
      })
      return callback.promise
    },
    removeScheduleEventAt: function (id, at, callback) {
      callback = promiseCallback(callback)
      ldb.batch([
        { type: 'del', key: ['scheduled', id] },
        { type: 'del', key: ['scheduled_by_at', at, id] }
      ], callback)
      return callback.promise
    },
    scheduleEventRepeat: async function (timespec, event) {
      var id = newID()

      var val = {
        id: id,
        timespec: timespec,
        event: event
      }

      await ldb.batch([
        { type: 'put', key: ['scheduled', id], value: val }
      ])
      return val
    },
    listScheduled: util.promisify(function (callback) {
      var r = []
      dbRange(ldb, {
        prefix: ['scheduled']
      }, function (data) {
        var val = data.value
        r.push(val)
      }, function (err) {
        callback(err, _.sortBy(r, 'at'))
      })
    }),
    removeScheduled: util.promisify(function (id, callback) {
      ldb.get(['scheduled', id], function (err, info) {
        if (err) return callback(err)

        var dbOps = [
          { type: 'del', key: ['scheduled', id] }
        ]
        if (_.has(info, 'at')) {
          // also remove the `at` index
          dbOps.push({ type: 'del', key: ['scheduled_by_at', new Date(info.at), id] })
        }

        ldb.batch(dbOps, callback)
      })
    }),

    /// /////////////////////////////////////////////////////////////////////
    //
    // db migrations
    //
    getMigrationLog: util.promisify(getMigrationLog),
    recordMigration: util.promisify(recordMigration),
    removeMigration: util.promisify(removeMigration),
    checkAndRunMigrations: util.promisify(function (callback) {
      getMigrationLog(function (err, log) {
        if (err) return callback(err)

        var toRun = []
        _.each(migrations, function (m, version) {
          if (!_.has(log, version)) {
            toRun.push(version)
          }
        })
        toRun.sort()// must run in order

        async.eachSeries(toRun, function (version, next) {
          var m = migrations[version]
          m.up(ldb, function (err, data) {
            if (err) return next(err)
            recordMigration(version, next)
          })
        }, callback)
      })
    })
  }
}

module.exports.ADMIN_POLICY_ID = ADMIN_POLICY_ID
