var _ = require('lodash')
var DB = require('../src/DB')
var util = require('util')
var cuid = require('cuid')
var async = require('async')
var testA = require('./helpers/testA')
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

testA.cb('DB - write and read', function (t) {
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

    t.deepEquals(data.start_db, {})

    t.deepEquals(data.end_db, {
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

    t.deepEquals(data.post_del_db, {})

    t.end()
  })
})

testA.cb('DB - storeRuleset', function (t) {
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
    t.deepEquals(data.start_db, {})
    t.deepEquals(data.store, { rid: rid, hash: hash })
    t.deepEquals(data.findRulesetsByURL, [{
      rid: rid,
      hash: hash
    }])
    t.deepEquals(data.end_db, expected)
    t.end()
  })
})

testA.cb('DB - enableRuleset', function (t) {
  var db = mkTestDB()

  var krlSrc = 'ruleset io.picolabs.cool {}'
  // TODO
  async.waterfall([
    function (callback) {
      db.toObj(callback)
    },
    function (dbJson, callback) {
      t.deepEquals(_.omit(dbJson, 'rulesets'), {})
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
      t.deepEquals(_.get(dbJson, [
        'rulesets',
        'enabled',
        'io.picolabs.cool',
        'hash'
      ]), hash)
      db.getEnabledRuleset('io.picolabs.cool', function (err, data) {
        if (err) return callback(err)
        t.equals(data.src, krlSrc)
        t.equals(data.hash, hash)
        t.equals(data.rid, 'io.picolabs.cool')
        t.equals(data.timestamp_enable, _.get(dbJson, [
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

testA("DB - read keys that don't exist", async function (t) {
  var db = mkTestDB()

  var ent = await db.getEntVarYieldable('pico0', 'rid0', "var that doesn't exisit", null)
  t.is(ent, undefined)

  var app = await db.getAppVarYieldable('rid0', "var that doesn't exisit", null)
  t.is(app, undefined)
})

testA.cb('DB - getRootPico', function (t) {
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
      t.ok(err)
      t.ok(err.notFound)
      t.deepEquals(rPico, void 0)
    }),
    async.apply(db.newChannel, { pico_id: 'foo', name: 'bar', type: 'baz' }),
    async.apply(db.newPico, {}),
    tstRoot(function (err, rPico) {
      t.notOk(err)
      t.deepEquals(rPico, { id: 'id1', parent_id: null, admin_eci: 'id2' })
    }),
    async.apply(db.newPico, { parent_id: 'id1' }),
    tstRoot(function (err, rPico) {
      t.notOk(err)
      t.deepEquals(rPico, { id: 'id1', parent_id: null, admin_eci: 'id2' })
    }),
    async.apply(db.newPico, { parent_id: null }),
    tstRoot(function (err, rPico) {
      t.notOk(err)
      t.deepEquals(rPico, { id: 'id5', parent_id: null, admin_eci: 'id6' })
    })
  ], t.end)
})

testA.cb('DB - isRulesetUsed', function (t) {
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
    t.equals(data.is_foo, true)
    t.equals(data.is_bar, true)
    t.equals(data.is_baz, false)
    t.equals(data.is_qux, false)
    t.end()
  })
})

testA.cb('DB - deleteRuleset', function (t) {
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

    t.deepEquals(_.keys(data.init_db.rulesets.versions), [
      'io.picolabs.bar',
      'io.picolabs.foo'
    ], 'ensure all were actually stored in the db')

    t.deepEquals(_.keys(data.end_db.rulesets.versions), [
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
    t.deepEquals(data.end_db, expectedDb)

    t.end()
  })
})

testA.cb('DB - scheduleEventAt', function (t) {
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

    t.deepEquals(data.init_db, {})

    t.deepEquals(data.at0, {
      id: 'id0',
      at: new Date('Feb 22, 2222'),
      event: { domain: 'foobar', type: 'foo', attributes: { some: 'attr' } }
    })
    t.deepEquals(data.at1, {
      id: 'id1',
      at: new Date('Feb 23, 2222'),
      event: { domain: 'foobar', type: 'bar', attributes: { some: 'attr' } }
    })
    t.deepEquals(data.at2, {
      id: 'id2',
      at: new Date('Feb  2, 2222'),
      event: { domain: 'foobar', type: 'baz', attributes: { some: 'attr' } }
    })

    t.deepEquals(data.list, [
      data.at2,
      data.at0,
      data.at1
    ].map(function (val) {
      return _.assign({}, val, {
        at: val.at.toISOString()
      })
    }))

    t.deepEquals(data.next0, void 0, 'nothing scheduled')
    t.ok(_.has(data, 'next0'), 'ensure next0 was actually tested')
    t.deepEquals(data.next1, data.at0, 'only one scheduled')
    t.deepEquals(data.next2, data.at0, 'at0 is still sooner than at1')
    t.deepEquals(data.next3, data.at2, 'at2 is sooner than at0')
    t.deepEquals(data.next4, data.at2)
    t.deepEquals(data.next5, data.at1, 'at1 is soonest now that at0 and at2 were removed')
    t.deepEquals(data.next6, void 0, 'nothing scheduled')
    t.ok(_.has(data, 'next6'), 'ensure next6 was actually tested')

    t.deepEquals(data.end_db, {}, 'should be nothing left in the db')

    t.end()
  })
})

testA.cb('DB - scheduleEventRepeat', function (t) {
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

    t.deepEquals(data.init_db, {})

    t.deepEquals(data.rep0, {
      id: 'id0',
      timespec: '*/5 * * * * *',
      event: { domain: 'foobar', type: 'foo', attributes: { some: 'attr' } }
    })
    t.deepEquals(data.rep1, {
      id: 'id1',
      timespec: '* */5 * * * *',
      event: { domain: 'foobar', type: 'bar', attributes: { some: 'attr' } }
    })

    t.deepEquals(data.mid_db, { scheduled: {
      id0: data.rep0,
      id1: data.rep1
    } })

    t.deepEquals(data.list, [
      data.rep0,
      data.rep1
    ])

    t.deepEquals(data.end_db, {}, 'should be nothing left in the db')

    t.end()
  })
})

