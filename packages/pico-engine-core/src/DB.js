var _ = require('lodash')
var bs58 = require('bs58')
var cuid = require('cuid')
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

// NOTE: for now we are going to default to an allow all policy
// This makes migrating easier while waiting for krl system rulesets to assume policy usage
var ADMIN_POLICY_ID = 'allow-all-policy'// NOTE: changing this requires a db migration

var omitChannelSecret = function (channel) {
  return _.assign({}, channel, {
    sovrin: _.omit(channel.sovrin, 'secret')
  })
}

// coerce the value into an array of key strings
var toKeyPath = function (path) {
  if (!ktypes.isArray(path)) {
    path = [path]
  }
  return _.map(path, function (key) {
    return ktypes.toString(key)
  })
}

var putPVar = function (ldb, keyPrefix, query, val, callback) {
  query = ktypes.isNull(query) ? [] : query
  query = ktypes.isArray(query) ? query : [query]
  // do this before toKeyPath b/c it will convert all parts to stings
  var isArrayIndex = _.isInteger(query[0]) && query[0] >= 0
  var path = toKeyPath(query)
  if (_.size(path) > 0) {
    var subkeyPrefix = keyPrefix.concat(['value', path[0]])
    var subPath = _.tail(path)
    ldb.get(keyPrefix, function (err, oldRoot) {
      if (err && !err.notFound) {
        callback(err)
        return
      }
      var ops = []
      var type = oldRoot && oldRoot.type
      if (type !== 'Map' && type !== 'Array') {
        type = isArrayIndex ? 'Array' : 'Map'
      }
      if (type === 'Array' && !isArrayIndex) {
        type = 'Map'// convert to map if a non-index key comes in
      }
      var root = {
        type: type,
        // this `value` helps _.set in the toObj db dump set the right type
        value: type === 'Array' ? [] : {}
      }
      ops.push({ type: 'put', key: keyPrefix, value: root })

      if (_.isEmpty(subPath)) {
        ops.push({ type: 'put', key: subkeyPrefix, value: val })
        ldb.batch(ops, callback)
        return
      }
      ldb.get(subkeyPrefix, function (err, data) {
        if (err && err.notFound) {
          data = {}
        } else if (err) {
          callback(err)
          return
        }
        data = _.set(data, subPath, val)
        ops.push({ type: 'put', key: subkeyPrefix, value: data })
        ldb.batch(ops, callback)
      })
    })
    return
  }
  ldb.get(keyPrefix, function (err, oldRoot) {
    if (err && !err.notFound) {
      callback(err)
      return
    }
    var ops = []
    dbRange(ldb, {
      prefix: keyPrefix,
      values: false
    }, function (key) {
      ops.push({ type: 'del', key: key })
    }, function (err) {
      if (err) return callback(err)
      var root = {
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
            ops.push({
              type: 'put',
              key: keyPrefix.concat(['value', k]),
              value: v
            })
          })
          // this `value` helps _.set in the toObj db dump set the right type
          root.value = root.type === 'Array' ? [] : {}
          break
        default:
          root.value = val
      }
      ops.push({
        type: 'put',
        key: keyPrefix,
        value: root
      })
      ldb.batch(ops, callback)
    })
  })
}

var getPVar = function (ldb, keyPrefix, query, callback) {
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
}

var delPVar = function (ldb, keyPrefix, query, callback) {
  var path = ktypes.isNull(query) ? [] : toKeyPath(query)
  if (_.size(path) > 0) {
    keyPrefix = keyPrefix.concat(['value', _.head(path)])
    var subPath = _.tail(path)
    if (!_.isEmpty(subPath)) {
      ldb.get(keyPrefix, function (err, data) {
        if (err && err.notFound) {
          data = {}
        } else if (err) {
          callback(err)
          return
        }
        var val = _.omit(data, subPath)
        if (_.isEmpty(val)) {
          ldb.del(keyPrefix, callback)
        } else {
          ldb.put(keyPrefix, val, callback)
        }
      })
      return
    }
  }
  var dbOps = []
  dbRange(ldb, {
    prefix: keyPrefix,
    values: false
  }, function (key) {
    dbOps.push({ type: 'del', key: key })
  }, function (err) {
    if (err) return callback(err)
    ldb.batch(dbOps, callback)
  })
}

