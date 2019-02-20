var _ = require('lodash')
var DB = require('../src/DB')
var cuid = require('cuid')
var test = require('ava')
var ktypes = require('krl-stdlib/types')
var memdown = require('memdown')
var migrations = require('../src/migrations')
var ADMIN_POLICY_ID = DB.ADMIN_POLICY_ID

var mkTestDB = function () {
  return DB({
    db: memdown(cuid()),
    __use_sequential_ids_for_testing: true,
    __expose_ldb_for_testing: true
  })
}

test('DB - write and read', async function (t) {
  var db = mkTestDB()

  t.deepEqual(await db.toObj(), {})

  await db.newPico({})

  await db.addRulesetToPico('id0', 'rs0')
  await db.newChannel({ pico_id: 'id0', name: 'two', type: 't', policy_id: ADMIN_POLICY_ID })
  await db.newPico({ parent_id: 'id0' })

  t.deepEqual(await db.toObj(), {
    channel: {
      id1: {
        pico_id: 'id0',
        id: 'id1',
        name: 'admin',
        type: 'secret',
        policy_id: ADMIN_POLICY_ID,
        sovrin: {
          did: 'id1',
          verifyKey: 'verifyKey_id1'
        }
      },
      id2: {
        pico_id: 'id0',
        id: 'id2',
        name: 'two',
        type: 't',
        policy_id: ADMIN_POLICY_ID,
        sovrin: {
          did: 'id2',
          verifyKey: 'verifyKey_id2'
        }
      },
      id4: {
        pico_id: 'id3',
        id: 'id4',
        name: 'admin',
        type: 'secret',
        policy_id: ADMIN_POLICY_ID,
        sovrin: {
          did: 'id4',
          verifyKey: 'verifyKey_id4'
        }
      }
    },
    pico: {
      'id0': {
        id: 'id0',
        parent_id: null,
        admin_eci: 'id1'
      },
      'id3': {
        id: 'id3',
        parent_id: 'id0',
        admin_eci: 'id4'
      }
    },
    'pico-ruleset': { 'id0': { 'rs0': { on: true } } },
    'ruleset-pico': { 'rs0': { 'id0': { on: true } } },
    'pico-children': { 'id0': { 'id3': true } },
    'pico-eci-list': {
      'id0': {
        'id1': true,
        'id2': true
      },
      'id3': {
        'id4': true
      }
    },
    'root_pico': {
      id: 'id0',
      parent_id: null,
      admin_eci: 'id1'
    }
  })

  await db.removePico('id0')
  await db.removePico('id3')

  t.deepEqual(await db.toObj(), {})
})

test('DB - storeRuleset', async function (t) {
  var db = mkTestDB()

  var krlSrc = 'ruleset io.picolabs.cool {}'
  var rid = 'io.picolabs.cool'
  var hash = '7d71c05bc934b0d41fdd2055c7644fc4d0d3eabf303d67fb97f604eaab2c0aa1'
  var timestamp = (new Date()).toISOString()
  var url = 'Some-URL-to-src '

  var expected = {}
  _.set(expected, ['rulesets', 'krl', hash], {
    src: krlSrc,
    rid: rid,
    url: url,
    timestamp: timestamp
  })
  _.set(expected, ['rulesets', 'versions', rid, timestamp, hash], true)
  _.set(expected, ['rulesets', 'url', url.toLowerCase().trim(), rid, hash], true)

  t.deepEqual(await db.toObj(), {})

  t.deepEqual(await db.storeRuleset(krlSrc, {
    url: url
  }, timestamp), { rid: rid, hash: hash })

  t.deepEqual(await db.findRulesetsByURL(url), [{
    rid: rid,
    hash: hash
  }])
  t.deepEqual(await db.toObj(), expected)
})

test('DB - enableRuleset', async function (t) {
  var db = mkTestDB()

  var krlSrc = 'ruleset io.picolabs.cool {}'

  t.deepEqual(_.omit(await db.toObj(), 'rulesets'), {})

  let data = await db.storeRuleset(krlSrc, {})
  let hash = data.hash
  await db.enableRuleset(hash)
  let dbJson = await db.toObj()
  t.deepEqual(_.get(dbJson, [
    'rulesets',
    'enabled',
    'io.picolabs.cool',
    'hash'
  ]), hash)

  data = await db.getEnabledRuleset('io.picolabs.cool')
  t.is(data.src, krlSrc)
  t.is(data.hash, hash)
  t.is(data.rid, 'io.picolabs.cool')
  t.is(data.timestamp_enable, _.get(dbJson, [
    'rulesets',
    'enabled',
    'io.picolabs.cool',
    'timestamp'
  ]))
})