testA.cb('DB - removeRulesetFromPico', function (t) {
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

    t.deepEquals(data.db_before, {
      entvars: { pico0: { rid0: {
        foo: { type: 'String', value: 'val0' },
        bar: { type: 'String', value: 'val1' }
      } } },
      'pico-ruleset': { 'pico0': { 'rid0': { on: true } } },
      'ruleset-pico': { 'rid0': { 'pico0': { on: true } } }
    })

    t.deepEquals(data.db_after, {}, 'should all be gone')

    t.end()
  })
})

testA.cb('DB - getPicoIDByECI', function (t) {
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

    t.deepEquals(data.get_c2, 'id0')
    t.deepEquals(data.get_c3, 'id2')
    t.deepEquals(data.get_c4, 'id0')
    t.deepEquals(data.get_c5, 'id2')

    db.getPicoIDByECI('bad-id', function (err, id) {
      t.ok(err)
      t.ok((err && err.notFound) === true)
      t.notOk(id)
      t.end()
    })
  })
})

testA.cb('DB - listChannels', function (t) {
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

    t.deepEquals(data.c4_p0, c4)
    t.deepEquals(data.c5_p1, c5)

    t.deepEquals(data.list0, [c1, c4])
    t.deepEquals(data.list2, [c3, c5])
    t.deepEquals(data.list404, [])

    t.end()
  })
})

testA.cb('DB - listAllEnabledRIDs', function (t) {
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

    t.deepEquals(data.list0, [])
    t.deepEquals(data.list1, [])
    t.deepEquals(data.list2, ['foo'])
    t.deepEquals(data.list3, ['bar', 'baz', 'foo'])
    t.deepEquals(data.list4, ['bar', 'baz'])

    t.end()
  })
})

testA.cb('DB - migrations', function (t) {
  var db = mkTestDB()
  async.series([
    function (next) {
      db.getMigrationLog(function (err, log) {
        if (err) return next(err)
        t.deepEquals(log, {})
        next()
      })
    },
    async.apply(db.recordMigration, 'v1'),
    function (next) {
      db.getMigrationLog(function (err, log) {
        if (err) return next(err)

        t.deepEquals(_.keys(log), ['v1'])
        t.deepEquals(_.keys(log['v1']), ['timestamp'])
        t.equals(log['v1'].timestamp, (new Date(log['v1'].timestamp)).toISOString())

        next()
      })
    },
    async.apply(db.recordMigration, 'v200'),
    function (next) {
      db.getMigrationLog(function (err, log) {
        if (err) return next(err)
        t.deepEquals(_.keys(log), ['v1', 'v200'])
        next()
      })
    },
    async.apply(db.removeMigration, 'v200'),
    function (next) {
      db.getMigrationLog(function (err, log) {
        if (err) return next(err)
        t.deepEquals(_.keys(log), ['v1'])
        next()
      })
    },
    async.apply(db.removeMigration, 'v1'),
    function (next) {
      db.getMigrationLog(function (err, log) {
        if (err) return next(err)
        t.deepEquals(log, {})
        next()
      })
    },
    async.apply(db.checkAndRunMigrations),
    function (next) {
      db.getMigrationLog(function (err, log) {
        if (err) return next(err)
        t.deepEquals(_.keys(log), _.keys(migrations))
        next()
      })
    }
  ], t.end)
})

