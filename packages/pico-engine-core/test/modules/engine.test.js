var _ = require('lodash')
var ktypes = require('krl-stdlib/types')
var kengine = require('../../src/modules/engine')
var ADMIN_POLICY_ID = require('../../src/DB').ADMIN_POLICY_ID
var mkTestPicoEngine = require('../helpers/mkTestPicoEngine')
var engineCoreVersion = require('../../package.json').version
var test = require('ava')

// wrap stubbed functions in this to simulate async
var tick = function (fn) {
  return async function () {
    let args = _.toArray(arguments)
    let callback = args[fn.length] || _.noop
    await new Promise(function (resolve) {
      setImmediate(resolve)
    })
    let data
    try {
      data = await Promise.resolve(fn.apply(null, args))
    } catch (err) {
      callback(err)
      throw err
    }
    callback(null, data)
    return data
  }
}

async function runAction (pe, ctx, domain, id, args) {
  var act = await pe.modules.get(ctx, domain, id)
  return _.head(await act(ctx, args))
}

async function testError (t, promise, errMsg, msg) {
  try {
    await promise
    t.fail('failed because no error thrown in testError', msg)
  } catch (err) {
    t.is(err + '', errMsg, msg)
  }
}

var assertPicoID = function (id, callback) {
  if (!ktypes.isString(id)) {
    throw new TypeError('Invalid pico_id: ' + ktypes.toString(id))
  }
  return id
}

test('engine:getPicoIDByECI', async function (t) {
  var pe = await mkTestPicoEngine({
    rootRIDs: ['io.picolabs.engine']
  })

  var tstErr = _.partial(testError, t)

  var getPicoIDByECI = await pe.modules.get({}, 'engine', 'getPicoIDByECI')
  var get = function () {
    return getPicoIDByECI({}, _.toArray(arguments))
  }

  t.is(await get('id1'), 'id0')

  await tstErr(
    get(),
    'Error: engine:getPicoIDByECI needs an eci string',
    'no eci is given'
  )
  await tstErr(
    get(null),
    'TypeError: engine:getPicoIDByECI was given null instead of an eci string',
    'wrong eci type'
  )
  t.is(await get('quux'), void 0, 'eci not found')
})

test('engine:registerRulesetFromSrc', async function (t) {
  var tstErr = _.partial(testError, t)

  var engine = kengine({
    registerRuleset: tick(function (source, a) {
      return {
        src: source,
        metaData: { meta: 'meta' }
      }
    })
  })

  t.is((await engine.def.registerRulesetFromSrc({}, {
    src: 'ruleset code'
  }))[0].src, 'ruleset code')

  t.is((await engine.def.registerRulesetFromSrc({}, {
    src: 'ruleset code',
    metaData: { meta: 'meta' }
  }))[0].src, 'ruleset code')

  t.deepEqual((await engine.def.registerRulesetFromSrc({}, {
    src: 'ruleset code',
    metaData: { meta: 'meta' }
  }))[0].metaData, { meta: 'meta' })

  await tstErr(
    engine.def.registerRulesetFromSrc({}, []),
    'TypeError: engine:registerRulesetFromSrc was given null instead of a KRL source string'
  )

  await tstErr(
    engine.def.registerRulesetFromSrc({}, [_.noop]),
    'TypeError: engine:registerRulesetFromSrc was given [Function] instead of a KRL source string',
    'wrong src type'
  )

  await tstErr(
    engine.def.registerRulesetFromSrc({}, [{}]),
    'TypeError: engine:registerRulesetFromSrc was given [Map] instead of a KRL source string',
    'wrong src type'
  )

  await tstErr(
    engine.def.registerRulesetFromSrc({}, { src: 'string', metaData: 'badMeta' }),
    'TypeError: engine:registerRulesetFromSrc was given null instead of a Map for the metaData',
    'wrong meta type'
  )
})

test('engine:registerRuleset', async function (t) {
  var tstErr = _.partial(testError, t)

  var engine = kengine({
    registerRulesetURL: tick(function (url) {
      return {
        rid: 'rid for: ' + url
      }
    })
  })

  t.is((await engine.def.registerRuleset({}, {
    url: 'http://foo.bar/qux.krl'
  }))[0], 'rid for: http://foo.bar/qux.krl')

  t.is((await engine.def.registerRuleset({}, {
    url: 'qux.krl',
    base: 'https://foo.bar/baz/'
  }))[0], 'rid for: https://foo.bar/baz/qux.krl')

  await tstErr(
    engine.def.registerRuleset({}, []),
    'Error: engine:registerRuleset needs a url string',
    'no url is given'
  )

  await tstErr(
    engine.def.registerRuleset({}, [_.noop]),
    'TypeError: engine:registerRuleset was given [Function] instead of a url string',
    'wrong url type'
  )
})

test('engine:installRuleset', async function (t) {
  var tstErr = _.partial(testError, t)

  var engine = kengine({
    installRuleset: tick(function (picoId, rid) {
    }),
    registerRulesetURL: tick(function (url) {
      return {
        rid: 'REG:' + /\/([^/]*)\.krl$/.exec(url)[1]
      }
    }),
    db: {
      assertPicoID: assertPicoID,
      findRulesetsByURL: tick(function (url) {
        if (url === 'http://foo.bar/baz/qux.krl') {
          return [{ rid: 'found' }]
        } else if (url === 'file:///too/many.krl') {
          return [{ rid: 'a' }, { rid: 'b' }, { rid: 'c' }]
        }
        return []
      })
    }
  })

  var inst = async function (id, rid, url, base) {
    var args = {}
    if (id !== void 0) {
      args.pico_id = id
    }
    if (rid !== void 0) {
      args.rid = rid
    }
    if (url !== void 0) {
      args.url = url
    }
    if (base !== void 0) {
      args.base = base
    }
    return (await engine.def.installRuleset({}, args))[0]
  }

  t.is(await inst('pico0', 'foo.bar'), 'foo.bar')
  t.deepEqual(await inst('pico0', ['foo.bar', 'foo.qux']), ['foo.bar', 'foo.qux'])
  t.deepEqual(await inst('pico0', []), [])
  t.deepEqual(await inst('pico0', void 0, 'file:///foo/bar.krl'), 'REG:bar')
  t.deepEqual(await inst('pico0', void 0, 'qux.krl', 'http://foo.bar/baz/'), 'found')

  await tstErr(
    inst('pico0', void 0, 'file:///too/many.krl'),
    'Error: More than one rid found for the given url: a , b , c',
    'too many matched'
  )
})

