var _ = require('lodash')
var DB = require('../src/DB')
var util = require('util')
var cuid = require('cuid')
var async = require('async')
var test = require('ava')
var ktypes = require('krl-stdlib/types')
var memdown = require('memdown')
var migrations = require('../src/migrations')
var ADMIN_POLICY_ID = DB.ADMIN_POLICY_ID

var mkTestDB = function () {
  var db = DB({
    db: memdown(cuid()),
    __use_sequential_ids_for_testing: true
  })
  _.each(db, function (val, key) {
    if (_.isFunction(val)) {
      db[key + 'Yieldable'] = util.promisify(val)
    }
  })
  return db
}

test.cb('DB - write and read', function (t) {
  var db = mkTestDB()
  async.series({
    start_db: async.apply(db.toObj),
    pico0: async.apply(db.newPico, {}),
    rule0: async.apply(db.addRulesetToPico, 'id0', 'rs0'),
    chan2: async.apply(db.newChannel, { pico_id: 'id0', name: 'two', type: 't', policy_id: ADMIN_POLICY_ID }),
    pico1: async.apply(db.newPico, { parent_id: 'id0' }),
    end_db: async.apply(db.toObj),
    rmpico0: async.apply(db.removePico, 'id0'),
    rmpico1: async.apply(db.removePico, 'id3'),
    post_del_db: async.apply(db.toObj)
  }, function (err, data) {
    if (err) return t.end(err)

    t.deepEqual(data.start_db, {})

    t.deepEqual(data.end_db, {
      channel: {
        id1: {
          pico_id: 'id0',
          id: 'id1',
          name: 'admin',
          type: 'secret',
          policy_id: ADMIN_POLICY_ID,
          sovrin: {
            did: 'id1',
            verifyKey: 'verifyKey_id1',
            secret: {
              seed: 'seed_id1',
              signKey: 'signKey_id1'
            }
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
            verifyKey: 'verifyKey_id2',
            secret: {
              seed: 'seed_id2',
              signKey: 'signKey_id2'
            }
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
            verifyKey: 'verifyKey_id4',
            secret: {
              seed: 'seed_id4',
              signKey: 'signKey_id4'
            }
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

    t.deepEqual(data.post_del_db, {})

    t.end()
  })
})

test.cb('DB - storeRuleset', function (t) {
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

  async.series({
    start_db: async.apply(db.toObj),
    store: function (next) {
      db.storeRuleset(krlSrc, {
        url: url
      }, next, timestamp)
    },
    findRulesetsByURL: async.apply(db.findRulesetsByURL, url),
    end_db: async.apply(db.toObj)
  }, function (err, data) {
    if (err) return t.end(err)
    t.deepEqual(data.start_db, {})
    t.deepEqual(data.store, { rid: rid, hash: hash })
    t.deepEqual(data.findRulesetsByURL, [{
      rid: rid,
      hash: hash
    }])
    t.deepEqual(data.end_db, expected)
    t.end()
  })
})

test.cb('DB - enableRuleset', function (t) {
  var db = mkTestDB()

  var krlSrc = 'ruleset io.picolabs.cool {}'
  // TODO
  async.waterfall([
    function (callback) {
      db.toObj(callback)
    },
    function (dbJson, callback) {
      t.deepEqual(_.omit(dbJson, 'rulesets'), {})
      db.storeRuleset(krlSrc, {}, callback)
    },
    function (data, callback) {
      db.enableRuleset(data.hash, function (err) {
        callback(err, data.hash)
      })
    },
    function (hash, callback) {
      db.toObj(function (err, db) {
        callback(err, db, hash)
      })
    },
    function (dbJson, hash, callback) {
      t.deepEqual(_.get(dbJson, [
        'rulesets',
        'enabled',
        'io.picolabs.cool',
        'hash'
      ]), hash)
      db.getEnabledRuleset('io.picolabs.cool', function (err, data) {
        if (err) return callback(err)
        t.is(data.src, krlSrc)
        t.is(data.hash, hash)
        t.is(data.rid, 'io.picolabs.cool')
        t.is(data.timestamp_enable, _.get(dbJson, [
          'rulesets',
          'enabled',
          'io.picolabs.cool',
          'timestamp'
        ]))
        callback()
      })
    }
  ], t.end)
})

test("DB - read keys that don't exist", async function (t) {
  var db = mkTestDB()

  var ent = await db.getEntVarYieldable('pico0', 'rid0', "var that doesn't exisit", null)
  t.is(ent, undefined)

  var app = await db.getAppVarYieldable('rid0', "var that doesn't exisit", null)
  t.is(app, undefined)
})

test.cb('DB - getRootPico', function (t) {
  var db = mkTestDB()

  var tstRoot = function (assertFn) {
    return function (next) {
      db.getRootPico(function (err, rPico) {
        assertFn(err, rPico)
        next()
      })
    }
  }

  async.series([
    tstRoot(function (err, rPico) {
      t.truthy(err)
      t.truthy(err.notFound)
      t.deepEqual(rPico, void 0)
    }),
    async.apply(db.newChannel, { pico_id: 'foo', name: 'bar', type: 'baz' }),
    async.apply(db.newPico, {}),
    tstRoot(function (err, rPico) {
      t.falsy(err)
      t.deepEqual(rPico, { id: 'id1', parent_id: null, admin_eci: 'id2' })
    }),
    async.apply(db.newPico, { parent_id: 'id1' }),
    tstRoot(function (err, rPico) {
      t.falsy(err)
      t.deepEqual(rPico, { id: 'id1', parent_id: null, admin_eci: 'id2' })
    }),
    async.apply(db.newPico, { parent_id: null }),
    tstRoot(function (err, rPico) {
      t.falsy(err)
      t.deepEqual(rPico, { id: 'id5', parent_id: null, admin_eci: 'id6' })
    })
  ], t.end)
})

test.cb('DB - isRulesetUsed', function (t) {
  var db = mkTestDB()

  async.series({
    pico0: async.apply(db.newPico, {}),
    pico1: async.apply(db.newPico, {}),

    foo0: async.apply(db.addRulesetToPico, 'id0', 'rs-foo'),
    foo1: async.apply(db.addRulesetToPico, 'id1', 'rs-foo'),
    bar0: async.apply(db.addRulesetToPico, 'id0', 'rs-bar'),

    is_foo: async.apply(db.isRulesetUsed, 'rs-foo'),
    is_bar: async.apply(db.isRulesetUsed, 'rs-bar'),
    is_baz: async.apply(db.isRulesetUsed, 'rs-baz'),
    is_qux: async.apply(db.isRulesetUsed, 'rs-qux')
  }, function (err, data) {
    if (err) return t.end(err)
    t.is(data.is_foo, true)
    t.is(data.is_bar, true)
    t.is(data.is_baz, false)
    t.is(data.is_qux, false)
    t.end()
  })
})

test.cb('DB - deleteRuleset', function (t) {
  var db = mkTestDB()

  var storeRuleset = function (name) {
    return function (callback) {
      var rid = 'io.picolabs.' + name
      var krl = 'ruleset ' + rid + ' {}'
      db.storeRuleset(krl, {
        url: 'file:///' + name + '.krl'
      }, function (err, data) {
        if (err) return callback(err)
        db.enableRuleset(data.hash, function (err) {
          if (err) return callback(err)
          db.putAppVar(rid, 'my_var', null, 'appvar value', function (err) {
            callback(err, data.hash)
          })
        })
      })
    }
  }

  async.series({
    store_foo: storeRuleset('foo'),
    store_bar: storeRuleset('bar'),

    init_db: async.apply(db.toObj),

    del_foo: async.apply(db.deleteRuleset, 'io.picolabs.foo'),

    end_db: async.apply(db.toObj)
  }, function (err, data) {
    if (err) return t.end(err)

    t.deepEqual(_.keys(data.init_db.rulesets.versions), [
      'io.picolabs.bar',
      'io.picolabs.foo'
    ], 'ensure all were actually stored in the db')

    t.deepEqual(_.keys(data.end_db.rulesets.versions), [
      'io.picolabs.bar'
    ], 'ensure io.picolabs.foo was removed')

    // make the `init_db` look like the expected `end_db`
    var expectedDb = _.cloneDeep(data.init_db)
    t.deepEqual(expectedDb, data.init_db, 'sanity check')

    delete expectedDb.rulesets.enabled['io.picolabs.foo']
    delete expectedDb.rulesets.krl[data.store_foo]
    delete expectedDb.rulesets.url['file:///foo.krl']
    delete expectedDb.rulesets.versions['io.picolabs.foo']
    delete expectedDb.appvars['io.picolabs.foo']

    t.notDeepEqual(expectedDb, data.init_db, 'sanity check')
    t.deepEqual(data.end_db, expectedDb)

    t.end()
  })
})

test.cb('DB - scheduleEventAt', function (t) {
  var db = mkTestDB()

  var eventAt = function (date, type) {
    return function (callback) {
      db.scheduleEventAt(new Date(date), {
        domain: 'foobar',
        type: type,
        attributes: { some: 'attr' }
      }, callback)
    }
  }
  var rmAt = function (id) {
    return function (callback) {
      db.removeScheduled(id, callback)
    }
  }

  var getNext = async.apply(db.nextScheduleEventAt)

  async.series({
    init_db: async.apply(db.toObj),
    next0: getNext,
    at0: eventAt('Feb 22, 2222', 'foo'),
    next1: getNext,
    at1: eventAt('Feb 23, 2222', 'bar'),
    next2: getNext,
    at2: eventAt('Feb  2, 2222', 'baz'),
    next3: getNext,

    list: async.apply(db.listScheduled),

    rm0: rmAt('id0'),
    next4: getNext,
    rm2: rmAt('id2'),
    next5: getNext,
    rm1: rmAt('id1'),
    next6: getNext,

    end_db: async.apply(db.toObj)
  }, function (err, data) {
    if (err) return t.end(err)

    t.deepEqual(data.init_db, {})

    t.deepEqual(data.at0, {
      id: 'id0',
      at: new Date('Feb 22, 2222'),
      event: { domain: 'foobar', type: 'foo', attributes: { some: 'attr' } }
    })
    t.deepEqual(data.at1, {
      id: 'id1',
      at: new Date('Feb 23, 2222'),
      event: { domain: 'foobar', type: 'bar', attributes: { some: 'attr' } }
    })
    t.deepEqual(data.at2, {
      id: 'id2',
      at: new Date('Feb  2, 2222'),
      event: { domain: 'foobar', type: 'baz', attributes: { some: 'attr' } }
    })

    t.deepEqual(data.list, [
      data.at2,
      data.at0,
      data.at1
    ].map(function (val) {
      return _.assign({}, val, {
        at: val.at.toISOString()
      })
    }))

    t.deepEqual(data.next0, void 0, 'nothing scheduled')
    t.truthy(_.has(data, 'next0'), 'ensure next0 was actually tested')
    t.deepEqual(data.next1, data.at0, 'only one scheduled')
    t.deepEqual(data.next2, data.at0, 'at0 is still sooner than at1')
    t.deepEqual(data.next3, data.at2, 'at2 is sooner than at0')
    t.deepEqual(data.next4, data.at2)
    t.deepEqual(data.next5, data.at1, 'at1 is soonest now that at0 and at2 were removed')
    t.deepEqual(data.next6, void 0, 'nothing scheduled')
    t.truthy(_.has(data, 'next6'), 'ensure next6 was actually tested')

    t.deepEqual(data.end_db, {}, 'should be nothing left in the db')

    t.end()
  })
})

test.cb('DB - scheduleEventRepeat', function (t) {
  var db = mkTestDB()

  var eventRep = function (timespec, type) {
    return function (callback) {
      db.scheduleEventRepeat(timespec, {
        domain: 'foobar',
        type: type,
        attributes: { some: 'attr' }
      }, callback)
    }
  }
  async.series({
    init_db: async.apply(db.toObj),

    rep0: eventRep('*/5 * * * * *', 'foo'),
    rep1: eventRep('* */5 * * * *', 'bar'),

    mid_db: async.apply(db.toObj),

    list: async.apply(db.listScheduled),

    rm0: async.apply(db.removeScheduled, 'id0'),
    rm1: async.apply(db.removeScheduled, 'id1'),

    end_db: async.apply(db.toObj)
  }, function (err, data) {
    if (err) return t.end(err)

    t.deepEqual(data.init_db, {})

    t.deepEqual(data.rep0, {
      id: 'id0',
      timespec: '*/5 * * * * *',
      event: { domain: 'foobar', type: 'foo', attributes: { some: 'attr' } }
    })
    t.deepEqual(data.rep1, {
      id: 'id1',
      timespec: '* */5 * * * *',
      event: { domain: 'foobar', type: 'bar', attributes: { some: 'attr' } }
    })

    t.deepEqual(data.mid_db, { scheduled: {
      id0: data.rep0,
      id1: data.rep1
    } })

    t.deepEqual(data.list, [
      data.rep0,
      data.rep1
    ])

    t.deepEqual(data.end_db, {}, 'should be nothing left in the db')

    t.end()
  })
})

test.cb('DB - removeRulesetFromPico', function (t) {
  var db = mkTestDB()

  async.series({
    addRS: async.apply(db.addRulesetToPico, 'pico0', 'rid0'),
    ent0: async.apply(db.putEntVar, 'pico0', 'rid0', 'foo', null, 'val0'),
    ent1: async.apply(db.putEntVar, 'pico0', 'rid0', 'bar', null, 'val1'),
    db_before: async.apply(db.toObj),

    rmRS: async.apply(db.removeRulesetFromPico, 'pico0', 'rid0'),

    db_after: async.apply(db.toObj)
  }, function (err, data) {
    if (err) return t.end(err)

    t.deepEqual(data.db_before, {
      entvars: { pico0: { rid0: {
        foo: { type: 'String', value: 'val0' },
        bar: { type: 'String', value: 'val1' }
      } } },
      'pico-ruleset': { 'pico0': { 'rid0': { on: true } } },
      'ruleset-pico': { 'rid0': { 'pico0': { on: true } } }
    })

    t.deepEqual(data.db_after, {}, 'should all be gone')

    t.end()
  })
})

test.cb('DB - getPicoIDByECI', function (t) {
  var db = mkTestDB()
  async.series({
    pico0: async.apply(db.newPico, {}),
    pico2: async.apply(db.newPico, {}),

    c4_p0: async.apply(db.newChannel, { pico_id: 'id0', name: 'four', type: 't' }),
    c5_p1: async.apply(db.newChannel, { pico_id: 'id2', name: 'five', type: 't' }),

    get_c2: async.apply(db.getPicoIDByECI, 'id1'),
    get_c3: async.apply(db.getPicoIDByECI, 'id3'),
    get_c4: async.apply(db.getPicoIDByECI, 'id4'),
    get_c5: async.apply(db.getPicoIDByECI, 'id5')

  }, function (err, data) {
    if (err) return t.end(err)

    t.deepEqual(data.get_c2, 'id0')
    t.deepEqual(data.get_c3, 'id2')
    t.deepEqual(data.get_c4, 'id0')
    t.deepEqual(data.get_c5, 'id2')

    db.getPicoIDByECI('bad-id', function (err, id) {
      t.truthy(err)
      t.truthy((err && err.notFound) === true)
      t.falsy(id)
      t.end()
    })
  })
})

test.cb('DB - listChannels', function (t) {
  var db = mkTestDB()
  async.series({
    pico0: async.apply(db.newPico, {}),
    pico2: async.apply(db.newPico, {}),

    c4_p0: async.apply(db.newChannel, { pico_id: 'id0', name: 'four', type: 't4', policy_id: ADMIN_POLICY_ID }),
    c5_p1: async.apply(db.newChannel, { pico_id: 'id2', name: 'five', type: 't5', policy_id: ADMIN_POLICY_ID }),

    list0: async.apply(db.listChannels, 'id0'),
    list2: async.apply(db.listChannels, 'id2'),
    list404: async.apply(db.listChannels, 'id404')

  }, function (err, data) {
    if (err) return t.end(err)

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

    t.deepEqual(data.c4_p0, c4)
    t.deepEqual(data.c5_p1, c5)

    t.deepEqual(data.list0, [c1, c4])
    t.deepEqual(data.list2, [c3, c5])
    t.deepEqual(data.list404, [])

    t.end()
  })
})

test.cb('DB - listAllEnabledRIDs', function (t) {
  var db = mkTestDB()

  var hashes = {}
  var store = function (rid) {
    return function (done) {
      db.storeRuleset('ruleset ' + rid + '{}', {}, function (err, data) {
        if (err) return done(err)
        hashes[rid] = data.hash
        done()
      })
    }
  }

  var enable = function (rid) {
    return function (done) {
      db.enableRuleset(hashes[rid], done)
    }
  }

  async.series({
    list0: async.apply(db.listAllEnabledRIDs),

    s_foo: store('foo'),
    s_bar: store('bar'),
    s_baz: store('baz'),
    list1: async.apply(db.listAllEnabledRIDs),

    e_foo: enable('foo'),
    list2: async.apply(db.listAllEnabledRIDs),

    e_bar: enable('bar'),
    e_baz: enable('baz'),
    list3: async.apply(db.listAllEnabledRIDs),

    d_foo: async.apply(db.disableRuleset, 'foo'),
    list4: async.apply(db.listAllEnabledRIDs)
  }, function (err, data) {
    if (err) return t.end(err)

    t.deepEqual(data.list0, [])
    t.deepEqual(data.list1, [])
    t.deepEqual(data.list2, ['foo'])
    t.deepEqual(data.list3, ['bar', 'baz', 'foo'])
    t.deepEqual(data.list4, ['bar', 'baz'])

    t.end()
  })
})

test.cb('DB - migrations', function (t) {
  var db = mkTestDB()
  async.series([
    function (next) {
      db.getMigrationLog(function (err, log) {
        if (err) return next(err)
        t.deepEqual(log, {})
        next()
      })
    },
    async.apply(db.recordMigration, 'v1'),
    function (next) {
      db.getMigrationLog(function (err, log) {
        if (err) return next(err)

        t.deepEqual(_.keys(log), ['v1'])
        t.deepEqual(_.keys(log['v1']), ['timestamp'])
        t.is(log['v1'].timestamp, (new Date(log['v1'].timestamp)).toISOString())

        next()
      })
    },
    async.apply(db.recordMigration, 'v200'),
    function (next) {
      db.getMigrationLog(function (err, log) {
        if (err) return next(err)
        t.deepEqual(_.keys(log), ['v1', 'v200'])
        next()
      })
    },
    async.apply(db.removeMigration, 'v200'),
    function (next) {
      db.getMigrationLog(function (err, log) {
        if (err) return next(err)
        t.deepEqual(_.keys(log), ['v1'])
        next()
      })
    },
    async.apply(db.removeMigration, 'v1'),
    function (next) {
      db.getMigrationLog(function (err, log) {
        if (err) return next(err)
        t.deepEqual(log, {})
        next()
      })
    },
    async.apply(db.checkAndRunMigrations),
    function (next) {
      db.getMigrationLog(function (err, log) {
        if (err) return next(err)
        t.deepEqual(_.keys(log), _.keys(migrations))
        next()
      })
    }
  ], t.end)
})

test.cb('DB - parent/child', function (t) {
  var db = mkTestDB()

  var assertParent = function (picoId, expectedParentId) {
    return function (next) {
      db.getParent(picoId, function (err, parentId) {
        if (err) return next(err)
        t.is(parentId, expectedParentId, 'testing db.getParent')
        next()
      })
    }
  }

  var assertChildren = function (picoId, expectedChildrenIds) {
    return function (next) {
      db.listChildren(picoId, function (err, list) {
        if (err) return next(err)
        t.deepEqual(list, expectedChildrenIds, 'testing db.listChildren')
        next()
      })
    }
  }

  async.series([
    async.apply(db.newPico, {}), // id0 and channel id1
    async.apply(db.newPico, { parent_id: 'id0' }), // id2 + id3
    async.apply(db.newPico, { parent_id: 'id0' }), // id4 + id5
    async.apply(db.newPico, { parent_id: 'id0' }), // id6 + id7

    async.apply(db.newPico, { parent_id: 'id6' }), // id8 + id9
    async.apply(db.newPico, { parent_id: 'id6' }), // id10 + id11

    assertParent('id0', null),
    assertParent('id2', 'id0'),
    assertParent('id4', 'id0'),
    assertParent('id6', 'id0'),
    assertParent('id8', 'id6'),
    assertParent('id10', 'id6'),

    assertChildren('id0', ['id2', 'id4', 'id6']),
    assertChildren('id2', []),
    assertChildren('id4', []),
    assertChildren('id6', ['id10', 'id8']),
    assertChildren('id8', []),
    assertChildren('id10', []),

    async.apply(db.removePico, 'id8'),
    assertChildren('id6', ['id10']),

    async.apply(db.removePico, 'id6'),
    assertChildren('id6', [])

  ], t.end)
})

test.cb('DB - assertPicoID', function (t) {
  var db = mkTestDB()

  var tstPID = function (id, expectedIt) {
    return function (next) {
      db.assertPicoID(id, function (err, gotId) {
        if (expectedIt) {
          t.falsy(err)
          t.is(gotId, id)
        } else {
          t.truthy(err)
          t.falsy(gotId)
        }
        next()
      })
    }
  }

  async.series([
    async.apply(db.newPico, {}),

    tstPID(null, false),
    tstPID(void 0, false),
    tstPID({}, false),
    tstPID(0, false),

    tstPID('id0', true),
    tstPID('id2', false)

  ], t.end)
})

test('DB - removeChannel', async function (t) {
  var db = mkTestDB()

  var assertECIs = async function (picoId, expectedEcis) {
    var chans = await db.listChannelsYieldable(picoId)

    var eciList = _.map(chans, 'id')
    t.deepEqual(eciList, expectedEcis, 'assert the listChannels')
    t.deepEqual(_.uniq(_.map(chans, 'pico_id')), [picoId], 'assert listChannels all come from the same pico_id')
  }

  var assertFailRemoveECI = async function (eci) {
    try {
      await db.removeChannelYieldable(eci)
      t.fail('Should error')
    } catch (err) {
      t.is(err + '', "Error: Cannot delete the pico's admin channel")
    }
  }

  await db.newPicoYieldable({})
  await assertECIs('id0', ['id1'])

  await db.newChannelYieldable({ pico_id: 'id0', name: 'two', type: 't' })
  await assertECIs('id0', ['id1', 'id2'])

  await assertFailRemoveECI('id1')
  await assertECIs('id0', ['id1', 'id2'])

  await db.removeChannelYieldable('id2')
  await assertECIs('id0', ['id1'])

  await assertFailRemoveECI('id1')
  await assertECIs('id0', ['id1'])

  await db.newPicoYieldable({ parent_id: 'id0' })
  await assertECIs('id3', ['id4'])

  await assertFailRemoveECI('id4')
  await assertECIs('id3', ['id4'])
})

test('DB - persistent variables', async function (t) {
  var db = mkTestDB()

  var put = _.partial(db.putEntVarYieldable, 'p', 'r')
  var get = _.partial(db.getEntVarYieldable, 'p', 'r')
  var del = _.partial(db.delEntVarYieldable, 'p', 'r')
  var toObj = db.toObjYieldable

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

  t.is(await get('nan', null), null)
  t.deepEqual(dump.entvars.p.r.nan, {
    type: 'Null',
    value: null
  })
})

test('DB - persistent variables array/map', async function (t) {
  var db = mkTestDB()
  var put = _.partial(db.putEntVarYieldable, 'p', 'r')
  var get = _.partial(db.getEntVarYieldable, 'p', 'r')
  var del = _.partial(db.delEntVarYieldable, 'p', 'r')
  var toObj = db.toObjYieldable
  var toJson = JSON.stringify

  var tst = async function (name, type, value, msg) {
    var val = toJson(value)
    t.is(toJson((await toObj()).entvars.p.r[name]), '{"type":"' + type + '","value":' + val + '}', msg)
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
})