testA.cb('DB - parent/child', function (t) {
  var db = mkTestDB()

  var assertParent = function (picoId, expectedParentId) {
    return function (next) {
      db.getParent(picoId, function (err, parentId) {
        if (err) return next(err)
        t.equals(parentId, expectedParentId, 'testing db.getParent')
        next()
      })
    }
  }

  var assertChildren = function (picoId, expectedChildrenIds) {
    return function (next) {
      db.listChildren(picoId, function (err, list) {
        if (err) return next(err)
        t.deepEquals(list, expectedChildrenIds, 'testing db.listChildren')
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

testA.cb('DB - assertPicoID', function (t) {
  var db = mkTestDB()

  var tstPID = function (id, expectedIt) {
    return function (next) {
      db.assertPicoID(id, function (err, gotId) {
        if (expectedIt) {
          t.notOk(err)
          t.equals(gotId, id)
        } else {
          t.ok(err)
          t.notOk(gotId)
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

testA('DB - removeChannel', async function (t) {
  var db = mkTestDB()

  var assertECIs = async function (picoId, expectedEcis) {
    var chans = await db.listChannelsYieldable(picoId)

    var eciList = _.map(chans, 'id')
    t.is(eciList, expectedEcis, 'assert the listChannels')
    t.is(_.uniq(_.map(chans, 'pico_id')), [picoId], 'assert listChannels all come from the same pico_id')
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

testA('DB - persistent variables', async function (t) {
  var db = mkTestDB()

  var put = _.partial(db.putEntVarYieldable, 'p', 'r')
  var get = _.partial(db.getEntVarYieldable, 'p', 'r')
  var del = _.partial(db.delEntVarYieldable, 'p', 'r')
  var toObj = db.toObjYieldable

  var data

  await put('foo', null, [1, 2])
  data = await get('foo', null)
  t.deepEquals(data, [1, 2])
  t.ok(ktypes.isArray(data))

  await put('foo', null, { a: 3, b: 4 })
  data = await get('foo', null)
  t.deepEquals(data, { a: 3, b: 4 })
  t.ok(ktypes.isMap(data))

  await del('foo', null)
  data = await get('foo', null)
  t.deepEquals(data, void 0)

  await put('foo', null, { one: 11, two: 22 })
  data = await get('foo', null)
  t.deepEquals(data, { one: 11, two: 22 })
  await put('foo', null, { one: 11 })
  data = await get('foo', null)
  t.deepEquals(data, { one: 11 })

  data = await get('foo', 'one')
  t.deepEquals(data, 11)

  await put('foo', ['bar', 'baz'], { qux: 1 })
  data = await get('foo', null)
  t.deepEquals(data, { one: 11, bar: { baz: { qux: 1 } } })

  await put('foo', ['bar', 'asdf'], true)
  data = await get('foo', null)
  t.deepEquals(data, { one: 11,
    bar: {
      baz: { qux: 1 },
      asdf: true
    } })

  await put('foo', ['bar', 'baz', 'qux'], 'wat?')
  data = await get('foo', null)
  t.deepEquals(data, { one: 11,
    bar: {
      baz: { qux: 'wat?' },
      asdf: true
    } })
  data = await get('foo', ['bar', 'baz', 'qux'])
  t.deepEquals(data, 'wat?')

  await del('foo', 'one')
  data = await get('foo', null)
  t.deepEquals(data, { bar: { baz: { qux: 'wat?' }, asdf: true } })

  await del('foo', ['bar', 'asdf'])
  data = await get('foo', null)
  t.deepEquals(data, { bar: { baz: { qux: 'wat?' } } })

  await del('foo', ['bar', 'baz', 'qux'])
  data = await get('foo', null)
  t.deepEquals(data, {})

  /// ////////////////////////////////////////////////////////////////////
  // how other types are encoded
  var action = function () {}
  action.is_an_action = true
  await put('act', null, action)
  await put('fn', null, _.noop)
  await put('nan', null, NaN)

  var dump = await toObj()

  t.equals(await get('fn', null), '[Function]')
  t.deepEquals(dump.entvars.p.r.fn, {
    type: 'String',
    value: '[Function]'
  })

  t.equals(await get('act', null), '[Action]')
  t.deepEquals(dump.entvars.p.r.act, {
    type: 'String',
    value: '[Action]'
  })

  t.equals(await get('nan', null), null)
  t.deepEquals(dump.entvars.p.r.nan, {
    type: 'Null',
    value: null
  })
})

testA('DB - persistent variables array/map', async function (t) {
  var db = mkTestDB()
  var put = _.partial(db.putEntVarYieldable, 'p', 'r')
  var get = _.partial(db.getEntVarYieldable, 'p', 'r')
  var del = _.partial(db.delEntVarYieldable, 'p', 'r')
  var toObj = db.toObjYieldable
  var toJson = JSON.stringify

  var tst = async function (name, type, value, msg) {
    var val = toJson(value)
    t.equals(toJson((await toObj()).entvars.p.r[name]), '{"type":"' + type + '","value":' + val + '}', msg)
    t.equals(toJson(await get(name, null)), val, msg)
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