test("DB - read keys that don't exist", async function (t) {
  var db = mkTestDB()

  var ent = await db.getEntVar('pico0', 'rid0', "var that doesn't exisit", null)
  t.is(ent, undefined)

  var app = await db.getAppVar('rid0', "var that doesn't exisit", null)
  t.is(app, undefined)
})

test('DB - getRootPico', async function (t) {
  var db = mkTestDB()

  let err = await t.throwsAsync(db.getRootPico())
  t.truthy(err.notFound)

  await db.newChannel({ pico_id: 'foo', name: 'bar', type: 'baz' })
  await db.newPico({})

  let rPico = await db.getRootPico()
  t.deepEqual(rPico, { id: 'id1', parent_id: null, admin_eci: 'id2' })

  await db.newPico({ parent_id: 'id1' })

  rPico = await db.getRootPico()
  t.deepEqual(rPico, { id: 'id1', parent_id: null, admin_eci: 'id2' })

  await db.newPico({ parent_id: null })

  rPico = await db.getRootPico()
  t.deepEqual(rPico, { id: 'id5', parent_id: null, admin_eci: 'id6' })
})

test('DB - isRulesetUsed', async function (t) {
  var db = mkTestDB()

  await db.newPico({})
  await db.newPico({})

  await db.addRulesetToPico('id0', 'rs-foo')
  await db.addRulesetToPico('id1', 'rs-foo')
  await db.addRulesetToPico('id0', 'rs-bar')

  t.is(await db.isRulesetUsed('rs-foo'), true)
  t.is(await db.isRulesetUsed('rs-bar'), true)
  t.is(await db.isRulesetUsed('rs-baz'), false)
  t.is(await db.isRulesetUsed('rs-qux'), false)
})

test('DB - deleteRuleset', async function (t) {
  var db = mkTestDB()

  var storeRuleset = async function (name) {
    var rid = 'io.picolabs.' + name
    var krl = 'ruleset ' + rid + ' {}'
    let data = await db.storeRuleset(krl, {
      url: 'file:///' + name + '.krl'
    })
    await db.enableRuleset(data.hash)
    await db.putAppVar(rid, 'my_var', null, 'appvar value')
    return data.hash
  }

  let storeFoo = await storeRuleset('foo')
  await storeRuleset('bar')

  let initDb = await db.toObj()

  await db.deleteRuleset('io.picolabs.foo')

  let endDb = await db.toObj()

  t.deepEqual(_.keys(initDb.rulesets.versions), [
    'io.picolabs.bar',
    'io.picolabs.foo'
  ], 'ensure all were actually stored in the db')

  t.deepEqual(_.keys(endDb.rulesets.versions), [
    'io.picolabs.bar'
  ], 'ensure io.picolabs.foo was removed')

  // make the `initDb` look like the expected `endDb`
  var expectedDb = _.cloneDeep(initDb)
  t.deepEqual(expectedDb, initDb, 'sanity check')

  delete expectedDb.rulesets.enabled['io.picolabs.foo']
  delete expectedDb.rulesets.krl[storeFoo]
  delete expectedDb.rulesets.url['file:///foo.krl']
  delete expectedDb.rulesets.versions['io.picolabs.foo']
  delete expectedDb.appvars['io.picolabs.foo']

  t.notDeepEqual(expectedDb, initDb, 'sanity check')
  t.deepEqual(endDb, expectedDb)
})