test('engine:uninstallRuleset', async function (t) {
  var uninstalled = {}
  var order = 0

  var engine = kengine({
    uninstallRuleset: tick(function (id, rid) {
      if (id !== 'pico0') {
        throw new Error('invalid pico_id')
      }
      if (!_.isString(rid)) {
        throw new Error('invalid rid')
      }
      _.set(uninstalled, [id, rid], order++)
    }),
    db: {
      assertPicoID: assertPicoID
    }
  })

  t.is((await engine.def.uninstallRuleset({}, {
    pico_id: 'pico0',
    rid: 'foo.bar'
  }))[0], void 0)

  t.is((await engine.def.uninstallRuleset({}, {
    pico_id: 'pico0',
    rid: ['baz', 'qux']
  }))[0], void 0)

  t.deepEqual(uninstalled, {
    pico0: {
      'foo.bar': 0,
      'baz': 1,
      'qux': 2
    }
  })
})

test('engine:unregisterRuleset', async function (t) {
  var tstErr = _.partial(testError, t)

  var log = []
  var engine = kengine({
    unregisterRuleset: tick(function (rid) {
      if (!_.isString(rid)) {
        throw new Error('invalid rid')
      }
      log.push(rid)
    })
  })

  t.is((await engine.def.unregisterRuleset({}, {
    rid: 'foo.bar'
  }))[0], void 0)

  t.is((await engine.def.unregisterRuleset({}, {
    rid: ['baz', 'qux']
  }))[0], void 0)

  await tstErr(
    engine.def.unregisterRuleset({}, []),
    'Error: engine:unregisterRuleset needs a rid string or array'
  )

  await tstErr(
    engine.def.unregisterRuleset({}, { rid: {} }),
    'TypeError: engine:unregisterRuleset was given [Map] instead of a rid string or array'
  )

  await tstErr(
    engine.def.unregisterRuleset({}, {
      rid: ['baz', 2, 'qux']
    }),
    'TypeError: engine:unregisterRuleset was given a rid array containing a non-string (2)'
  )

  t.deepEqual(log, [
    'foo.bar',
    'baz',
    'qux'
  ])
})

test('engine:describeRuleset', async function (t) {
  var pe = await mkTestPicoEngine({
    rootRIDs: ['io.picolabs.engine']
  })
  var tstErr = _.partial(testError, t)

  var ctx = {}
  var descRID = await pe.modules.get(ctx, 'engine', 'describeRuleset')

  var desc = await descRID(ctx, { rid: 'io.picolabs.hello_world' })

  var isIsoString = function (str) {
    return str === (new Date(str)).toISOString()
  }

  t.deepEqual(_.keys(desc), [
    'rid',
    'src',
    'hash',
    'url',
    'timestamp_stored',
    'timestamp_enable',
    'meta'
  ])
  t.is(desc.rid, 'io.picolabs.hello_world')
  t.truthy(_.isString(desc.src))
  t.truthy(_.isString(desc.hash))
  t.truthy(_.isString(desc.url))
  t.truthy(isIsoString(desc.timestamp_stored))
  t.truthy(isIsoString(desc.timestamp_enable))
  t.deepEqual(desc.meta, {
    name: 'Hello World',
    description: '\nA first ruleset for the Quickstart\n        ',
    author: 'Phil Windley'
  })

  await tstErr(
    descRID(ctx, []),
    'Error: engine:describeRuleset needs a rid string',
    'no rid is given'
  )
  await tstErr(
    descRID(ctx, [[]]),
    'TypeError: engine:describeRuleset was given [Array] instead of a rid string',
    'wrong rid type'
  )

  t.is(await descRID(ctx, { rid: 'not.found' }), void 0)
})

test('engine:listAllEnabledRIDs', async function (t) {
  var pe = await mkTestPicoEngine({
    rootRIDs: ['io.picolabs.engine']
  })
  var listAllEnabledRIDs = await pe.modules.get({}, 'engine', 'listAllEnabledRIDs')
  var rids = await listAllEnabledRIDs({}, [])
  t.truthy(rids.length > 1, 'should be all the test-rulesets/')
  t.truthy(_.every(rids, _.isString))
  t.truthy(_.includes(rids, 'io.picolabs.engine'))
})