module.exports = function (opts) {
  var ldb = levelup(encode(opts.db, {
    keyEncoding: bytewise,
    valueEncoding: safeJsonCodec
  }))

  var newID = cuid
  var genDID = sovrinDID.gen
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

  return {
    toObj: function (callback) {
      var dump = {}
      dbRange(ldb, {}, function (data) {
        if (!_.isArray(data.key)) {
          return
        }
        _.set(dump, data.key, data.value)
      }, function (err) {
        callback(err, dump)
      })
    },

    /// ////////////////////////////////////////////////////////////////////
    //
    // Picos
    //
    getPicoIDByECI: function (eci, callback) {
      eci = ktypes.toString(eci)
      ldb.get(['channel', eci], function (err, data) {
        if (err && err.notFound) {
          err = new levelup.errors.NotFoundError('ECI not found: ' + eci)
          err.notFound = true
        }
        callback(err, data && data.pico_id)
      })
    },

    assertPicoID: function (id, callback) {
      id = ktypes.toString(id)
      ldb.get(['pico', id], function (err) {
        if (err && err.notFound) {
          err = new levelup.errors.NotFoundError('Pico not found: ' + id)
          err.notFound = true
        }
        callback(err, err ? null : id)
      })
    },

    decryptChannelMessage: function (eci, encryptedMessage, nonce, otherPublicKey, callback) {
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
            ldb.put(['channel', eci, 'sovrin', 'secret', 'sharedSecret'], bs58.encode(sharedSecret), function (err) {
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
    },
    encryptChannelMessage: function (eci, message, otherPublicKey, callback) {
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
          ldb.put(['channel', eci, 'sovrin', 'secret', 'sharedSecret'], bs58.encode(sharedSecret), function (err) {
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
        returnObj.encryptedMessage = bs58.encode(encryptedMessage)
        returnObj.nonce = bs58.encode(nonce)
        callback(null, returnObj)
      })
    },

    signChannelMessage: function (eci, message, callback) {
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
        signedMessage = bs58.encode(signedMessage)
        callback(null, signedMessage)
      })
    },

    getRootPico: function (callback) {
      ldb.get(['root_pico'], callback)
    },

    getParent: function (picoId, callback) {
      ldb.get(['pico', picoId], function (err, data) {
        callback(err, (data && data.parent_id) || null)
      })
    },
    getAdminECI: function (picoId, callback) {
      ldb.get(['pico', picoId], function (err, data) {
        callback(err, (data && data.admin_eci) || null)
      })
    },
    listChildren: function (picoId, callback) {
      var children = []
      dbRange(ldb, {
        prefix: ['pico-children', picoId],
        values: false
      }, function (key) {
        children.push(key[2])
      }, function (err) {
        callback(err, children)
      })
    },

    newPico: function (opts, callback) {
      var newPico = {
        id: newID(),
        parent_id: _.isString(opts.parent_id) && opts.parent_id.length > 0
          ? opts.parent_id
          : null
      }

      var c = newChannelBase({
        pico_id: newPico.id,
        name: 'admin',
        type: 'secret',
        policy_id: ADMIN_POLICY_ID
      })
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

      ldb.batch(dbOps, function (err) {
        if (err) return callback(err)
        callback(null, newPico)
      })
    },

    removePico: function (id, callback) {
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
    },

    /// /////////////////////////////////////////////////////////////////////
    //
    // installed rulesets
    //
    ridsOnPico: function (picoId, callback) {
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
    },
    addRulesetToPico: function (picoId, rid, callback) {
      var val = {
        on: true
      }
      ldb.batch([
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
      ], callback)
    },
    removeRulesetFromPico: function (picoId, rid, callback) {
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
    },

    /// /////////////////////////////////////////////////////////////////////
    //
    // channels
    //
    newChannel: function (opts, callback) {
      var c = newChannelBase(opts)
      ldb.batch(c.dbOps, function (err) {
        if (err) return callback(err)
        callback(null, omitChannelSecret(c.channel))
      })
    },
    listChannels: function (picoId, callback) {
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
    },
    removeChannel: function (eci, callback) {
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
    },

    getChannelAndPolicy: function (eci, callback) {
      ldb.get(['channel', eci], function (err, data) {
        if (err) {
          if (err.notFound) {
            err = new levelup.errors.NotFoundError('ECI not found: ' + ktypes.toString(eci))
            err.notFound = true
          }
          callback(err)
          return
        }
        var chann = omitChannelSecret(data)
        ldb.get(['policy', chann.policy_id], function (err, data) {
          if (err) return callback(err)
          chann.policy = data
          callback(null, chann)
        })
      })
    },

    newPolicy: function (policy, callback) {
      var newPolicy = ChannelPolicy.clean(policy)
      newPolicy.id = newID()
      ldb.put(['policy', newPolicy.id], newPolicy, function (err, data) {
        callback(err, newPolicy)
      })
    },

    listPolicies: function (callback) {
      var list = []
      dbRange(ldb, {
        prefix: ['policy'],
        keys: false
      }, function (value) {
        list.push(value)
      }, function (err) {
        callback(err, list)
      })
    },

    assertPolicyID: function (id, callback) {
      id = ktypes.toString(id)
      ldb.get(['policy', id], function (err) {
        if (err && err.notFound) {
          err = new levelup.errors.NotFoundError('Policy not found: ' + id)
          err.notFound = true
        }
        callback(err, err ? null : id)
      })
    },

    removePolicy: function (id, callback) {
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
    },

    /// /////////////////////////////////////////////////////////////////////
    //
    // ent:*
    //
    putEntVar: function (picoId, rid, varName, query, val, callback) {
      putPVar(ldb, ['entvars', picoId, rid, varName], query, val, callback)
    },
    getEntVar: function (picoId, rid, varName, query, callback) {
      getPVar(ldb, ['entvars', picoId, rid, varName], query, callback)
    },
    delEntVar: function (picoId, rid, varName, query, callback) {
      delPVar(ldb, ['entvars', picoId, rid, varName], query, callback)
    },

    /// /////////////////////////////////////////////////////////////////////
    //
    // app:*
    //
    putAppVar: function (rid, varName, query, val, callback) {
      putPVar(ldb, ['appvars', rid, varName], query, val, callback)
    },
    getAppVar: function (rid, varName, query, callback) {
      getPVar(ldb, ['appvars', rid, varName], query, callback)
    },
    delAppVar: function (rid, varName, query, callback) {
      delPVar(ldb, ['appvars', rid, varName], query, callback)
    },

    /// /////////////////////////////////////////////////////////////////////
    //
    // event state machine and aggregators
    //
    getStateMachine: function (picoId, rule, callback) {
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
    },
    putStateMachine: function (picoId, rule, data, callback) {
      var key = ['state_machine', picoId, rule.rid, rule.name]
      ldb.put(key, data, callback)
    },

    updateAggregatorVar: function (picoId, rule, varKey, updater, callback) {
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
    },

    /// /////////////////////////////////////////////////////////////////////
    //
    // rulesets
    //
    storeRuleset: function (krlSrc, meta, callback) {
      var timestamp = (new Date()).toISOString()
      if (arguments.length === 4 && _.isString(arguments[3])) { // for testing only
        timestamp = arguments[3]// for testing only
      }// for testing only

      var rid = extractRulesetID(krlSrc)
      if (!rid) {
        callback(new Error('Ruleset name not found'))
        return
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
      ldb.batch(dbOps, function (err) {
        if (err) return callback(err)
        callback(null, {
          rid: rid,
          hash: hash
        })
      })
    },
    hasEnabledRid: function (rid, callback) {
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
    },
    findRulesetsByURL: function (url, callback) {
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
    },
    enableRuleset: function (hash, callback) {
      ldb.get(['rulesets', 'krl', hash], function (err, data) {
        if (err) return callback(err)
        ldb.put(['rulesets', 'enabled', data.rid], {
          hash: hash,
          timestamp: (new Date()).toISOString()
        }, callback)
      })
    },
    disableRuleset: function (rid, callback) {
      ldb.del(['rulesets', 'enabled', rid], callback)
    },
    getEnabledRuleset: function (rid, callback) {
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
    },
    listAllEnabledRIDs: function (callback) {
      var rids = []
      dbRange(ldb, {
        prefix: ['rulesets', 'enabled'],
        values: false
      }, function (key) {
        rids.push(key[2])
      }, function (err) {
        callback(err, rids)
      })
    },
    isRulesetUsed: function (rid, callback) {
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
    },
    deleteRuleset: function (rid, callback) {
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
    },

    /// /////////////////////////////////////////////////////////////////////
    //
    // scheduled events
    //
    scheduleEventAt: function (at, event, callback) {
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
    },
    nextScheduleEventAt: function (callback) {
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
    },
    removeScheduleEventAt: function (id, at, callback) {
      ldb.batch([
        { type: 'del', key: ['scheduled', id] },
        { type: 'del', key: ['scheduled_by_at', at, id] }
      ], callback)
    },
    scheduleEventRepeat: function (timespec, event, callback) {
      var id = newID()

      var val = {
        id: id,
        timespec: timespec,
        event: event
      }

      ldb.batch([
        { type: 'put', key: ['scheduled', id], value: val }
      ], function (err) {
        if (err) return callback(err)

        callback(null, val)
      })
    },
    listScheduled: function (callback) {
      var r = []
      dbRange(ldb, {
        prefix: ['scheduled']
      }, function (data) {
        var val = data.value
        r.push(val)
      }, function (err) {
        callback(err, _.sortBy(r, 'at'))
      })
    },
    removeScheduled: function (id, callback) {
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
    },

    /// /////////////////////////////////////////////////////////////////////
    //
    // db migrations
    //
    getMigrationLog: getMigrationLog,
    recordMigration: recordMigration,
    removeMigration: removeMigration,
    checkAndRunMigrations: function (callback) {
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
    }
  }
}

module.exports.ADMIN_POLICY_ID = ADMIN_POLICY_ID