test('DB - scheduleEventAt', async function (t) {
  var db = mkTestDB()

  var eventAt = function (date, type) {
    return db.scheduleEventAt(new Date(date), {
      domain: 'foobar',
      type: type,
      attributes: { some: 'attr' }
    })
  }
  var rmAt = function (id) {
    return db.removeScheduled(id)
  }

  var getNext = db.nextScheduleEventAt

  t.deepEqual(await db.toObj(), {})
  t.deepEqual(await getNext(), void 0, 'nothing scheduled')

  let at0 = await eventAt('Feb 22, 2222', 'foo')
  let next1 = await getNext()

  let at1 = await eventAt('Feb 23, 2222', 'bar')
  let next2 = await getNext()
  let at2 = await eventAt('Feb  2, 2222', 'baz')
  let next3 = await getNext()

  let list = await db.listScheduled()

  await rmAt('id0')
  let next4 = await getNext()
  await rmAt('id2')
  let next5 = await getNext()
  await rmAt('id1')
  let next6 = await getNext()

  t.deepEqual(at0, {
    id: 'id0',
    at: new Date('Feb 22, 2222'),
    event: { domain: 'foobar', type: 'foo', attributes: { some: 'attr' } }
  })
  t.deepEqual(at1, {
    id: 'id1',
    at: new Date('Feb 23, 2222'),
    event: { domain: 'foobar', type: 'bar', attributes: { some: 'attr' } }
  })
  t.deepEqual(at2, {
    id: 'id2',
    at: new Date('Feb  2, 2222'),
    event: { domain: 'foobar', type: 'baz', attributes: { some: 'attr' } }
  })

  t.deepEqual(list, [
    at2,
    at0,
    at1
  ].map(function (val) {
    return _.assign({}, val, {
      at: val.at.toISOString()
    })
  }))

  t.deepEqual(next1, at0, 'only one scheduled')
  t.deepEqual(next2, at0, 'at0 is still sooner than at1')
  t.deepEqual(next3, at2, 'at2 is sooner than at0')
  t.deepEqual(next4, at2)
  t.deepEqual(next5, at1, 'at1 is soonest now that at0 and at2 were removed')
  t.deepEqual(next6, void 0, 'nothing scheduled')

  t.deepEqual(await db.toObj(), {}, 'should be nothing left in the db')
})

test('DB - scheduleEventRepeat', async function (t) {
  var db = mkTestDB()

  var eventRep = function (timespec, type) {
    return db.scheduleEventRepeat(timespec, {
      domain: 'foobar',
      type: type,
      attributes: { some: 'attr' }
    })
  }

  t.deepEqual(await db.toObj(), {})

  let rep0 = await eventRep('*/5 * * * * *', 'foo')
  t.deepEqual(rep0, {
    id: 'id0',
    timespec: '*/5 * * * * *',
    event: { domain: 'foobar', type: 'foo', attributes: { some: 'attr' } }
  })
  let rep1 = await eventRep('* */5 * * * *', 'bar')
  t.deepEqual(rep1, {
    id: 'id1',
    timespec: '* */5 * * * *',
    event: { domain: 'foobar', type: 'bar', attributes: { some: 'attr' } }
  })

  t.deepEqual(await db.toObj(), { scheduled: {
    id0: rep0,
    id1: rep1
  } })

  t.deepEqual(await db.listScheduled(), [
    rep0,
    rep1
  ])

  await db.removeScheduled('id0')
  await db.removeScheduled('id1')

  t.deepEqual(await db.toObj(), {}, 'should be nothing left in the db')
})

test('DB - removeRulesetFromPico', async function (t) {
  var db = mkTestDB()

  await db.addRulesetToPico('pico0', 'rid0')
  await db.putEntVar('pico0', 'rid0', 'foo', null, 'val0')
  await db.putEntVar('pico0', 'rid0', 'bar', null, 'val1')

  t.deepEqual(await db.toObj(), {
    entvars: { pico0: { rid0: {
      foo: { type: 'String', value: 'val0' },
      bar: { type: 'String', value: 'val1' }
    } } },
    'pico-ruleset': { 'pico0': { 'rid0': { on: true } } },
    'ruleset-pico': { 'rid0': { 'pico0': { on: true } } }
  })

  await db.removeRulesetFromPico('pico0', 'rid0')

  t.deepEqual(await db.toObj(), {}, 'should all be gone')
})

test('DB - getPicoIDByECI', async function (t) {
  var db = mkTestDB()

  await db.newPico({})
  await db.newPico({})

  await db.newChannel({ pico_id: 'id0', name: 'four', type: 't' })
  await db.newChannel({ pico_id: 'id2', name: 'five', type: 't' })

  t.is(await db.getPicoIDByECI('id1'), 'id0')
  t.is(await db.getPicoIDByECI('id3'), 'id2')
  t.is(await db.getPicoIDByECI('id4'), 'id0')
  t.is(await db.getPicoIDByECI('id5'), 'id2')

  let err = await t.throwsAsync(db.getPicoIDByECI('bad-id'))
  t.truthy((err && err.notFound) === true)
})