test('engine:doesKRLParse', async function (t) {
  var tstErr = _.partial(testError, t)

  var engine = kengine({})

  t.is((await engine.def.doesKRLParse({}, {
    src: 'ruleset a {}'
  })).parsed, true)

  t.is((await engine.def.doesKRLParse({}, {
    src: 'ruleset a {meta{}global{}}'
  })).parsed, true)

  t.truthy((await engine.def.doesKRLParse({}, {
    src: 'ruleset a {meta{}global{}}'
  })).ast)

  t.deepEqual((await engine.def.doesKRLParse({}, {
    src: `ruleset io.picolabs.hello_world {
      meta {
          name "Hello World"
          description <<
  A first ruleset for the Quickstart
          >>
  
          author "Phil Windley"
          logging on
          shares hello
      }
      global {
          hello = function(obj){
              msg = "Hello " + obj;
              msg;
          }
      }
      rule say_hello {
          select when echo hello
  
          send_directive("say", {"something": "Hello World"});
      }
  }`
  })).parsed, true)

  t.falsy((await engine.def.doesKRLParse({}, {
    src: 'ruleset a {meta{}global{}}'
  })).errorLoc)

  t.is((await engine.def.doesKRLParse({}, {
    src: '< bad rid definition >'
  })).parsed, false)

  t.truthy((await engine.def.doesKRLParse({}, {
    src: '< bad rid definition >'
  })).errorLoc, '')

  await tstErr(
    engine.def.doesKRLParse({}, []),
    'TypeError: engine:doesKRLParse was given null instead of a KRL source string'
  )

  await tstErr(
    engine.def.doesKRLParse({}, [_.noop]),
    'TypeError: engine:doesKRLParse was given [Function] instead of a KRL source string',
    'wrong src type'
  )

  await tstErr(
    engine.def.doesKRLParse({}, [{}]),
    'TypeError: engine:doesKRLParse was given [Map] instead of a KRL source string',
    'wrong src type'
  )
})

test('engine:newPico', async function (t) {
  var pe = await mkTestPicoEngine({
    rootRIDs: ['io.picolabs.engine']
  })
  var action = function (ctx, name, args) {
    return runAction(pe, ctx, 'engine', name, args)
  }

  var pico2 = await action({}, 'newPico', {
    parent_id: 'id0'
  })
  t.deepEqual(pico2, {
    id: 'id2',
    parent_id: 'id0',
    admin_eci: 'id3'
  })

  // default to ctx.pico_id
  var pico3 = await action({
    pico_id: 'id2' // called by pico2
  }, 'newPico', {})
  t.deepEqual(pico3, {
    id: 'id4',
    parent_id: 'id2',
    admin_eci: 'id5'
  })
})

test('engine:getParent, engine:getAdminECI, engine:listChildren, engine:removePico', async function (t) {
  var tstErr = _.partial(testError, t)

  var pe = await mkTestPicoEngine({
    rootRIDs: ['io.picolabs.engine']
  })

  var newPico = function (ctx, args) {
    return runAction(pe, ctx, 'engine', 'newPico', args)
  }
  var removePico = function (ctx, args) {
    return runAction(pe, ctx, 'engine', 'removePico', args)
  }

  var getParent = await pe.modules.get({}, 'engine', 'getParent')
  var getAdminECI = await pe.modules.get({}, 'engine', 'getAdminECI')
  var listChildren = await pe.modules.get({}, 'engine', 'listChildren')

  await newPico({ pico_id: 'id0' }, [])// id2
  await newPico({}, ['id0'])// id4
  await newPico({ pico_id: 'id2' }, [])// id6

  t.is(await getParent({}, ['id0']), null)
  t.is(await getParent({}, ['id2']), 'id0')
  t.is(await getParent({}, ['id4']), 'id0')
  t.is(await getParent({}, ['id6']), 'id2')

  t.is(await getAdminECI({}, ['id0']), 'id1')
  t.is(await getAdminECI({}, ['id2']), 'id3')
  t.is(await getAdminECI({}, ['id4']), 'id5')
  t.is(await getAdminECI({}, ['id6']), 'id7')

  t.deepEqual(await listChildren({}, ['id0']), ['id2', 'id4'])
  t.deepEqual(await listChildren({}, ['id2']), ['id6'])
  t.deepEqual(await listChildren({}, ['id4']), [])
  t.deepEqual(await listChildren({}, ['id6']), [])

  // fallback on ctx.pico_id
  t.is(await getParent({ pico_id: 'id6' }, []), 'id2')
  t.is(await getAdminECI({ pico_id: 'id6' }, []), 'id7')
  t.deepEqual(await listChildren({ pico_id: 'id2' }, []), ['id6'])
  t.is(await removePico({ pico_id: 'id6' }, []), true)
  t.is(await removePico({ pico_id: 'id6' }, []), false)
  t.deepEqual(await listChildren({}, ['id2']), [])

  // report error on invalid pico_id
  var assertInvalidPicoID = function (genfn, id, expected) {
    return tstErr(genfn({ pico_id: id }, []), expected)
  }

  await assertInvalidPicoID(getParent, void 0, 'TypeError: engine:getParent was given null instead of a pico_id string')
  await assertInvalidPicoID(getAdminECI, void 0, 'TypeError: engine:getAdminECI was given null instead of a pico_id string')
  await assertInvalidPicoID(listChildren, void 0, 'TypeError: engine:listChildren was given null instead of a pico_id string')
  await assertInvalidPicoID(newPico, void 0, 'TypeError: engine:newPico was given null instead of a parent_id string')
  await assertInvalidPicoID(removePico, void 0, 'TypeError: engine:removePico was given null instead of a pico_id string')

  t.is(await getAdminECI({}, ['id404']), void 0)
  t.is(await getParent({ pico_id: 'id404' }, []), void 0)
  t.is(await listChildren({ pico_id: 'id404' }, []), void 0)
  await assertInvalidPicoID(newPico, 'id404', 'NotFoundError: Pico not found: id404')
  t.is(await removePico({}, ['id404']), false)

  await tstErr(
    removePico({}, ['id0']),
    'Error: Cannot remove pico "id0" because it has 2 children',
    "you can't remove a pico with children"
  )
})