test('DB - listChannels', async function (t) {
  var db = mkTestDB()

  await db.newPico({})
  await db.newPico({})

  let c4p0 = await db.newChannel({ pico_id: 'id0', name: 'four', type: 't4', policy_id: ADMIN_POLICY_ID })
  let c5p1 = await db.newChannel({ pico_id: 'id2', name: 'five', type: 't5', policy_id: ADMIN_POLICY_ID })

  let list0 = await db.listChannels('id0')
  let list2 = await db.listChannels('id2')
  let list404 = await db.listChannels('id404')

  var mkChan = function (picoId, eci, name, type) {
    return {
      pico_id: picoId,
      id: eci,
      name: name,
      type: type,
      policy_id: ADMIN_POLICY_ID,
      sovrin: {
        did: eci,
        verifyKey: 'verifyKey_' + eci
      }
    }
  }

  var c1 = mkChan('id0', 'id1', 'admin', 'secret')
  var c3 = mkChan('id2', 'id3', 'admin', 'secret')
  var c4 = mkChan('id0', 'id4', 'four', 't4')
  var c5 = mkChan('id2', 'id5', 'five', 't5')

  t.deepEqual(c4p0, c4)
  t.deepEqual(c5p1, c5)

  t.deepEqual(list0, [c1, c4])
  t.deepEqual(list2, [c3, c5])
  t.deepEqual(list404, [])
})

test('DB - listAllEnabledRIDs', async function (t) {
  var db = mkTestDB()

  var hashes = {}
  var store = async function (rid) {
    let data = await db.storeRuleset('ruleset ' + rid + '{}', {})
    hashes[rid] = data.hash
  }

  var enable = function (rid) {
    return db.enableRuleset(hashes[rid])
  }

  t.deepEqual(await db.listAllEnabledRIDs(), [])

  await store('foo')
  await store('bar')
  await store('baz')
  t.deepEqual(await db.listAllEnabledRIDs(), [])

  await enable('foo')
  t.deepEqual(await db.listAllEnabledRIDs(), ['foo'])

  await enable('bar')
  await enable('baz')
  t.deepEqual(await db.listAllEnabledRIDs(), ['bar', 'baz', 'foo'])

  await db.disableRuleset('foo')
  t.deepEqual(await db.listAllEnabledRIDs(), ['bar', 'baz'])
})

test('DB - migrations', async function (t) {
  let db = mkTestDB()

  let log = await db.getMigrationLog()
  t.deepEqual(log, {})

  await db.recordMigration('v1')

  log = await db.getMigrationLog()
  t.deepEqual(_.keys(log), ['v1'])
  t.deepEqual(_.keys(log['v1']), ['timestamp'])
  t.is(log['v1'].timestamp, (new Date(log['v1'].timestamp)).toISOString())

  await db.recordMigration('v200')

  log = await db.getMigrationLog()
  t.deepEqual(_.keys(log), ['v1', 'v200'])

  await db.removeMigration('v200')

  log = await db.getMigrationLog()
  t.deepEqual(_.keys(log), ['v1'])

  await db.removeMigration('v1')

  log = await db.getMigrationLog()
  t.deepEqual(log, {})

  await db.checkAndRunMigrations()
  log = await db.getMigrationLog()
  t.deepEqual(_.keys(log), _.keys(migrations))
})