test('engine:newPolicy, engine:listPolicies, engine:removePolicy', async function (t) {
  var tstErr = _.partial(testError, t)

  var pe = await mkTestPicoEngine({
    rootRIDs: ['io.picolabs.engine']
  })

  var newPolicy = function (policy) {
    return runAction(pe, {}, 'engine', 'newPolicy', [policy])
  }
  var listPolicies = await pe.modules.get({}, 'engine', 'listPolicies')
  var removePolicy = function (id) {
    return runAction(pe, {}, 'engine', 'removePolicy', [id])
  }

  // Making sure ChannelPolicy.clean is on
  await tstErr(newPolicy(), 'TypeError: Policy definition should be a Map, but was Null')
  await tstErr(newPolicy({ name: 1 }), 'Error: missing `policy.name`')

  var pAdmin = {
    id: ADMIN_POLICY_ID,
    name: 'admin channel policy',
    event: { allow: [{}] },
    query: { allow: [{}] }
  }

  t.deepEqual(await listPolicies(), [pAdmin])

  var pFoo = await newPolicy({ name: 'foo' })
  t.deepEqual(pFoo, {
    id: 'id2',
    name: 'foo',
    event: { deny: [], allow: [] },
    query: { deny: [], allow: [] }
  })

  t.deepEqual(await listPolicies(), [pAdmin, pFoo])

  var pBar = await newPolicy({
    name: 'bar',
    event: { allow: [{ domain: 'system' }] }
  })
  t.deepEqual(pBar, {
    id: 'id3',
    name: 'bar',
    event: { deny: [], allow: [{ domain: 'system' }] },
    query: { deny: [], allow: [] }
  })

  t.deepEqual(await listPolicies(), [pAdmin, pFoo, pBar])

  await tstErr(removePolicy(), 'TypeError: engine:removePolicy was given null instead of a policy_id string')
  t.is(await removePolicy('id404'), false)

  t.is(await removePolicy(pFoo.id), true)
  t.is(await removePolicy(pFoo.id), false)
  t.deepEqual(await listPolicies(), [pAdmin, pBar])

  await tstErr(removePolicy(pAdmin.id), 'Error: Policy ' + pAdmin.id + ' is in use, cannot remove.')

  t.is(await removePolicy(pBar.id), true)
  t.deepEqual(await listPolicies(), [pAdmin])
})

test('engine:newChannel, engine:listChannels, engine:removeChannel', async function (t) {
  var tstErr = _.partial(testError, t)

  var pe = await mkTestPicoEngine({
    rootRIDs: ['io.picolabs.engine']
  })

  var newPolicy = function (policy) {
    return runAction(pe, {}, 'engine', 'newPolicy', [policy])
  }
  var newChannel = function (ctx, args) {
    return runAction(pe, ctx, 'engine', 'newChannel', args)
  }
  var removeChannel = function (ctx, args) {
    return runAction(pe, ctx, 'engine', 'removeChannel', args)
  }
  var listChannels = await pe.modules.get({}, 'engine', 'listChannels')

  var mkChan = function (picoId, eci, name, type, policyId) {
    return {
      pico_id: picoId,
      id: eci,
      name: name,
      type: type,
      policy_id: policyId || ADMIN_POLICY_ID,
      sovrin: {
        did: eci,
        verifyKey: 'verifyKey_' + eci
      }
    }
  }

  t.deepEqual(await listChannels({}, ['id0']), [
    mkChan('id0', 'id1', 'admin', 'secret')
  ])

  t.deepEqual(await newChannel({}, ['id0', 'a', 'b']), mkChan('id0', 'id2', 'a', 'b'))
  t.deepEqual(await listChannels({}, ['id0']), [
    mkChan('id0', 'id1', 'admin', 'secret'),
    mkChan('id0', 'id2', 'a', 'b')
  ])

  await tstErr(
    newChannel({}, ['id1']),
    'Error: engine:newChannel needs a name string',
    'no name is given'
  )
  await tstErr(
    newChannel({}, ['id1', 'id1']),
    'Error: engine:newChannel needs a type string',
    'no type is given'
  )

  await tstErr(
    removeChannel({}, ['id1']),
    "Error: Cannot delete the pico's admin channel",
    "removeChannel shouldn't remove the admin channel"
  )
  await tstErr(
    removeChannel({}, []),
    'Error: engine:removeChannel needs an eci string',
    'no eci is given'
  )
  await tstErr(
    removeChannel({}, [/id1/]),
    'TypeError: engine:removeChannel was given re#id1# instead of an eci string',
    'wrong eci type'
  )
  t.is(await removeChannel({}, ['eci404']), false)

  t.is(await removeChannel({}, ['id2']), true)
  t.is(await removeChannel({}, ['id2']), false)
  t.deepEqual(await listChannels({}, ['id0']), [
    mkChan('id0', 'id1', 'admin', 'secret')
  ])

  // fallback on ctx.pico_id
  t.deepEqual(await listChannels({ pico_id: 'id0' }, []), [
    mkChan('id0', 'id1', 'admin', 'secret')
  ])
  t.deepEqual(await newChannel({ pico_id: 'id0' }, { 'name': 'a', 'type': 'b' }), mkChan('id0', 'id3', 'a', 'b'))

  // report error on invalid pico_id
  var assertInvalidPicoID = function (genfn, id, expected) {
    return tstErr(genfn({ pico_id: id }, { 'name': 'a', 'type': 'b' }), expected)
  }

  await assertInvalidPicoID(newChannel, void 0, 'TypeError: engine:newChannel was given null instead of a pico_id string')
  await assertInvalidPicoID(listChannels, void 0, 'TypeError: engine:listChannels was given null instead of a pico_id string')

  await assertInvalidPicoID(newChannel, 'id404', 'NotFoundError: Pico not found: id404')
  t.deepEqual(await listChannels({}, ['id404']), void 0)

  // setting policy_id on a newChannel
  tstErr(newChannel({}, ['id0', 'a', 'b', 100]), 'TypeError: engine:newChannel argument `policy_id` should be String but was Number')
  tstErr(newChannel({}, ['id0', 'a', 'b', 'id404']), 'NotFoundError: Policy not found: id404')

  var pFoo = await newPolicy({ name: 'foo' })
  t.deepEqual(await newChannel({}, ['id0', 'a', 'b', pFoo.id]), mkChan('id0', 'id5', 'a', 'b', pFoo.id))
})