test('DB - parent/child', async function (t) {
  var db = mkTestDB()

  var assertParent = async function (picoId, expectedParentId) {
    let parentId = await db.getParent(picoId)
    t.is(parentId, expectedParentId, 'testing db.getParent')
  }

  var assertChildren = async function (picoId, expectedChildrenIds) {
    let list = await db.listChildren(picoId)
    t.deepEqual(list, expectedChildrenIds, 'testing db.listChildren')
  }

  await db.newPico({}) // id0 and channel id1
  await db.newPico({ parent_id: 'id0' }) // id2 + id3
  await db.newPico({ parent_id: 'id0' }) // id4 + id5
  await db.newPico({ parent_id: 'id0' }) // id6 + id7

  await db.newPico({ parent_id: 'id6' }) // id8 + id9
  await db.newPico({ parent_id: 'id6' }) // id10 + id11

  await assertParent('id0', null)
  await assertParent('id2', 'id0')
  await assertParent('id4', 'id0')
  await assertParent('id6', 'id0')
  await assertParent('id8', 'id6')
  await assertParent('id10', 'id6')

  await assertChildren('id0', ['id2', 'id4', 'id6'])
  await assertChildren('id2', [])
  await assertChildren('id4', [])
  await assertChildren('id6', ['id10', 'id8'])
  await assertChildren('id8', [])
  await assertChildren('id10', [])

  await db.removePico('id8')
  await assertChildren('id6', ['id10'])

  await db.removePico('id6')
  await assertChildren('id6', [])
})

test('DB - assertPicoID', async function (t) {
  var db = mkTestDB()

  var tstPID = async function (id, expectedIt) {
    let gotId, err
    try {
      gotId = await db.assertPicoID(id)
    } catch (e) {
      err = e
    }
    if (expectedIt) {
      t.falsy(err)
      t.is(gotId, id)
    } else {
      t.truthy(err)
      t.falsy(gotId)
    }
  }

  await db.newPico({})

  await tstPID(null, false)
  await tstPID(void 0, false)
  await tstPID({}, false)
  await tstPID(0, false)

  await tstPID('id0', true)
  await tstPID('id2', false)
})

test('DB - removeChannel', async function (t) {
  var db = mkTestDB()

  var assertECIs = async function (picoId, expectedEcis) {
    var chans = await db.listChannels(picoId)

    var eciList = _.map(chans, 'id')
    t.deepEqual(eciList, expectedEcis, 'assert the listChannels')
    t.deepEqual(_.uniq(_.map(chans, 'pico_id')), [picoId], 'assert listChannels all come from the same pico_id')
  }

  var assertFailRemoveECI = async function (eci) {
    try {
      await db.removeChannel(eci)
      t.fail('Should error')
    } catch (err) {
      t.is(err + '', "Error: Cannot delete the pico's admin channel")
    }
  }

  await db.newPico({})
  await assertECIs('id0', ['id1'])

  await db.newChannel({ pico_id: 'id0', name: 'two', type: 't' })
  await assertECIs('id0', ['id1', 'id2'])

  await assertFailRemoveECI('id1')
  await assertECIs('id0', ['id1', 'id2'])

  await db.removeChannel('id2')
  await assertECIs('id0', ['id1'])

  await assertFailRemoveECI('id1')
  await assertECIs('id0', ['id1'])

  await db.newPico({ parent_id: 'id0' })
  await assertECIs('id3', ['id4'])

  await assertFailRemoveECI('id4')
  await assertECIs('id3', ['id4'])
})