test('engine:installRuleset, engine:listInstalledRIDs, engine:uninstallRuleset', async function (t) {
  var tstErr = _.partial(testError, t)

  var pe = await mkTestPicoEngine({
    rootRIDs: ['io.picolabs.engine']
  })

  var installRS = function (ctx, args) {
    return runAction(pe, ctx, 'engine', 'installRuleset', args)
  }
  var uninstallRID = function (ctx, args) {
    return runAction(pe, ctx, 'engine', 'uninstallRuleset', args)
  }
  var listRIDs = await pe.modules.get({}, 'engine', 'listInstalledRIDs')

  t.deepEqual(await listRIDs({ pico_id: 'id0' }, []), [
    'io.picolabs.engine'
  ])

  t.is(await installRS({}, ['id0', 'io.picolabs.hello_world']), 'io.picolabs.hello_world')
  await tstErr(
    installRS({}, [NaN]),
    'Error: engine:installRuleset needs either a rid string or array, or a url string',
    'no rid or url is given'
  )
  await tstErr(
    installRS({}, ['id0', NaN, 0]),
    'TypeError: engine:installRuleset was given null instead of a rid string or array',
    'wrong rid type'
  )
  await tstErr(
    installRS({}, ['id0', [[]]]),
    'TypeError: engine:installRuleset was given a rid array containing a non-string ([Array])',
    'rid array has a non-string'
  )
  await tstErr(
    installRS({ 'pico_id': 'id0' }, { 'url': {} }),
    'TypeError: engine:installRuleset was given [Map] instead of a url string',
    'wrong url type'
  )
  t.deepEqual(await listRIDs({ pico_id: 'id0' }, []), [
    'io.picolabs.engine',
    'io.picolabs.hello_world'
  ])

  t.is(await uninstallRID({}, ['id0', 'io.picolabs.engine']), void 0)
  await tstErr(
    uninstallRID({}, []),
    'Error: engine:uninstallRuleset needs a rid string or array',
    'no rid is given'
  )
  await tstErr(
    uninstallRID({}, ['id0', void 0]),
    'TypeError: engine:uninstallRuleset was given null instead of a rid string or array',
    'wrong rid type'
  )
  await tstErr(
    uninstallRID({}, ['id0', ['null', null]]),
    'TypeError: engine:uninstallRuleset was given a rid array containing a non-string (null)',
    'rid array has a non-string'
  )
  t.deepEqual(await listRIDs({ pico_id: 'id0' }, []), [
    'io.picolabs.hello_world'
  ])

  // fallback on ctx.pico_id
  t.is(await uninstallRID({ pico_id: 'id0' }, { rid: 'io.picolabs.hello_world' }), void 0)
  t.deepEqual(await listRIDs({ pico_id: 'id0' }, []), [])
  t.is(await installRS({ pico_id: 'id0' }, { rid: 'io.picolabs.hello_world' }), 'io.picolabs.hello_world')

  // report error on invalid pico_id
  var assertInvalidPicoID = function (genfn, id, expected) {
    return tstErr(genfn({ pico_id: id }, { rid: 'io.picolabs.hello_world' }), expected)
  }

  await assertInvalidPicoID(listRIDs, void 0, 'TypeError: engine:listInstalledRIDs was given null instead of a pico_id string')

  await assertInvalidPicoID(installRS, 'id404', 'NotFoundError: Pico not found: id404')
  await assertInvalidPicoID(uninstallRID, 'id404', 'NotFoundError: Pico not found: id404')
  t.deepEqual(await listRIDs({ pico_id: 'id404' }, []), void 0)
})

test('engine:signChannelMessage, engine:verifySignedMessage, engine:encryptChannelMessage, engine:decryptChannelMessage', async function (t) {
  var pe = await mkTestPicoEngine({
    rootRIDs: ['io.picolabs.engine'],
    __dont_use_sequential_ids_for_testing: true
  })
  var getPicoIDByECI = await pe.modules.get({}, 'engine', 'getPicoIDByECI')
  var newChannel = await pe.modules.get({}, 'engine', 'newChannel')
  var signChannelMessage = await pe.modules.get({}, 'engine', 'signChannelMessage')
  var verifySignedMessage = await pe.modules.get({}, 'engine', 'verifySignedMessage')
  var encryptChannelMessage = await pe.modules.get({}, 'engine', 'encryptChannelMessage')
  var decryptChannelMessage = await pe.modules.get({}, 'engine', 'decryptChannelMessage')
  var sign = function (eci, message) {
    return signChannelMessage({}, [eci, message])
  }
  var verify = function (verifyKey, message) {
    return verifySignedMessage({}, [verifyKey, message])
  }
  var encrypt = function (eci, message, otherPublicKey) {
    return encryptChannelMessage({}, [eci, message, otherPublicKey])
  }
  var decrypt = function (eci, encryptedMessage, nonce, otherPublicKey) {
    return decryptChannelMessage({}, [eci, encryptedMessage, nonce, otherPublicKey])
  }

  var eci = await pe.getRootECI()
  var picoId = await getPicoIDByECI({}, [eci])

  var chan0 = await newChannel({}, [picoId, 'one', 'one'])
  var eci0 = chan0[0].id
  var vkey0 = chan0[0].sovrin.verifyKey
  var publicKey0 = chan0[0].sovrin.encryptionPublicKey

  var chan1 = await newChannel({}, [picoId, 'two', 'two'])
  var eci1 = chan1[0].id
  var vkey1 = chan1[0].sovrin.verifyKey
  var publicKey1 = chan1[0].sovrin.encryptionPublicKey

  var msg = 'some long message! could be json {"hi":1}'
  var signed0 = await sign(eci0, msg)
  var signed1 = await sign(eci1, msg)
  t.truthy(_.isString(signed0))
  t.truthy(_.isString(signed1))
  t.not(signed0, signed1)

  t.is(await verify(vkey0, signed0), msg)
  t.is(await verify(vkey1, signed1), msg)

  t.is(await verify(vkey1, signed0), false, 'wrong vkey')
  t.is(await verify(vkey0, signed1), false, 'wrong vkey')

  t.is(await verify('hi', signed1), false, 'rubbish vkey')
  t.is(await verify(vkey0, 'notbs58:%=+!'), false, 'not bs58 message')

  var encrypted0 = await encrypt(eci0, msg, publicKey1)
  var encrypted1 = await encrypt(eci1, msg, publicKey0)

  t.truthy(_.isString(encrypted0.encryptedMessage))
  t.truthy(_.isString(encrypted0.nonce))
  t.truthy(_.isString(encrypted1.encryptedMessage))
  t.truthy(_.isString(encrypted1.nonce))
  t.not(encrypted0, encrypted1)

  var nonce = encrypted0.nonce
  var encryptedMessage = encrypted0.encryptedMessage

  t.is(await decrypt(eci1, encryptedMessage, nonce, publicKey0), msg, 'message decrypted correctly')

  t.is(await decrypt(eci1, encryptedMessage, 'bad nonce', publicKey0), false, 'bad nonce')
  t.is(await decrypt(eci1, encryptedMessage, nonce, 'Bad public key'), false, 'bad key')
  t.is(await decrypt(eci1, 'bogus43212(*(****', nonce, publicKey0), false, 'non bs58 message')
})