test('DB - persistent variables', async function (t) {
  var db = mkTestDB()

  var put = _.partial(db.putEntVar, 'p', 'r')
  var get = _.partial(db.getEntVar, 'p', 'r')
  var del = _.partial(db.delEntVar, 'p', 'r')
  var toObj = db.toObj

  var data

  await put('foo', null, [1, 2])
  data = await get('foo', null)
  t.deepEqual(data, [1, 2])
  t.truthy(ktypes.isArray(data))

  await put('foo', null, { a: 3, b: 4 })
  data = await get('foo', null)
  t.deepEqual(data, { a: 3, b: 4 })
  t.truthy(ktypes.isMap(data))

  await del('foo', null)
  data = await get('foo', null)
  t.deepEqual(data, void 0)

  await put('foo', null, { one: 11, two: 22 })
  data = await get('foo', null)
  t.deepEqual(data, { one: 11, two: 22 })
  await put('foo', null, { one: 11 })
  data = await get('foo', null)
  t.deepEqual(data, { one: 11 })

  data = await get('foo', 'one')
  t.deepEqual(data, 11)

  await put('foo', ['bar', 'baz'], { qux: 1 })
  data = await get('foo', null)
  t.deepEqual(data, { one: 11, bar: { baz: { qux: 1 } } })

  await put('foo', ['bar', 'asdf'], true)
  data = await get('foo', null)
  t.deepEqual(data, { one: 11,
    bar: {
      baz: { qux: 1 },
      asdf: true
    } })

  await put('foo', ['bar', 'baz', 'qux'], 'wat?')
  data = await get('foo', null)
  t.deepEqual(data, { one: 11,
    bar: {
      baz: { qux: 'wat?' },
      asdf: true
    } })
  data = await get('foo', ['bar', 'baz', 'qux'])
  t.deepEqual(data, 'wat?')

  await del('foo', 'one')
  data = await get('foo', null)
  t.deepEqual(data, { bar: { baz: { qux: 'wat?' }, asdf: true } })

  await del('foo', ['bar', 'asdf'])
  data = await get('foo', null)
  t.deepEqual(data, { bar: { baz: { qux: 'wat?' } } })

  await del('foo', ['bar', 'baz', 'qux'])
  data = await get('foo', null)
  t.deepEqual(data, {})

  /// ////////////////////////////////////////////////////////////////////
  // how other types are encoded
  var action = function () {}
  action.is_an_action = true
  await put('act', null, action)
  await put('fn', null, _.noop)
  await put('nan', null, NaN)

  var dump = await toObj()

  t.is(await get('fn', null), '[Function]')
  t.deepEqual(dump.entvars.p.r.fn, {
    type: 'String',
    value: '[Function]'
  })

  t.is(await get('act', null), '[Action]')
  t.deepEqual(dump.entvars.p.r.act, {
    type: 'String',
    value: '[Action]'
  })

  t.is(await get('nan', null), void 0)
  t.deepEqual(dump.entvars.p.r.nan, {
    type: 'Null'
  })
})

test('DB - persistent variables array/map', async function (t) {
  var db = mkTestDB()
  var put = _.partial(db.putEntVar, 'p', 'r')
  var get = _.partial(db.getEntVar, 'p', 'r')
  var del = _.partial(db.delEntVar, 'p', 'r')
  var toObj = db.toObj
  var toJson = JSON.stringify

  var tst = async function (name, type, value, msg) {
    var val = toJson(value)
    const expectedRoot = _.isArray(value)
      ? `{"type":"${type}","value":${val},"length":${value.length}}`
      : '{"type":"' + type + '","value":' + val + '}'
    t.is(toJson((await toObj()).entvars.p.r[name]), expectedRoot, msg)
    t.is(toJson(await get(name, null)), val, msg)
  }

  await put('foo', [0], 'aaa')
  await put('foo', [1], 'bbb')
  await tst('foo', 'Array', ['aaa', 'bbb'], '`foo` is infered to be an array based on the int index')

  // Now should change to a map b/c the key is not an int index
  await put('foo', ['wat'], 'da')
  await tst('foo', 'Map', { 0: 'aaa', 1: 'bbb', wat: 'da' }, '`foo` is now a map')

  // once a map, always a map
  await del('foo', ['wat'])
  await tst('foo', 'Map', { 0: 'aaa', 1: 'bbb' }, '`foo` is still a map')
  await put('foo', [2], 'ccc')
  await tst('foo', 'Map', { 0: 'aaa', 1: 'bbb', 2: 'ccc' }, '`foo` is still a map')

  // infered as map if it's a string
  await put('bar', ['0'], 'aaa')
  await tst('bar', 'Map', { 0: 'aaa' }, '`bar` is a map since the first key was a string')

  // infered as an Array b/c the key is a positive integer
  await put('baz', [2], 'ccc')
  await tst('baz', 'Array', [null, null, 'ccc'], '`baz` is an Array')

  // now it's a map b/c the key is a string
  await put('baz', ['1'], 'bbb')
  await tst('baz', 'Map', { 1: 'bbb', 2: 'ccc' }, '`baz` is now a Map')

  // initialzed as array should db dump as an array
  await put('qux', null, ['aaa'])
  await tst('qux', 'Array', ['aaa'], '`qux` is an Array')

  // test that a KRL null value removes the key from the map
  await put('blah', null, { one: 0, two: null })
  await tst('blah', 'Map', { one: 0 })
  await put('blah', null, { one: 0, two: void 0 })
  await tst('blah', 'Map', { one: 0 })
  await put('blah', null, { one: 0, two: NaN })
  await tst('blah', 'Map', { one: 0 })
  // same for nested maps
  await put('blah', null, { nest: { one: 0, two: null } })
  await tst('blah', 'Map', { nest: { one: 0 } })
  await put('blah', null, { nest: { one: 0, two: void 0 } })
  await tst('blah', 'Map', { nest: { one: 0 } })
  await put('blah', null, { nest: { one: 0, two: NaN } })
  await tst('blah', 'Map', { nest: { one: 0 } })
})