test('engine:exportPico', async function (t) {
  var krl = `ruleset rid.export {
    rule sum {
      select when repeat 3 (
        aa sum n re#(\\d+)#
      ) sum(n)
      send_directive("sum", {"n": n});
    }
    rule setvars {
      select when aa setvars
      always {
        ent:one := 1;
        ent:arr := [2, {"three": 3}];
        ent:map := {"a": [2, 3], "b": {"c": {"d": 1}}};
        ent:foo := {}
      }
    }
    rule newPico {
      select when aa newPico
      engine:newPico()
    }
  }`
  var pe = await mkTestPicoEngine({
    compileAndLoadRuleset: 'inline',
    rootRIDs: ['rid.export'],
    systemRulesets: [{
      src: krl,
      meta: { url: 'wat' }
    }]
  })

  var rootEci = await pe.getRootECI()
  var getPicoIDByECI = await pe.modules.get({}, 'engine', 'getPicoIDByECI')
  var rootPicoId = await getPicoIDByECI({}, [rootEci])

  function signalEvent (eci, dt, attrs) {
    return pe.signalEvent({
      eci: eci,
      domain: dt.split('/')[0],
      type: dt.split('/')[1],
      attrs: attrs
    })
  }

  await signalEvent(rootEci, 'aa/sum', { n: 1 })
  await signalEvent(rootEci, 'aa/sum', { n: 3 })
  await signalEvent(rootEci, 'aa/setvars')
  await signalEvent(rootEci, 'aa/newPico')

  var exportPico = await pe.modules.get({}, 'engine', 'exportPico')

  var exported = await exportPico({}, [rootPicoId])
  _.each(exported.rulesets, function (r) {
    delete r.timestamp_stored
    delete r.timestamp_enable
  })
  t.deepEqual(exported, {
    version: require('../../package.json').version,
    policies: {
      'allow-all-policy': {
        name: 'admin channel policy',
        event: { allow: [{}] },
        query: { allow: [{}] }
      }
    },
    rulesets: {
      'rid.export': {
        src: krl,
        hash: '6233907ebe1c7d7c8d83a3537525be8f5a1387f35989d0e6e073cd5f67bb0fca',
        rid: 'rid.export',
        url: 'wat'
      }
    },
    pico: {
      id: 'id0',
      parent_id: null,
      admin_eci: 'id1',
      channels: {
        'id1': { id: 'id1', name: 'admin', type: 'secret', policy_id: 'allow-all-policy', sovrin: { did: 'id1', verifyKey: 'verifyKey_id1', secret: { seed: 'seed_id1', signKey: 'signKey_id1' } } }
      },
      rulesets: [
        'rid.export'
      ],
      entvars: {
        'rid.export': {
          one: 1,
          arr: [2, { three: 3 }],
          map: { a: [2, 3], b: { c: { d: 1 } } },
          foo: {}
        }
      },
      state_machine: {
        'rid.export': {
          newPico: { state: 'end', bindings: {} },
          setvars: { state: 'end', bindings: {} },
          sum: { state: 's1', bindings: {} }
        }
      },
      aggregator_var: {
        'rid.export': { sum: { n: ['1', '3'] } }
      },
      children: [
        {
          id: 'id2',
          parent_id: 'id0',
          admin_eci: 'id3',
          channels: {
            'id3': { id: 'id3', name: 'admin', type: 'secret', policy_id: 'allow-all-policy', sovrin: { did: 'id3', verifyKey: 'verifyKey_id3', secret: { seed: 'seed_id3', signKey: 'signKey_id3' } } }
          },
          rulesets: [],
          children: []
        }
      ]
    }
  })
  // TODO scheduled events?
})

test('engine:importPico', async function (t) {
  var krl = `ruleset rid.export {
    rule asdf {
      select when asdf asdf
    }
  }`
  var pe = await mkTestPicoEngine({
    compileAndLoadRuleset: 'inline',
    rootRIDs: ['rid.export'],
    systemRulesets: [{
      src: krl,
      meta: { url: 'wat' }
    }]
  })

  var rootEci = await pe.getRootECI()
  var getPicoIDByECI = await pe.modules.get({}, 'engine', 'getPicoIDByECI')
  var rootPicoId = await getPicoIDByECI({}, [rootEci])

  var importPicoAction = await pe.modules.get({}, 'engine', 'importPico')
  var importPico = function () {
    return importPicoAction.apply(null, arguments).then(_.head)
  }
  var listPolicies = await pe.modules.get({}, 'engine', 'listPolicies')
  var getAdminECI = await pe.modules.get({}, 'engine', 'getAdminECI')
  var listChannels = await pe.modules.get({}, 'engine', 'listChannels')
  var listChildren = await pe.modules.get({}, 'engine', 'listChildren')
  var listInstalledRIDs = await pe.modules.get({}, 'engine', 'listInstalledRIDs')
  var listAllEnabledRIDs = await pe.modules.get({}, 'engine', 'listAllEnabledRIDs')

  function imp (data) {
    return importPico({}, [rootPicoId, data])
      .catch(function (err) {
        return '' + err
      })
  }

  // for now, only the exact version will let you import/export
  t.is(await imp(), 'Error: importPico incompatible version')
  t.is(await imp({ version: '?' }), 'Error: importPico incompatible version')

  // import policies, re-use existing when possible
  t.deepEqual(_.map(await listPolicies(), 'id'), ['allow-all-policy'])
  t.is(await imp({
    version: engineCoreVersion,
    policies: {
      'allow-all-policy': {
        name: 'admin channel policy',
        event: { allow: [{}] },
        query: { allow: [{}] }
      }
    }
  }), null)

  // changed, even with the same id, should create a new policy
  t.is(await imp({
    version: engineCoreVersion,
    policies: {
      'allow-all-policy': {
        name: 'admin channel policy CHANGED',
        event: { allow: [{ domain: 'CHANGED' }] },
        query: { allow: [{}] }
      }
    }
  }), null)
  t.deepEqual(_.map(await listPolicies(), 'id'), ['allow-all-policy', 'id2'])

  t.is(await imp({
    version: engineCoreVersion,
    rulesets: {
      'rid.export': {
        src: 'ruleset rid.export {rule newVersion{select when a b}}',
        hash: 'some-new-hash',
        url: 'wat'
      }
    }
  }), 'Error: Cannot import pico. This engine has a different version of rid.export enabled.')

  t.deepEqual(await listAllEnabledRIDs(), ['rid.export'])
  t.is(await imp({
    version: engineCoreVersion,
    rulesets: {
      'some.new.rid': {
        src: 'ruleset some.new.rid {rule hi{select when hi hi}}',
        hash: 'some-hash',
        url: 'wat'
      }
    }
  }), null)
  t.deepEqual(await listAllEnabledRIDs(), ['rid.export', 'some.new.rid'])

  t.is(await imp({
    version: engineCoreVersion,
    pico: {
      id: 'will-be-changed',
      parent_id: 'will-be-stomped-over',
      admin_eci: 'fooId',
      channels: {
        'fooId': { id: 'fooId', name: 'admin', type: 'secret', policy_id: 'allow-all-policy', sovrin: { did: 'fooId', verifyKey: 'verifyKey_id1', secret: { seed: 'seed_id1', signKey: 'signKey_id1' } } }
      },
      rulesets: ['rid.export'],
      entvars: {
        'rid.export': {
          one: 1,
          arr: [2, { three: 3 }],
          map: { a: [2, 3], b: { c: { d: 1 } } },
          foo: {}
        }
      },
      state_machine: {
        'rid.export': {
          newPico: { state: 'end', bindings: {} },
          setvars: { state: 'end', bindings: {} },
          sum: { state: 's1', bindings: {} }
        }
      },
      aggregator_var: {
        'rid.export': { sum: { n: ['1', '3'] } }
      },
      children: []
    }
  }), 'id3')
  t.deepEqual(_.map(await listChannels({}, ['id3']), 'id'), ['fooId'])
  t.deepEqual(await listInstalledRIDs({}, ['id3']), ['rid.export'])

  t.is(await imp({
    version: engineCoreVersion,
    pico: {}
  }), 'id4', 'minimal import')
  // create an admin eci if one is not given
  t.is(await getAdminECI({}, ['id4']), 'id5')
  t.deepEqual(_.map(await listChannels({}, ['id4']), 'id'), ['id5'])
  t.deepEqual(_.map(await listChannels({}, ['id4']), 'name'), ['admin'])
  t.deepEqual(await listChildren({}, ['id4']), [])

  t.is(await imp({
    version: engineCoreVersion,
    pico: {
      id: 'will-be-changed',
      children: [
        { id: 'one' },
        {
          id: 'two',
          children: [
            { id: 'two-one' }
          ]
        },
        { id: 'three' }
      ]
    }
  }), 'id6', 'minimal import')
  t.deepEqual(_.map(await listChannels({}, ['id6']), 'id'), ['id7'])
  t.deepEqual(await listChildren({}, ['id6']), ['id10', 'id12', 'id8'])
  t.deepEqual(await listChildren({}, ['id8']), [], 'child "one" has 0')
  t.deepEqual(await listChildren({}, ['id10']), ['id14'], 'child "two" has 1')
  t.deepEqual(await listChildren({}, ['id12']), [], 'child "three" has 0')

  // import a pico with a new ruleset,
  // then ensure it's properly initialized to receive events
  t.is(await imp({
    version: engineCoreVersion,
    rulesets: {
      'say.hello.rid': {
        src: `ruleset say.hello.rid {
          rule hi{
            select when say hello
            send_directive("i say hello")
          }
        }`,
        hash: 'some-hash',
        url: 'whatever'
      }
    },
    pico: {
      rulesets: ['say.hello.rid']
    }
  }), 'id16', 'minimal import')

  t.is(await getAdminECI({}, ['id16']), 'id17')
  let resp = await pe.signalEvent({ eci: 'id17', domain: 'say', type: 'hello' })
  t.deepEqual(resp.directives[0].name, 'i say hello')
})