test('DB - persistent variable append to array', async function (t) {
  const db = mkTestDB()
  const put = _.partial(db.putEntVar, 'p', 'r')
  const get = _.partial(db.getEntVar, 'p', 'r')
  const del = _.partial(db.delEntVar, 'p', 'r')
  const append = _.partial(db.appendEntVar, 'p', 'r')
  function dump (name) {
    return db.forRange({
      prefix: ['entvars', 'p', 'r', name]
    }, function (data) {
      return data.key.slice(4).join('|') + ' => ' + JSON.stringify(data.value)
    })
  }

  await put('foo', null, 'abc'.split(''))
  t.deepEqual(await dump('foo'), [
    ' => {"type":"Array","value":[],"length":3}',
    'value|0 => "a"',
    'value|1 => "b"',
    'value|2 => "c"'
  ])

  await append('foo', ['d', 'e'])
  t.deepEqual(await dump('foo'), [
    ' => {"type":"Array","value":[],"length":5}',
    'value|0 => "a"',
    'value|1 => "b"',
    'value|2 => "c"',
    'value|3 => "d"',
    'value|4 => "e"'
  ])

  // test old ent vars that don't have a length yet
  await db.ldb.put(['entvars', 'p', 'r', 'foo'], { type: 'Array', value: [] })
  t.deepEqual(await dump('foo'), [
    ' => {"type":"Array","value":[]}',
    'value|0 => "a"',
    'value|1 => "b"',
    'value|2 => "c"',
    'value|3 => "d"',
    'value|4 => "e"'
  ])
  await append('foo', ['f'])
  t.deepEqual(await dump('foo'), [
    ' => {"type":"Array","value":[],"length":6}',
    'value|0 => "a"',
    'value|1 => "b"',
    'value|2 => "c"',
    'value|3 => "d"',
    'value|4 => "e"',
    'value|5 => "f"'
  ])

  // maintain length when puting at an index
  await put('foo', [6], 'g')
  t.deepEqual(await dump('foo'), [
    ' => {"type":"Array","value":[],"length":7}',
    'value|0 => "a"',
    'value|1 => "b"',
    'value|2 => "c"',
    'value|3 => "d"',
    'value|4 => "e"',
    'value|5 => "f"',
    'value|6 => "g"'
  ])
  await put('foo', [3], 'CHANGE')
  t.deepEqual(await dump('foo'), [
    ' => {"type":"Array","value":[],"length":7}',
    'value|0 => "a"',
    'value|1 => "b"',
    'value|2 => "c"',
    'value|3 => "CHANGE"',
    'value|4 => "e"',
    'value|5 => "f"',
    'value|6 => "g"'
  ])
  await put('foo', [9], 'SKIP')
  t.deepEqual(await dump('foo'), [
    ' => {"type":"Array","value":[],"length":10}',
    'value|0 => "a"',
    'value|1 => "b"',
    'value|2 => "c"',
    'value|3 => "CHANGE"',
    'value|4 => "e"',
    'value|5 => "f"',
    'value|6 => "g"',
    'value|9 => "SKIP"'
  ])
  t.deepEqual(await get('foo'), [
    'a',
    'b',
    'c',
    'CHANGE',
    'e',
    'f',
    'g',
    null,
    null,
    'SKIP'
  ])

  // maintain length when deleting at an index
  await del('foo', [9])
  t.deepEqual(await dump('foo'), [
    ' => {"type":"Array","value":[],"length":7}',
    'value|0 => "a"',
    'value|1 => "b"',
    'value|2 => "c"',
    'value|3 => "CHANGE"',
    'value|4 => "e"',
    'value|5 => "f"',
    'value|6 => "g"'
  ])
  await del('foo', [2])
  t.deepEqual(await dump('foo'), [
    ' => {"type":"Array","value":[],"length":7}',
    'value|0 => "a"',
    'value|1 => "b"',
    'value|3 => "CHANGE"',
    'value|4 => "e"',
    'value|5 => "f"',
    'value|6 => "g"'
  ])
  await del('foo', [3])
  await del('foo', [4])
  await del('foo', [5])
  t.deepEqual(await dump('foo'), [
    ' => {"type":"Array","value":[],"length":7}',
    'value|0 => "a"',
    'value|1 => "b"',
    // sparce array, still length 7 b/c that's the next open index
    'value|6 => "g"'
  ])
  await del('foo', [6])
  t.deepEqual(await dump('foo'), [
    ' => {"type":"Array","value":[],"length":2}',
    'value|0 => "a"',
    'value|1 => "b"'
  ])

  // append to an array that doesn't exist yet
  // NOTE: this must work the same as krl-stdlib .append()
  t.deepEqual(await dump('bar'), [])
  await append('bar', ['hi', 'bye'])
  t.deepEqual(await dump('bar'), [
    ' => {"type":"Array","value":[],"length":3}',
    'value|1 => "hi"',
    'value|2 => "bye"'
  ])

  // append to a null ent var
  await put('bar', null, null)
  t.deepEqual(await dump('bar'), [
    ' => {"type":"Null"}'
  ])
  await append('bar', ['hi', 'bye'])
  t.deepEqual(await dump('bar'), [
    ' => {"type":"Array","value":[],"length":3}',
    'value|1 => "hi"',
    'value|2 => "bye"'
  ])
  t.deepEqual(await get('bar'), [null, 'hi', 'bye'])

  await put('bar', null, null)
  await append('bar', [])
  t.deepEqual(await dump('bar'), [
    ' => {"type":"Array","value":[],"length":1}'
  ])
  t.deepEqual(await get('bar'), [null])

  // append to a scalar
  await put('baz', null, 'blah')
  t.deepEqual(await dump('baz'), [
    ' => {"type":"String","value":"blah"}'
  ])
  await append('baz', ['hi', 'bye'])
  t.deepEqual(await dump('baz'), [
    ' => {"type":"Array","value":[],"length":3}',
    'value|0 => "blah"',
    'value|1 => "hi"',
    'value|2 => "bye"'
  ])
  await put('baz', null, 0)
  t.deepEqual(await dump('baz'), [
    ' => {"type":"Number","value":0}'
  ])
  await append('baz', [])
  t.deepEqual(await dump('baz'), [
    ' => {"type":"Array","value":[],"length":1}',
    'value|0 => 0'
  ])

  // append to a Map
  // NOTE: this must work the same as krl-stdlib .append()
  await put('qux', null, { one: 'hi', two: 'bye', '3': 'looks like an array index' })
  t.deepEqual(await dump('qux'), [
    ' => {"type":"Map","value":{}}',
    'value|3 => "looks like an array index"',
    'value|one => "hi"',
    'value|two => "bye"'
  ])
  await append('qux', ['some', 'more'])
  t.deepEqual(await dump('qux'), [
    ' => {"type":"Array","value":[],"length":3}',
    'value|0 => {"3":"looks like an array index","one":"hi","two":"bye"}',
    'value|1 => "some"',
    'value|2 => "more"'
  ])

  // if it's an empty Map
  await put('qux', null, {})
  await append('qux', ['some', 'more'])
  t.deepEqual(await dump('qux'), [
    ' => {"type":"Array","value":[],"length":3}',
    'value|0 => {}',
    'value|1 => "some"',
    'value|2 => "more"'
  ])
  // still can convert back to map if they use a map-like key
  await put('qux', ['wat'], 'no longer an array')
  t.deepEqual(await dump('qux'), [
    ' => {"type":"Map","value":{}}',
    'value|0 => {}',
    'value|1 => "some"',
    'value|2 => "more"',
    'value|wat => "no longer an array"'
  ])
  // append nothing still converts it to an array
  await put('qux', null, {})
  await append('qux', [])
  t.deepEqual(await dump('qux'), [
    ' => {"type":"Array","value":[],"length":1}',
    'value|0 => {}'
  ])

  // set empty array
  await put('arr', null, [])
  t.deepEqual(await dump('arr'), [
    ' => {"type":"Array","value":[],"length":0}'
  ])
})