test('engine:setPicoStatus engine:getPicoStatus', async function (t) {
  var krl = `ruleset rid.status {
    rule setLeaving {
      select when aa setLeaving
      engine:setPicoStatus(isLeaving = true)
    }
    rule setMoving {
      select when aa setMoving
      engine:setPicoStatus(movedToHost = "http://away")
    }
    rule getStatus {
      select when aa getStatus
      send_directive("", engine:getPicoStatus())
    }
  }`
  var pe = await mkTestPicoEngine({
    compileAndLoadRuleset: 'inline',
    rootRIDs: ['rid.status'],
    systemRulesets: [{
      src: krl,
      meta: { url: 'wat' }
    }]
  })
  pe.emitter.on('error', _.noop)

  var rootEci = await pe.getRootECI()
  var getPicoIDByECI = await pe.modules.get({}, 'engine', 'getPicoIDByECI')
  var rootPicoId = await getPicoIDByECI({}, [rootEci])
  var getStatus = await pe.modules.get({}, 'engine', 'getPicoStatus')
  var setStatus = await pe.modules.get({}, 'engine', 'setPicoStatus')

  var c1 = await runAction(pe, {}, 'engine', 'newPico', [rootPicoId])
  var c1c1 = await runAction(pe, {}, 'engine', 'newPico', [c1.id])
  var c1c2 = await runAction(pe, {}, 'engine', 'newPico', [c1.id])

  function signalEvent (eci, dt, attrs) {
    return pe.signalEvent({
      eci: eci,
      domain: dt.split('/')[0],
      type: dt.split('/')[1],
      attrs: attrs
    })
  }

  var resp = await signalEvent(rootEci, 'aa/getStatus')
  t.deepEqual(resp.directives[0].options, { isLeaving: false, movedToHost: null })
  t.deepEqual(await getStatus({}, [c1.id]), { isLeaving: false, movedToHost: null })
  t.deepEqual(await getStatus({}, [c1c1.id]), { isLeaving: false, movedToHost: null })
  t.deepEqual(await getStatus({}, [c1c2.id]), { isLeaving: false, movedToHost: null })

  await signalEvent(rootEci, 'aa/setLeaving')
  try {
    await signalEvent(rootEci, 'aa/getStatus')
    t.fail(true, 'should fail b/c the pico is leaving')
  } catch (err) {
    t.is(err.picoCore_pico_isLeaving, true)
  }
  t.deepEqual(await getStatus({}, [rootPicoId]), { isLeaving: true, movedToHost: null })
  t.deepEqual(await getStatus({}, [c1.id]), { isLeaving: true, movedToHost: null })
  t.deepEqual(await getStatus({}, [c1c1.id]), { isLeaving: true, movedToHost: null })
  t.deepEqual(await getStatus({}, [c1c2.id]), { isLeaving: true, movedToHost: null })

  await setStatus({}, [rootPicoId, false])

  await signalEvent(rootEci, 'aa/setMoving')
  try {
    await signalEvent(rootEci, 'aa/getStatus')
    t.fail(true, 'should fail b/c the pico is moving')
  } catch (err) {
    t.is(err.picoCore_pico_movedToHost, 'http://away')
  }
  t.deepEqual(await getStatus({}, [rootPicoId]), { isLeaving: false, movedToHost: 'http://away' })
  t.deepEqual(await getStatus({}, [c1.id]), { isLeaving: false, movedToHost: 'http://away' })
  t.deepEqual(await getStatus({}, [c1c1.id]), { isLeaving: false, movedToHost: 'http://away' })
  t.deepEqual(await getStatus({}, [c1c2.id]), { isLeaving: false, movedToHost: 'http://away' })

  // You can't change a childs status if the parent is transient
  try {
    await setStatus({}, [c1c1.id, true, 'http://haha'])
    t.fail(true, 'should fail b/c the parent is moving')
  } catch (e) {
    t.is(e + '', 'Error: Cannot change pico status b/c its parent is transient')
  }
  t.deepEqual(await getStatus({}, [c1c1.id]), { isLeaving: false, movedToHost: 'http://away' })

  // Clear the status on root and it's children
  await setStatus({}, [rootPicoId, false, null])
  resp = await signalEvent(rootEci, 'aa/getStatus')
  t.deepEqual(resp.directives[0].options, { isLeaving: false, movedToHost: null })
  t.deepEqual(await getStatus({}, [rootPicoId]), { isLeaving: false, movedToHost: null })
  t.deepEqual(await getStatus({}, [c1.id]), { isLeaving: false, movedToHost: null })
  t.deepEqual(await getStatus({}, [c1c1.id]), { isLeaving: false, movedToHost: null })
  t.deepEqual(await getStatus({}, [c1c2.id]), { isLeaving: false, movedToHost: null })

  // Set a single pico's status and ensure it's parents/siblings are not effected
  await setStatus({}, [c1c1.id, true])
  t.deepEqual(await getStatus({}, [rootPicoId]), { isLeaving: false, movedToHost: null })
  t.deepEqual(await getStatus({}, [c1.id]), { isLeaving: false, movedToHost: null })
  t.deepEqual(await getStatus({}, [c1c1.id]), { isLeaving: true, movedToHost: null })
  t.deepEqual(await getStatus({}, [c1c2.id]), { isLeaving: false, movedToHost: null })
  await setStatus({}, [rootPicoId, false, null])
  resp = await signalEvent(rootEci, 'aa/getStatus')
  t.deepEqual(resp.directives[0].options, { isLeaving: false, movedToHost: null })
})
