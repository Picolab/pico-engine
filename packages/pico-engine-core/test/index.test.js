var _ = require('lodash')
var DB = require('../src/DB')
var util = require('util')
var cuid = require('cuid')
var http = require('http')
var async = require('async')
var test = require('ava')
var memdown = require('memdown')
var PicoEngine = require('../')
var mkTestPicoEngine = require('./helpers/mkTestPicoEngine')
var ADMIN_POLICY_ID = require('../src/DB').ADMIN_POLICY_ID

var urlPrefix = 'http://fake-url/test-rulesets/'

var omitMeta = function (resp) {
  if (!_.has(resp, 'directives')) {
    return resp
  }
  var r = _.assign({}, resp, {
    directives: _.map(resp.directives, function (d) {
      return _.omit(d, 'meta')
    })
  })
  if (_.isEqual(_.keys(r), ['directives'])) {
    return r.directives
  }
  return r
}

var mkEvent = function (spec, attrs) {
  var parts = spec.split('/')
  return {
    eci: parts[0],
    eid: parts[1],
    domain: parts[2],
    type: parts[3],
    attrs: attrs || {}
  }
}

var mkSignalTask = function (pe, eci) {
  return function (domain, type, attrs, timestamp, eid) {
    return async.apply(pe.signalEvent, {
      eci: eci,
      eid: eid || '1234',
      domain: domain,
      type: type,
      attrs: attrs || {},
      timestamp: timestamp
    })
  }
}

var mkSignalTaskP = function (pe, eci) {
  return function (domain, type, attrs, timestamp, eid) {
    return pe.signalEvent({
      eci: eci,
      eid: eid || '1234',
      domain: domain,
      type: type,
      attrs: attrs || {},
      timestamp: timestamp
    }).then(omitMeta)
  }
}

var mkQueryTask = function (pe, eci, rid) {
  return function (name, args) {
    return async.apply(pe.runQuery, {
      eci: eci,
      rid: rid,
      name: name,
      args: args || {}
    })
  }
}

var mkQueryTaskP = function (pe, eci, rid) {
  return function (name, args) {
    return pe.runQuery({
      eci: eci,
      rid: rid,
      name: name,
      args: args || {}
    })
  }
}

var testOutputs = function (t, pairs) {
  return new Promise(function (resolve, reject) {
    async.series(_.map(pairs, function (pair) {
      if (!_.isArray(pair)) {
        return pair
      }
      return pair[0]
    }), function (err, results) {
      if (err) return reject(err)
      _.each(pairs, function (pair, i) {
        if (!_.isArray(pair)) {
          return
        }
        var actual = results[i]
        var expected = pair[1]

        t.deepEqual(omitMeta(actual), expected)
      })
      resolve()
    })
  })
}

test('PicoEngine - hello_world ruleset', async function (t) {
  var pe = await mkTestPicoEngine({
    rootRIDs: [
      'io.picolabs.hello_world'
    ]
  })

  var helloEvent = await pe.signalEvent({
    eci: 'id1',
    eid: '1234',
    domain: 'echo',
    type: 'hello',
    attrs: {}
  })
  var txnPath = ['directives', 0, 'meta', 'txn_id']
  t.truthy(/^c[^\s]+$/.test(_.get(helloEvent, txnPath)))
  _.set(helloEvent, txnPath, 'TXN_ID')
  t.deepEqual(helloEvent, {
    directives: [
      {
        name: 'say',
        options: {
          something: 'Hello World'
        },
        meta: {
          eid: '1234',
          rid: 'io.picolabs.hello_world',
          rule_name: 'say_hello',
          txn_id: 'TXN_ID'
        }
      }
    ]
  })
  var helloQuery = await pe.runQuery({
    eci: 'id1',
    rid: 'io.picolabs.hello_world',
    name: 'hello',
    args: { obj: 'Bob' }
  })

  await new Promise(function (resolve) {
    pe.emitter.once('error', function (err) {
      t.is(err + '', 'Error: missing event.eci')
    })
    pe.signalEvent({}, function (err) {
      t.is(err + '', 'Error: missing event.eci')
      resolve()
    })
  })

  t.deepEqual(helloQuery, 'Hello Bob')
})

test('PicoEngine - io.picolabs.persistent', async function (t) {
  var pe = await mkTestPicoEngine()

  // two picos with the same ruleset
  var queryA = mkQueryTask(pe, 'id1', 'io.picolabs.persistent')
  var queryB = mkQueryTask(pe, 'id3', 'io.picolabs.persistent')
  var signalA = mkSignalTask(pe, 'id1')
  var signalB = mkSignalTask(pe, 'id3')

  var entvarPath = ['entvars', 'id0', 'io.picolabs.persistent', 'user']
  var appvarPath = ['appvars', 'io.picolabs.persistent', 'appvar']

  await pe.newPico({}) // id0 - pico A channel id1
  await pe.newPico({}) // id2 - pico B channel id3
  await pe.installRuleset('id0', 'io.picolabs.persistent')
  await pe.installRuleset('id2', 'io.picolabs.persistent')

  await testOutputs(t, [
    /// ///////////////////////////////////////////////////////////////////////
    // if not set, the var should return undefined
    [queryA('getName'), null],
    [queryA('getAppVar'), null],

    /// ///////////////////////////////////////////////////////////////////////
    // store different names on each pico
    [
      signalA('store', 'name', { name: 'Alf' }),
      [{ name: 'store_name', options: { name: 'Alf' } }]
    ],
    [
      signalB('store', 'name', { name: 'Bob' }),
      [{ name: 'store_name', options: { name: 'Bob' } }]
    ],
    // pico's should have their respective names
    [queryA('getName'), 'Alf'],
    [queryB('getName'), 'Bob'],

    /// ///////////////////////////////////////////////////////////////////////
    // app vars are shared per-ruleset
    [
      signalA('store', 'appvar', { appvar: 'Some appvar' }),
      [{ name: 'store_appvar', options: { appvar: 'Some appvar' } }]
    ],
    [queryA('getAppVar'), 'Some appvar'],
    [queryB('getAppVar'), 'Some appvar'],
    [
      signalB('store', 'appvar', { appvar: 'Changed by B' }),
      [{ name: 'store_appvar', options: { appvar: 'Changed by B' } }]
    ],
    [queryA('getAppVar'), 'Changed by B'],
    [queryB('getAppVar'), 'Changed by B'],

    /// ///////////////////////////////////////////////////////////////////////
    // query paths
    [
      signalA('store', 'user_firstname', { firstname: 'Leonard' }),
      [{ name: 'store_user_firstname', options: { name: 'Leonard' } }]
    ],
    [queryA('getUser'), { firstname: 'Leonard', 'lastname': 'McCoy' }],
    [queryA('getUserFirstname'), 'Leonard'],

    /// ///////////////////////////////////////////////////////////////////////
    // clear vars
    function (done) {
      pe.dbDump().then(function (data) {
        t.truthy(_.has(data, entvarPath))
        t.truthy(_.has(data, appvarPath))
        done()
      }, done)
    },
    [signalA('store', 'clear_user'), [{ name: 'clear_user', options: {} }]],
    function (done) {
      pe.dbDump().then(function (data) {
        t.falsy(_.has(data, entvarPath))
        t.truthy(_.has(data, appvarPath))
        done()
      }, done)
    },
    [signalA('store', 'clear_appvar'), [{ name: 'clear_appvar', options: {} }]],
    function (done) {
      pe.dbDump().then(function (data) {
        t.falsy(_.has(data, entvarPath))
        t.falsy(_.has(data, appvarPath))
        done()
      }, done)
    }
  ])
})

test('PicoEngine - io.picolabs.events ruleset', async function (t) {
  var pe = await mkTestPicoEngine({
    rootRIDs: [
      'io.picolabs.events'
    ]
  })

  var query = mkQueryTask(pe, 'id1', 'io.picolabs.events')
  var signal = mkSignalTask(pe, 'id1')

  await testOutputs(t, [
    [
      signal('events', 'bind', { name: 'blah?!' }),
      [{ name: 'bound', options: { name: 'blah?!' } }]
    ],
    [
      signal('events', 'get', { thing: 'asdf' }),
      [{ name: 'get', options: { thing: 'asdf' } }]
    ],
    [
      signal('events', 'noop', {}),
      []
    ],
    [
      signal('events', 'noop2', {}),
      []
    ],
    [
      signal('events', 'ignored', {}), // is inactive
      []
    ],
    [
      signal('events', 'ifthen', { name: 'something' }),
      [{ name: 'ifthen', options: {} }]
    ],
    [
      signal('events', 'ifthen', {}),
      []
    ],
    [
      signal('events', 'on_fired', { name: 'blah' }),
      [{ name: 'on_fired', options: { previous_name: undefined } }]
    ],
    [
      signal('events', 'on_fired', {}),
      [{ name: 'on_fired', options: { previous_name: 'blah' } }]
    ],
    [
      signal('events', 'on_choose', { thing: 'one' }),
      [{ name: 'on_choose - one', options: {} }]
    ],
    [query('getOnChooseFired'), true],
    [
      signal('events', 'on_choose', { thing: 'two' }),
      [{ name: 'on_choose - two', options: {} }]
    ],
    [
      signal('events', 'on_choose', { thing: 'wat?' }),
      []
    ],
    [query('getOnChooseFired'), true], // still true even though no match
    [
      signal('events', 'on_choose_if', { fire: 'no', thing: 'one' }),
      []// condition failed
    ],
    [query('getOnChooseFired'), false], // b/c condition failed
    [
      signal('events', 'on_choose_if', { fire: 'yes', thing: 'one' }),
      [{ name: 'on_choose_if - one', options: {} }]
    ],
    [query('getOnChooseFired'), true],
    [
      signal('events', 'on_choose_if', { fire: 'yes', thing: 'wat?' }),
      []
    ],
    [query('getOnChooseFired'), true], // b/c condition true
    function (next) {
      signal('events', 'on_sample')(function (err, resp) {
        if (err) return next(err)
        t.is(_.size(resp.directives), 1, 'only one action should be sampled')
        t.truthy(/^on_sample - (one|two|three)$/.test(_.head(resp.directives).name))
        next()
      })
    },
    [
      signal('events', 'on_sample_if'),
      []// nothing b/c it did not fire
    ],
    function (next) {
      signal('events', 'on_sample_if', { fire: 'yes' })(function (err, resp) {
        if (err) return next(err)
        t.is(_.size(resp.directives), 1, 'only one action should be sampled')
        t.truthy(/^on_sample - (one|two|three)$/.test(_.head(resp.directives).name))
        next()
      })
    },
    [
      signal('events', 'select_where', { something: 'wat?' }),
      [{ name: 'select_where', options: {} }]
    ],
    [
      signal('events', 'select_where', { something: 'ok wat?' }),
      []
    ],
    [
      signal('events', 'where_match_0', { something: 0 }),
      [{ name: 'where_match_0', options: {} }]
    ],
    [
      signal('events', 'where_match_null', { something: null }),
      [{ name: 'where_match_null', options: {} }]
    ],
    [
      signal('events', 'where_match_false', { something: false }),
      [{ name: 'where_match_false', options: {} }]
    ],
    [
      signal('events', 'where_match_empty_str', { something: '' }),
      [{ name: 'where_match_empty_str', options: {} }]
    ],
    [
      signal('events', 'where_after_setting', { a: 'one' }),
      [{ name: 'where_after_setting', options: {} }]
    ],
    [
      signal('events', 'where_after_setting', { a: 'two' }),
      []
    ],
    [
      // test that select() scope overrides the global scope
      signal('events', 'where_using_global', { a: 'g one' }),
      [{ name: 'where_using_global', options: {} }]
    ],
    [
      // test that event:attr scope doesn't stomp over global
      signal('events', 'where_using_global', { a: 'g one', global1: 'haha! if this works the rule will not select' }),
      [{ name: 'where_using_global', options: {} }]
    ],
    [
      // test that event:attr scope doesn't stomp over setting()
      signal('events', 'where_using_global', { a: 'g one', global0: 'haha! if this works the rule will not select' }),
      [{ name: 'where_using_global', options: {} }]
    ],
    [
      signal('events', 'implicit_match_0', { something: 0 }),
      [{ name: 'implicit_match_0', options: {} }]
    ],
    [
      signal('events', 'implicit_match_null', { something: null }),
      [{ options: {}, name: 'implicit_match_null' }]
    ],
    [
      signal('events', 'implicit_match_false', { something: false }),
      [{ options: {}, name: 'implicit_match_false' }]
    ],
    [
      signal('events', 'implicit_match_empty_str', { something: '' }),
      [{ options: {}, name: 'implicit_match_empty_str' }]
    ],
    [signal('events', 'no_action', { fired: 'no' }), []],
    [query('getNoActionFired'), null],
    [signal('events', 'no_action', { fired: 'yes' }), []],
    [query('getNoActionFired'), true], // fired even though no actions

    // Testing action event:send
    [signal('events', 'store_sent_name', { name: 'Bob' }), []],
    [query('getSentAttrs'), { name: 'Bob' }],
    [query('getSentName'), 'Bob'],
    [signal('events', 'action_send', { name: 'Jim' }), []],
    // this should in turn call store_sent_name and change it
    [query('getSentAttrs'), { name: 'Jim', empty: [], r: 're#hi#i' }],
    [query('getSentName'), 'Jim'],

    /// ///////////////////////////////////////////////////////////////////////
    // Testing raise <domain> event
    [signal('events', 'raise_basic'), [
      { name: 'event_attrs', options: { attrs: {} } }
    ]],

    [signal('events', 'raise_set_name', { name: 'Raised' }), []],
    [query('getSentAttrs'), { name: 'Raised' }],
    [query('getSentName'), 'Raised'],

    [signal('events', 'raise_set_name_attr', { name: 'Raised-2' }), []],
    [query('getSentAttrs'), { name: 'Raised-2' }],
    [query('getSentName'), 'Raised-2'],

    [signal('events', 'raise_set_name_rid', { name: 'Raised-3' }), []],
    [query('getSentAttrs'), { name: 'Raised-3' }],
    [query('getSentName'), 'Raised-3'],

    /// ///////////////////////////////////////////////////////////////////////
    // Testing raise event <domainAndType>
    [signal('events', 'raise_dynamic', { domainType: 'events:store_sent_name', name: 'Mr. Dynamic' }), []],
    [query('getSentName'), 'Mr. Dynamic'],

    [
      signal('events', 'raise_dynamic', { domainType: 'events:get', thing: 'something?' }),
      [{ name: 'get', options: { thing: 'something?' } }]
    ],

    /// ///////////////////////////////////////////////////////////////////////
    [
      signal('events', 'event_eid', {}, void 0, 'some eid for this test'),
      [{ name: 'event_eid', options: { eid: 'some eid for this test' } }]
    ]
  ])
})

test('PicoEngine - io.picolabs.scope ruleset', async function (t) {
  var pe = await mkTestPicoEngine({
    rootRIDs: [
      'io.picolabs.scope'
    ]
  })

  var query = mkQueryTask(pe, 'id1', 'io.picolabs.scope')
  var signal = mkSignalTask(pe, 'id1')

  await testOutputs(t, [

    // Testing how setting() variables work on `or`
    [
      signal('scope', 'eventOr0', { name: '000' }),
      [{ name: 'eventOr', options: { name0: '000', name1: void 0 } }]
    ],
    [
      signal('scope', 'eventOr1', { name: '111' }),
      [{ name: 'eventOr', options: { name0: void 0, name1: '111' } }]
    ],
    [
      signal('scope', 'eventOr0', {}),
      [{ name: 'eventOr', options: { name0: '', name1: void 0 } }]
    ],
    [
      signal('scope', 'eventOr1', { name: '?' }),
      [{ name: 'eventOr', options: { name0: void 0, name1: '?' } }]
    ],

    // setting() variables should be persisted until the rule fires
    [signal('scope', 'eventAnd0', { name: '000' }), []],
    [
      signal('scope', 'eventAnd1', { name: '111' }),
      [{ name: 'eventAnd', options: { name0: '000', name1: '111' } }]
    ],

    // setting() variables should be persisted until the rule fires or time runs out
    [signal('scope', 'eventWithin1', { name: '111' }, new Date(10000000000000)), []],
    [
      signal('scope', 'eventWithin2', { name: '222' }, new Date(10000000000007)),
      [{ name: 'eventWithin', options: { name1: '111', name2: '222' } }]
    ],
    // now let too much time pass for it to remember 111
    [signal('scope', 'eventWithin1', { name: '111' }, new Date(10000000000000)), []],
    [signal('scope', 'eventWithin0', {}, new Date(10000000007000)), []],
    [
      signal('scope', 'eventWithin2', { name: '222' }, new Date(10000000007007)),
      [{ name: 'eventWithin', options: { name1: void 0, name2: '222' } }]
    ],
    [signal('scope', 'eventWithin1', { name: 'aaa' }, new Date(10000000007008)), []],
    [
      signal('scope', 'eventWithin3', {}, new Date(10000000007009)),
      [{ name: 'eventWithin', options: { name1: 'aaa', name2: void 0 } }]
    ],

    // Testing the scope of the prelude block
    [
      signal('scope', 'prelude', { name: 'Bill' }),
      [{ name: 'say',
        options: {
          name: 'Bill',
          p0: 'prelude 0',
          p1: 'prelude 1',
          g0: 'global 0'
        } }]
    ],
    [
      query('getVals'),
      { name: 'Bill', p0: 'prelude 0', p1: 'prelude 1' }
    ],
    [
      query('g0'),
      'global 0'
    ],
    [
      query('add', { 'a': 10, 'b': 2 }),
      12
    ],
    [
      query('sum', { 'arr': [1, 2, 3, 4, 5] }),
      15
    ],
    [
      signal('scope', 'functions'),
      [{ name: 'say',
        options: {
          add_one_two: 3,
          inc5_3: 8,
          g0: 'overrided g0!'
        } }]
    ],
    [
      query('mapped'),
      [2, 3, 4]
    ]
  ])
})

test('PicoEngine - io.picolabs.operators ruleset', async function (t) {
  var pe = await mkTestPicoEngine({
    rootRIDs: [
      'io.picolabs.operators'
    ]
  })

  var query = mkQueryTask(pe, 'id1', 'io.picolabs.operators')

  await testOutputs(t, [
    [
      query('results'),
      {
        'str_as_num': 100.25,
        'num_as_str': '1.05',
        'regex_as_str': 're#blah#i',
        'isnull': [
          false,
          false,
          true
        ],
        'typeof': [
          'Number',
          'String',
          'String',
          'Array',
          'Map',
          'RegExp',
          'Null',
          'Null'
        ],
        '75.chr()': 'K',
        '0.range(10)': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        '10.sprintf': '< 10>',
        '.capitalize()': 'Hello World',
        '.decode()': [3, 4, 5],
        '.extract': ['s is a st', 'ring'],
        '.lc()': 'hello world',
        '.match true': true,
        '.match false': false,
        '.ord()': 72,
        '.replace': 'Hello Billiam!',
        '.split': ['a', 'b', 'c'],
        '.sprintf': 'Hello Jim!',
        '.substr(5)': 'is a string',
        '.substr(5, 4)': 'is a',
        '.substr(5, -5)': 'is a s',
        '.substr(25)': '',
        '.uc()': 'HELLO WORLD'
      }
    ],
    [
      query('returnMapAfterKlog'),
      { a: 1 }
    ],
    [
      query('returnArrayAfterKlog'),
      [1, 2]
    ]
  ])
})

test('PicoEngine - io.picolabs.chevron ruleset', async function (t) {
  var pe = await mkTestPicoEngine({
    rootRIDs: [
      'io.picolabs.chevron'
    ]
  })

  var resp = await pe.runQuery({
    eci: 'id1',
    rid: 'io.picolabs.chevron',
    name: 'd'
  })
  t.is(resp, '\n            hi 1 + 2 = 3\n            <h1>some<b>html</b></h1>\n        ')
})

test('PicoEngine - io.picolabs.execution-order ruleset', async function (t) {
  var pe = await mkTestPicoEngine({
    rootRIDs: [
      'io.picolabs.execution-order'
    ]
  })

  var query = mkQueryTask(pe, 'id1', 'io.picolabs.execution-order')
  var signal = mkSignalTask(pe, 'id1')
  var query2 = mkQueryTask(pe, 'id1', 'io.picolabs.execution-order2')

  await testOutputs(t, [
    [
      query('getOrder'),
      null
    ],
    [
      signal('execution_order', 'all'),
      [{ name: 'first', options: {} }, { name: 'second', options: {} }]
    ],
    [
      query('getOrder'),
      [null, 'first-fired', 'first-finally', 'second-fired', 'second-finally']
    ],
    [
      signal('execution_order', 'reset_order'),
      [{ name: 'reset_order', options: {} }]
    ],
    [
      query('getOrder'),
      []
    ],
    [
      signal('execution_order', 'foo'),
      [{ name: 'foo_or_bar', options: {} }, { name: 'foo', options: {} }]
    ],
    [
      signal('execution_order', 'bar'),
      [{ name: 'foo_or_bar', options: {} }, { name: 'bar', options: {} }]
    ],
    [
      query('getOrder'),
      ['foo_or_bar', 'foo', 'foo_or_bar', 'bar']
    ],
    function (next) {
      pe.installRuleset('id0', 'io.picolabs.execution-order2')
        .then(function (data) { next(null, data) }, next)
    },
    [
      signal('execution_order', 'reset_order'),
      [{ name: 'reset_order', options: {} }, { name: '2 - reset_order', options: {} }]
    ],
    [
      signal('execution_order', 'bar'),
      [
        { name: 'foo_or_bar', options: {} },
        { name: 'bar', options: {} },
        { name: '2 - foo_or_bar', options: {} },
        { name: '2 - bar', options: {} }
      ]
    ],
    [
      query('getOrder'),
      ['foo_or_bar', 'bar']
    ],
    [
      query2('getOrder'),
      ['2 - foo_or_bar', '2 - bar']
    ]
  ])
})

test('PicoEngine - io.picolabs.engine ruleset', async function (t) {
  var pe = await mkTestPicoEngine({
    rootRIDs: [
      'io.picolabs.engine'
    ]
  })

  var signal = mkSignalTask(pe, 'id1')

  await testOutputs(t, [
    [signal('engine', 'newPico'), []],
    [
      signal('engine', 'newChannel', {
        pico_id: 'id2',
        name: 'krl created chan',
        type: 'some type?'
      }),
      []
    ],
    [signal('engine', 'installRuleset', {
      pico_id: 'id2',
      rid: 'io.picolabs.meta'
    }), []],
    [signal('engine', 'installRuleset', {
      pico_id: 'id2',
      base: urlPrefix,
      url: 'scope.krl'
    }), []],
    function (done) {
      pe.dbDump().then(function (data) {
        t.deepEqual(data['pico-ruleset'], {
          'id0': {
            'io.picolabs.engine': { on: true }
          },
          'id2': {
            'io.picolabs.meta': { on: true },
            'io.picolabs.scope': { on: true }
          }
        })
        done()
      }, done)
    },
    function (done) {
      pe.dbDump().then(function (data) {
        t.deepEqual(data.channel.id4, {
          id: 'id4',
          name: 'krl created chan',
          pico_id: 'id2',
          type: 'some type?',
          policy_id: ADMIN_POLICY_ID,
          sovrin: {
            did: 'id4',
            verifyKey: 'verifyKey_id4'
          }
        }, 'channel is there before')
        done()
      }, done)
    },
    [
      signal('engine', 'removeChannel', {
        eci: 'id4'
      }),
      []
    ],
    function (done) {
      pe.dbDump().then(function (data) {
        t.deepEqual(data.channel.id4, void 0, 'channel has been removed')
        done()
      }, done)
    }
  ])
})

test('PicoEngine - io.picolabs.module-used ruleset', async function (t) {
  var pe = await mkTestPicoEngine({
    rootRIDs: [
      'io.picolabs.module-used'
    ]
  })

  var query = mkQueryTask(pe, 'id1', 'io.picolabs.module-defined')
  var queryUsed = mkQueryTask(pe, 'id1', 'io.picolabs.module-used')
  var signal = mkSignalTask(pe, 'id1')

  await testOutputs(t, [

    // Test overiding module configurations
    [
      signal('module_used', 'dflt_name'),
      [{ name: 'dflt_name', options: { name: 'Bob' } }]
    ],
    [
      signal('module_used', 'conf_name'),
      [{ name: 'conf_name', options: { name: 'Jim' } }]
    ],

    // Test using a module in the global block
    [queryUsed('dfltName'), 'Bob'],

    // Test using provided functions that use `ent` vars
    // NOTE: the dependent ruleset is NOT added to the pico
    [
      signal('module_used', 'dflt_info'),
      [{ name: 'dflt_info',
        options: { info: {
          name: 'Bob',
          memo: void 0, // there is nothing stored in that `ent` var on this pico
          privateFn: 'privateFn = name: Bob memo: null'
        } } }]
    ],
    [
      signal('module_used', 'conf_info'),
      [{ name: 'conf_info',
        options: { info: {
          name: 'Jim',
          memo: void 0, // there is nothing stored in that `ent` var on this pico
          privateFn: 'privateFn = name: Jim memo: null'
        } } }]
    ],

    // Assert dependant module is not added to the pico
    [
      signal('module_defined', 'store_memo', { memo: 'foo' }),
      []// should not respond to this event
    ],
    function (next) {
      pe.installRuleset('id0', 'io.picolabs.module-defined')
        .then(function (data) { next(null, data) }, next)
    },
    [
      signal('module_defined', 'store_memo', { memo: 'foo' }),
      [{ name: 'store_memo',
        options: {
          name: 'Bob', // the default is used when a module is added to a pico
          memo_to_store: 'foo'
        } }]
    ],
    [
      query('getInfo'),
      {
        name: 'Bob',
        memo: '["foo" by Bob]',
        privateFn: 'privateFn = name: Bob memo: ["foo" by Bob]'
      }
    ],
    [
      signal('module_used', 'dflt_info'),
      [{ name: 'dflt_info',
        options: { info: {
          name: 'Bob',
          memo: '["foo" by Bob]',
          privateFn: 'privateFn = name: Bob memo: ["foo" by Bob]'
        } } }]
    ],
    [
      signal('module_used', 'conf_info'),
      [{ name: 'conf_info',
        options: { info: {
          name: 'Jim', // the overrided config is used here
          memo: '["foo" by Bob]', // the memo was stored on the pico ruleset with default config
          privateFn: 'privateFn = name: Jim memo: ["foo" by Bob]'
        } } }]
    ],
    function (next) {
      pe.runQuery({
        eci: 'id1',
        rid: 'io.picolabs.module-used',
        name: 'now',
        args: {}
      }, function (err, ts) {
        if (err) return next(err)
        t.truthy(/^[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T/.test(ts))
        next()
      })
    },

    // Test using defaction s provided by the module
    [
      signal('module_used', 'dflt_getInfoAction'),
      [{ name: 'getInfoAction',
        options: {
          name: 'Bob',
          memo: '["foo" by Bob]',
          privateFn: 'privateFn = name: Bob memo: ["foo" by Bob]'
        } }]
    ],
    [queryUsed('getEntVal'), { name: 'Bob' }],

    [
      signal('module_used', 'conf_getInfoAction'),
      [{ name: 'getInfoAction',
        options: {
          name: 'Jim', // the overrided config is used here
          memo: '["foo" by Bob]', // the memo was stored on the pico ruleset with default config
          privateFn: 'privateFn = name: Jim memo: ["foo" by Bob]'
        } }]
    ],
    [queryUsed('getEntVal'), { name: 'Jim' }]
  ])

  // Test unregisterRuleset checks
  let err = await t.throwsAsync(pe.unregisterRuleset('io.picolabs.module-defined'))
  t.is(err + '', 'Error: "io.picolabs.module-defined" is depended on by "io.picolabs.module-used"')

  err = await t.throwsAsync(pe.unregisterRuleset('io.picolabs.module-used'))
  t.is(err + '', 'Error: Unable to unregister "io.picolabs.module-used": it is installed on at least one pico')
})

test('PicoEngine - io.picolabs.expressions ruleset', async function (t) {
  var pe = await mkTestPicoEngine({
    rootRIDs: [
      'io.picolabs.expressions'
    ]
  })

  var query = mkQueryTask(pe, 'id1', 'io.picolabs.expressions')

  await testOutputs(t, [
    [
      query('obj'),
      {
        a: 1,
        b: { c: [2, 3, 4, { d: { e: 5 } }, 6, 7] }
      }
    ],
    [
      query('path1'),
      { e: 5 }
    ],
    [
      query('path2'),
      7
    ],
    [
      query('index1'),
      1
    ],
    [
      query('index2'),
      3
    ],
    [
      query('paramFnTest'),
      [
        [4, 6, '6?'],
        ['one', 'one2', 'one2?'],
        [3, 4, 5]
      ]
    ]
  ])
})

test('PicoEngine - io.picolabs.meta ruleset', async function (t) {
  var pe = await mkTestPicoEngine({
    rootRIDs: [
      'io.picolabs.meta'
    ]
  })

  var query = mkQueryTask(pe, 'id1', 'io.picolabs.meta')
  var signal = mkSignalTask(pe, 'id1')

  await testOutputs(t, [
    [
      signal('meta', 'event'),
      [{ name: 'event',
        options: {
          rid: 'io.picolabs.meta',
          host: 'https://test-host',
          rulesetName: 'testing meta module',
          rulesetDescription: '\nsome description for the meta test module\n        ',
          rulesetAuthor: 'meta author',
          rulesetURI: urlPrefix + 'meta.krl',
          ruleName: 'meta_event',
          inEvent: true,
          inQuery: false,
          eci: 'id1'
        } }]
    ],
    [
      query('metaQuery'),
      {
        rid: 'io.picolabs.meta',
        host: 'https://test-host',
        rulesetName: 'testing meta module',
        rulesetDescription: '\nsome description for the meta test module\n        ',
        rulesetAuthor: 'meta author',
        rulesetURI: urlPrefix + 'meta.krl',
        ruleName: null,
        inEvent: false,
        inQuery: true,
        eci: 'id1'
      }
    ]
  ])
})

test('PicoEngine - io.picolabs.http ruleset', async function (t) {
  var pe = await mkTestPicoEngine({
    rootRIDs: ['io.picolabs.http']
  })

  var query = mkQueryTaskP(pe, 'id1', 'io.picolabs.http')
  var signal = mkSignalTaskP(pe, 'id1')

  var server = http.createServer(function (req, res) {
    var body = ''
    req.on('data', function (buffer) {
      body += buffer.toString()
    })
    req.on('end', function () {
      var out = JSON.stringify({
        url: req.url,
        headers: req.headers,
        body: body
      }, false, 2)
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(out)
      })
      res.end(out)
    })
  })
  server.unref()
  await new Promise(function (resolve) {
    server.listen(0, resolve)
  })

  var url = 'http://localhost:' + server.address().port

  t.deepEqual(await signal('http_test', 'get', { url: url }), [])

  t.deepEqual(await query('getResp'), {
    content: {
      url: '/?foo=bar',
      headers: {
        baz: 'quix',
        connection: 'close',
        host: 'localhost:' + server.address().port
      },
      body: ''
    },
    content_type: 'application/json',
    status_code: 200,
    status_line: 'OK',
    headers: {
      'content-type': 'application/json',
      'connection': 'close'
    }
  })

  t.deepEqual(await signal('http_test', 'post', { url: url }), [
    { options: {
      foo: 'bar',
      baz: '[Action]' // Notice this is using KRL's json encoding
    },
    name: 'resp.content.body' }
  ])
  t.deepEqual(await signal('http_test', 'post_setting', { url: url }), [], 'nothing should be returned')

  t.deepEqual(await query('getResp'), {
    content: {
      url: '/?foo=bar',
      headers: {
        connection: 'close',
        'content-type': 'application/x-www-form-urlencoded',
        host: 'localhost:' + server.address().port
      },
      body: 'baz=qux'
    },
    content_type: 'application/json',
    status_code: 200,
    status_line: 'OK',
    headers: {
      'content-type': 'application/json',
      'connection': 'close'
    }
  })

  // testing autoraise
  t.deepEqual(await signal('http_test', 'autoraise', { url: url }), [
    // autoraise happens on the same event schedule
    {
      name: 'http_post_event_handler',
      options: { attrs: {
        content: {
          body: 'baz=qux',
          headers: {
            connection: 'close',
            'content-type': 'application/x-www-form-urlencoded',
            host: 'localhost:' + server.address().port
          },
          url: '/?foo=bar'
        },
        content_type: 'application/json',
        headers: {
          connection: 'close',
          'content-type': 'application/json'
        },
        label: 'foobar',
        status_code: 200,
        status_line: 'OK'
      } }
    }
  ])
  t.deepEqual(await query('getLastPostEvent'), {
    content: {
      body: 'baz=qux',
      headers: {
        connection: 'close',
        'content-type': 'application/x-www-form-urlencoded',
        host: 'localhost:' + server.address().port
      },
      url: '/?foo=bar'
    },
    content_type: 'application/json',
    headers: {
      connection: 'close',
      'content-type': 'application/json'
    },
    label: 'foobar',
    status_code: 200,
    status_line: 'OK'
  })

  await t.notThrowsAsync(query('fnGet', { url: url, qs: { hi: 'fn' } }))
  pe.emitter.once('error', _.noop)
  t.is('' + await t.throwsAsync(query('fnPost')), 'Error: actions can only be called in the rule action block')
})

test('PicoEngine - io.picolabs.foreach ruleset', async function (t) {
  var pe = await mkTestPicoEngine({
    rootRIDs: [
      'io.picolabs.foreach'
    ]
  })

  var signal = mkSignalTask(pe, 'id1')

  await testOutputs(t, [
    [
      signal('foreach', 'basic'),
      [
        { name: 'basic', options: { x: 1 } },
        { name: 'basic', options: { x: 2 } },
        { name: 'basic', options: { x: 3 } }
      ]
    ],
    [
      signal('foreach', 'map'),
      [
        { name: 'map', options: { k: 'a', v: 1 } },
        { name: 'map', options: { k: 'b', v: 2 } },
        { name: 'map', options: { k: 'c', v: 3 } }
      ]
    ],
    [
      signal('foreach', 'nested'),
      [
        { name: 'nested', options: { x: 1, y: 'a' } },
        { name: 'nested', options: { x: 1, y: 'b' } },
        { name: 'nested', options: { x: 1, y: 'c' } },
        { name: 'nested', options: { x: 2, y: 'a' } },
        { name: 'nested', options: { x: 2, y: 'b' } },
        { name: 'nested', options: { x: 2, y: 'c' } },
        { name: 'nested', options: { x: 3, y: 'a' } },
        { name: 'nested', options: { x: 3, y: 'b' } },
        { name: 'nested', options: { x: 3, y: 'c' } }
      ]
    ],
    [
      signal('foreach', 'scope'),
      [
        { name: 'scope', options: { foo: 1, bar: 0, baz: 0 } },
        { name: 'scope', options: { foo: 1, bar: 1, baz: 1 } },

        { name: 'scope', options: { foo: 2, bar: 0, baz: 0 } },
        { name: 'scope', options: { foo: 2, bar: 1, baz: 2 } },
        { name: 'scope', options: { foo: 2, bar: 2, baz: 4 } },

        { name: 'scope', options: { foo: 3, bar: 0, baz: 0 } },
        { name: 'scope', options: { foo: 3, bar: 1, baz: 3 } },
        { name: 'scope', options: { foo: 3, bar: 2, baz: 6 } },
        { name: 'scope', options: { foo: 3, bar: 3, baz: 9 } },

        { name: 'scope', options: { foo: 1, bar: 0, baz: 0 } },
        { name: 'scope', options: { foo: 1, bar: 1, baz: 1 } },

        { name: 'scope', options: { foo: 2, bar: 0, baz: 0 } },
        { name: 'scope', options: { foo: 2, bar: 1, baz: 2 } },
        { name: 'scope', options: { foo: 2, bar: 2, baz: 4 } },

        { name: 'scope', options: { foo: 3, bar: 0, baz: 0 } },
        { name: 'scope', options: { foo: 3, bar: 1, baz: 3 } },
        { name: 'scope', options: { foo: 3, bar: 2, baz: 6 } },
        { name: 'scope', options: { foo: 3, bar: 3, baz: 9 } }
      ]
    ],

    [
      signal('foreach', 'final', { x: 'a', y: '0' }),
      [
        { name: 'final', options: { x: 'a', y: '0' } },
        { name: 'final_raised', options: { x: 'a', y: '0' } }
      ]
    ],
    [
      signal('foreach', 'final', { x: 'a', y: '0,1' }),
      [
        { name: 'final', options: { x: 'a', y: '0' } },
        { name: 'final', options: { x: 'a', y: '1' } },
        { name: 'final_raised', options: { x: 'a', y: '1' } }
      ]
    ],
    [
      signal('foreach', 'final', { x: 'a,b', y: '0,1' }),
      [
        { name: 'final', options: { x: 'a', y: '0' } },
        { name: 'final', options: { x: 'a', y: '1' } },
        { name: 'final', options: { x: 'b', y: '0' } },
        { name: 'final', options: { x: 'b', y: '1' } },
        { name: 'final_raised', options: { x: 'b', y: '1' } }
      ]
    ],
    [
      signal('foreach', 'key_vs_index'),
      [
        { name: 'key_vs_index', options: { a: 'bar', k: 'foo', b: 'one', i: 0 } },
        { name: 'key_vs_index', options: { a: 'bar', k: 'foo', b: 'two', i: 1 } },
        { name: 'key_vs_index', options: { a: 'bar', k: 'foo', b: 'three', i: 2 } },
        { name: 'key_vs_index', options: { a: 'qux', k: 'baz', b: 'one', i: 0 } },
        { name: 'key_vs_index', options: { a: 'qux', k: 'baz', b: 'two', i: 1 } },
        { name: 'key_vs_index', options: { a: 'qux', k: 'baz', b: 'three', i: 2 } }
      ]
    ]
  ])
})

test('PicoEngine - io.picolabs.event-exp ruleset', async function (t) {
  var pe = await mkTestPicoEngine({
    rootRIDs: [
      'io.picolabs.event-exp'
    ]
  })

  var signal = mkSignalTask(pe, 'id1')

  await testOutputs(t, _.map([

    ['ee_before', 'a'],
    ['ee_before', 'b', {}, 'before'],
    ['ee_before', 'b'],
    ['ee_before', 'b'],
    ['ee_before', 'a'],
    ['ee_before', 'a'],
    ['ee_before', 'c'],
    ['ee_before', 'b', {}, 'before'],

    ['ee_after', 'a'],
    ['ee_after', 'b'],
    ['ee_after', 'a', {}, 'after'],
    ['ee_after', 'a'],
    ['ee_after', 'a'],
    ['ee_after', 'b'],
    ['ee_after', 'c'],
    ['ee_after', 'a', {}, 'after'],

    ['ee_then', 'a', { name: 'bob' }],
    ['ee_then', 'b', { name: 'bob' }, 'then'],
    ['ee_then', 'b', { name: 'bob' }],
    ['ee_then', 'a', { name: 'bob' }],
    ['ee_then', 'b', { name: '...' }],
    ['ee_then', 'b', { name: 'bob' }],

    ['ee_and', 'a'],
    ['ee_and', 'c'],
    ['ee_and', 'b', {}, 'and'],
    ['ee_and', 'b'],
    ['ee_and', 'a', {}, 'and'],
    ['ee_and', 'b'],
    ['ee_and', 'b'],
    ['ee_and', 'b'],
    ['ee_and', 'a', {}, 'and'],

    ['ee_or', 'a', {}, 'or'],
    ['ee_or', 'b', {}, 'or'],
    ['ee_or', 'c'],

    ['ee_between', 'b'],
    ['ee_between', 'a'],
    ['ee_between', 'c', {}, 'between'],
    ['ee_between', 'b'],
    ['ee_between', 'a'],
    ['ee_between', 'a'],
    ['ee_between', 'c', {}, 'between'],
    ['ee_between', 'b'],
    ['ee_between', 'a'],
    ['ee_between', 'b'],
    ['ee_between', 'c', {}, 'between'],

    ['ee_not_between', 'b'],
    ['ee_not_between', 'c', {}, 'not between'],
    ['ee_not_between', 'b'],
    ['ee_not_between', 'a'],
    ['ee_not_between', 'c'],
    ['ee_not_between', 'b'],
    ['ee_not_between', 'c', {}, 'not between'],
    ['ee_not_between', 'c'],

    ['ee_andor', 'c', {}, '(a and b) or c'],
    ['ee_andor', 'a'],
    ['ee_andor', 'c'],
    ['ee_andor', 'b', {}, '(a and b) or c'],

    ['ee_orand', 'a'],
    ['ee_orand', 'b', {}, 'a and (b or c)'],
    ['ee_orand', 'c'],
    ['ee_orand', 'a', {}, 'a and (b or c)'],

    ['ee_and_n', 'a'],
    ['ee_and_n', 'c'],
    ['ee_and_n', 'b', {}, 'and_n'],

    ['ee_or_n', 'a', {}, 'or_n'],
    ['ee_or_n', 'd', {}, 'or_n'],

    ['ee_any', 'a'],
    ['ee_any', 'a'],
    ['ee_any', 'b', {}, 'any'],
    ['ee_any', 'c'],
    ['ee_any', 'a', {}, 'any'],

    ['ee_count', 'a'],
    ['ee_count', 'a'],
    ['ee_count', 'a', {}, 'count'],
    ['ee_count', 'a'],
    ['ee_count', 'a'],
    ['ee_count', 'a', {}, 'count'],
    ['ee_count', 'a'],

    ['ee_repeat', 'a', { name: 'bob' }],
    ['ee_repeat', 'a', { name: 'bob' }],
    ['ee_repeat', 'a', { name: 'bob' }, 'repeat'],
    ['ee_repeat', 'a', { name: 'bob' }, 'repeat'],
    ['ee_repeat', 'a', { name: '...' }],
    ['ee_repeat', 'a', { name: 'bob' }],

    ['ee_count_max', 'a', { b: '3' }],
    ['ee_count_max', 'a', { b: '8' }],
    ['ee_count_max', 'a', { b: '5' }, { name: 'count_max', options: { m: 8 } }],
    ['ee_count_max', 'a', { b: '1' }],
    ['ee_count_max', 'a', { b: '0' }],
    ['ee_count_max', 'a', { b: '0' }, { name: 'count_max', options: { m: 1 } }],
    ['ee_count_max', 'a', { b: '0' }],
    ['ee_count_max', 'a', { b: '0' }],
    ['ee_count_max', 'a', { b: '7' }, { name: 'count_max', options: { m: 7 } }],

    ['ee_repeat_min', 'a', { b: '5' }],
    ['ee_repeat_min', 'a', { b: '3' }],
    ['ee_repeat_min', 'a', { b: '4' }, { name: 'repeat_min', options: { m: 3 } }],
    ['ee_repeat_min', 'a', { b: '5' }, { name: 'repeat_min', options: { m: 3 } }],
    ['ee_repeat_min', 'a', { b: '6' }, { name: 'repeat_min', options: { m: 4 } }],
    ['ee_repeat_min', 'a', { b: null }],
    ['ee_repeat_min', 'a', { b: '3' }],
    ['ee_repeat_min', 'a', { b: '8' }],
    ['ee_repeat_min', 'a', { b: '1' }, { name: 'repeat_min', options: { m: 1 } }],
    ['ee_repeat_min', 'a', { b: '2' }, { name: 'repeat_min', options: { m: 1 } }],
    ['ee_repeat_min', 'a', { b: '3' }, { name: 'repeat_min', options: { m: 1 } }],
    ['ee_repeat_min', 'a', { b: '4' }, { name: 'repeat_min', options: { m: 2 } }],
    ['ee_repeat_min', 'a', { b: '5' }, { name: 'repeat_min', options: { m: 3 } }],
    ['ee_repeat_min', 'a', { b: '6' }, { name: 'repeat_min', options: { m: 4 } }],
    ['ee_repeat_min', 'a', { b: '7' }, { name: 'repeat_min', options: { m: 5 } }],

    ['ee_repeat_sum', 'a', { b: '1' }],
    ['ee_repeat_sum', 'a', { b: '2' }],
    ['ee_repeat_sum', 'a', { b: '3' }, { name: 'repeat_sum', options: { m: 6 } }],
    ['ee_repeat_sum', 'a', { b: '4' }, { name: 'repeat_sum', options: { m: 9 } }],

    ['ee_repeat_avg', 'a', { b: '1' }],
    ['ee_repeat_avg', 'a', { b: '2' }],
    ['ee_repeat_avg', 'a', { b: '3' }, { name: 'repeat_avg', options: { m: 2 } }],
    ['ee_repeat_avg', 'a', { b: '100' }, { name: 'repeat_avg', options: { m: 35 } }],

    ['ee_repeat_push', 'a', { b: '1' }],
    ['ee_repeat_push', 'a', { b: '2' }],
    ['ee_repeat_push', 'a', { b: '3' }, { name: 'repeat_push', options: { m: ['1', '2', '3'] } }],
    ['ee_repeat_push', 'a', { b: '4' }, { name: 'repeat_push', options: { m: ['2', '3', '4'] } }],
    ['ee_repeat_push', 'a', { b: 'five' }],
    ['ee_repeat_push', 'a', { b: '6' }],
    ['ee_repeat_push', 'a', { b: '7' }],
    ['ee_repeat_push', 'a', { b: '8' }, { name: 'repeat_push', options: { m: ['6', '7', '8'] } }],

    ['ee_repeat_push_multi', 'a', { a: '1', b: '2 three' }],
    ['ee_repeat_push_multi', 'a', { a: '2', b: '3 four' }],
    ['ee_repeat_push_multi', 'a', { a: '3', b: '4 five' }],
    ['ee_repeat_push_multi', 'a', { a: '4', b: '5 six' }],
    ['ee_repeat_push_multi', 'a', { a: '5', b: '6 seven' }, { name: 'repeat_push_multi',
      options: {
        a: ['1', '2', '3', '4', '5'],
        b: ['2', '3', '4', '5', '6'],
        c: ['three', 'four', 'five', 'six', 'seven'],
        d: [null, null, null, null, null]
      } }],

    ['ee_repeat_sum_multi', 'a', { a: '1', b: '2' }],
    ['ee_repeat_sum_multi', 'a', { a: '2', b: '3' }],
    ['ee_repeat_sum_multi', 'a', { a: '3', b: '4' }, { name: 'repeat_sum_multi',
      options: {
        a: 6,
        b: 9
      } }],

    ['ee_or_duppath', 'a', {}, '(a before a) or a'],
    ['ee_or_duppath', 'a', {}, '(a before a) or a'],

    ['ee_notbet_duppath', 'a'],
    ['ee_notbet_duppath', 'b'],
    ['ee_notbet_duppath', 'a', {}, 'a not between (b, a)'],

    ['ee_ab_or_b', 'b', {}, '(a and b) or b'],
    ['ee_ab_or_b', 'a'],
    ['ee_ab_or_b', 'b', {}, '(a and b) or b'],
    ['ee_ab_or_b', 'b', {}, '(a and b) or b'],
    ['ee_ab_or_b', 'a'],

    ['ee_ab_or_ca', 'a'],
    ['ee_ab_or_ca', 'c', {}, '(a and b) or (c and a)'],
    ['ee_ab_or_ca', 'a'],
    ['ee_ab_or_ca', 'b', {}, '(a and b) or (c and a)']

  ], function (p) {
    var ans = []
    if (_.isString(p[3])) {
      ans.push({ name: p[3], options: {} })
    } else if (p[3]) {
      ans.push(p[3])
    }
    return [signal(p[0], p[1], p[2]), ans]
  }))
})

test('PicoEngine - io.picolabs.within ruleset', async function (t) {
  var pe = await mkTestPicoEngine({
    rootRIDs: [
      'io.picolabs.within'
    ]
  })

  var signal = mkSignalTask(pe, 'id1')

  await testOutputs(t, _.map([

    [10000000000000, 'foo', 'a'],
    [10000000000001, 'foo', 'b', {}, 'foo'],
    [10000000000002, 'foo', 'a'],
    [10000000555555, 'foo', 'b'],
    [10000000555556, 'foo', 'a'],
    [10000000255557, 'foo', 'b', {}, 'foo'],

    [10000000000000, 'bar', 'a'],
    [10000000003999, 'bar', 'b', {}, 'bar'],
    [10000000000000, 'bar', 'a'],
    [10000000004000, 'bar', 'b', {}, 'bar'],
    [10000000000000, 'bar', 'a'],
    [10000000004001, 'bar', 'b'],

    [10000000000000, 'baz', 'a', {}, 'baz'],
    [10000000000000, 'baz', 'b'],
    [10031536000000, 'baz', 'c', {}, 'baz'],
    [10000000000000, 'baz', 'c'],
    [10040000000000, 'baz', 'b'],
    [10050000000000, 'baz', 'c', {}, 'baz'],

    [10000000000000, 'qux', 'a', { b: 'c' }],
    [10000000000001, 'qux', 'a', { b: 'c' }],
    [10000000001002, 'qux', 'a', { b: 'c' }, 'qux'],
    [10000000002003, 'qux', 'a', { b: 'c' }],
    [10000000002004, 'qux', 'a', { b: 'c' }],
    [10000000002005, 'qux', 'a', { b: 'c' }, 'qux'],
    [10000000002006, 'qux', 'a', { b: 'c' }, 'qux'],
    [10000000002007, 'qux', 'a', { b: 'z' }],
    [10000000002008, 'qux', 'a', { b: 'c' }],
    [10000000002009, 'qux', 'a', { b: 'c' }],
    [10000000004008, 'qux', 'a', { b: 'c' }, 'qux']

  ], function (p) {
    var ans = []
    if (_.isString(p[4])) {
      ans.push({ name: p[4], options: {} })
    } else if (p[4]) {
      ans.push(p[4])
    }
    return [signal(p[1], p[2], p[3], new Date(p[0])), ans]
  }))
})

test('PicoEngine - io.picolabs.guard-conditions ruleset', async function (t) {
  var pe = await mkTestPicoEngine({
    rootRIDs: [
      'io.picolabs.guard-conditions'
    ]
  })

  var query = mkQueryTask(pe, 'id1', 'io.picolabs.guard-conditions')
  var signal = mkSignalTask(pe, 'id1')

  await testOutputs(t, [
    [
      query('getB'),
      null
    ],
    [
      signal('foo', 'a', { b: 'foo' }),
      [{ name: 'foo', options: { b: 'foo' } }]
    ],
    [
      query('getB'),
      'foo'
    ],
    [
      signal('foo', 'a', { b: 'bar' }),
      [{ name: 'foo', options: { b: 'bar' } }]
    ],
    [
      query('getB'),
      'foo'
    ],
    [
      signal('foo', 'a', { b: 'foo bar' }),
      [{ name: 'foo', options: { b: 'foo bar' } }]
    ],
    [
      query('getB'),
      'foo bar'
    ],
    [
      signal('bar', 'a', {}),
      [
        { name: 'bar', options: { x: 1, b: 'foo bar' } },
        { name: 'bar', options: { x: 2, b: 'foo bar' } },
        { name: 'bar', options: { x: 3, b: 'foo bar' } }
      ]
    ],
    [
      query('getB'),
      3
    ],
    [
      signal('on_final_no_foreach', 'a', { x: 42 }),
      [
        { name: 'on_final_no_foreach', options: { x: 42 } }
      ]
    ],
    [
      query('getB'),
      42
    ]
  ])
})

test('PicoEngine - io.picolabs.with ruleset', async function (t) {
  var pe = await mkTestPicoEngine({
    rootRIDs: [
      'io.picolabs.with'
    ]
  })

  var query = mkQueryTask(pe, 'id1', 'io.picolabs.with')

  await testOutputs(t, [
    [query('add', { a: -2, b: 5 }), 3],
    [query('inc', { n: 4 }), 5],
    [query('foo', { a: 3 }), 9]
  ])
})

test('PicoEngine - io.picolabs.defaction ruleset', async function (t) {
  var pe = await mkTestPicoEngine({
    rootRIDs: [
      'io.picolabs.defaction'
    ]
  })

  var signal = mkSignalTask(pe, 'id1')
  var query = mkQueryTask(pe, 'id1', 'io.picolabs.defaction')

  await testOutputs(t, [
    [
      signal('defa', 'foo', {}),
      [{ name: 'foo', options: { a: 'bar', b: 5 } }]
    ],
    [
      signal('defa', 'bar', {}),
      [{ name: 'bar', options: { a: 'baz', b: 'qux', c: 'quux' } }]
    ],
    [
      query('getSettingVal'),
      null
    ],
    [
      signal('defa', 'bar_setting', {}),
      [{ name: 'bar', options: { a: 'baz', b: 'qux', c: 'quux' } }]
    ],
    function (next) {
      query('getSettingVal')(function (err, data) {
        if (err) return next(err)

        data.meta.txn_id = 'TXN_ID'
        t.deepEqual(data, {
          name: 'bar',
          type: 'directive',
          options: { a: 'baz', b: 'qux', c: 'quux' },
          meta: { eid: '1234', rid: 'io.picolabs.defaction', rule_name: 'bar_setting', txn_id: 'TXN_ID' }
        })
        next()
      })
    },
    [
      signal('defa', 'chooser', { val: 'asdf' }),
      [{ name: 'foo', options: { a: 'asdf', b: 5 } }]
    ],
    [
      signal('defa', 'chooser', { val: 'fdsa' }),
      [{ name: 'bar', options: { a: 'fdsa', b: 'ok', c: 'done' } }]
    ],
    [
      signal('defa', 'chooser', {}),
      []
    ],
    [
      signal('defa', 'ifAnotB', { a: 'true', b: 'false' }),
      [{ name: 'yes a', options: {} }, { name: 'not b', options: {} }]
    ],
    [
      signal('defa', 'ifAnotB', { a: 'true', b: 'true' }),
      []
    ],
    [
      query('add', { a: 1, b: 2 }), // try and fake an action
      { type: 'directive', name: 'add', options: { resp: 3 } }
    ],
    function (next) {
      pe.emitter.once('error', function (err, info) {
        t.is(err + '', 'Error: `add` is not defined as an action')
        t.is(info.eci, 'id1')
      })
      signal('defa', 'add')(function (err, resp) {
        t.is(err + '', 'Error: `add` is not defined as an action')
        t.falsy(resp)
        next()
      })
    },
    [
      signal('defa', 'returns'),
      [{ name: 'wat:whereinthe', options: { b: 333 } }]
    ],
    [
      query('getSettingVal'),
      ['where', 'in', 'the', 'wat:whereinthe 433']
    ],
    [
      signal('defa', 'scope'),
      []
    ],
    [
      query('getSettingVal'),
      ['aint', 'no', 'echo', null, 'send wat? noop returned: null']
    ],
    function (next) {
      pe.emitter.once('error', function (err, info) {
        t.is(err + '', 'Error: actions can only be called in the rule action block')
        t.is(info.eci, 'id1')
      })
      signal('defa', 'trying_to_use_action_as_fn')(function (err) {
        t.is(err + '', 'Error: actions can only be called in the rule action block')
        next()
      })
    },
    function (next) {
      pe.emitter.once('error', function (err, info) {
        t.is(err + '', 'Error: actions can only be called in the rule action block')
        t.is(info.eci, 'id1')
      })
      query('echoAction')(function (err) {
        t.is(err + '', 'Error: actions can only be called in the rule action block')
        next()
      })
    }
  ])
})

test('PicoEngine - io.picolabs.log ruleset', async function (t) {
  var pe = await mkTestPicoEngine({
    rootRIDs: [
      'io.picolabs.log'
    ]
  })

  var signal = mkSignalTask(pe, 'id1')

  var eventLog = []
  _.each([
    'log-info',
    'log-debug',
    'log-warn',
    'log-error'
  ], function (level) {
    pe.emitter.on(level, function (val, info) {
      eventLog.push([level, val])
    })
  })

  await testOutputs(t, [
    [signal('log', 'levels'), []],
    function (done) {
      t.deepEqual(eventLog, [
        ['log-info', 'hello default'],
        ['log-error', 'hello error'],
        ['log-warn', 'hello warn'],
        ['log-info', 'hello info'],
        ['log-debug', 'hello debug']
      ])
      done()
    }
  ])
})

test('PicoEngine - io.picolabs.key* rulesets', async function (t) {
  var pe = await mkTestPicoEngine({
    rootRIDs: [
      'io.picolabs.key-defined',
      'io.picolabs.key-used',
      'io.picolabs.key-used2',
      'io.picolabs.key-used3'
    ]
  })

  var signal = mkSignalTask(pe, 'id1')
  var query1 = mkQueryTask(pe, 'id1', 'io.picolabs.key-used')
  var query2 = mkQueryTask(pe, 'id1', 'io.picolabs.key-used2')
  var query3 = mkQueryTask(pe, 'id1', 'io.picolabs.key-used3')

  var qError = function (q, errorMsg) {
    return function (next) {
      pe.emitter.once('error', function (err) {
        t.is(err + '', errorMsg)
      })
      q(function (err, resp) {
        t.is(err + '', errorMsg)
        next()
      })
    }
  }

  await testOutputs(t, [

    [query1('getFoo'), 'foo key just a string'],
    [query2('getFoo'), 'foo key just a string'],
    qError(query3('getFoo'), 'Error: keys:foo not defined'), // b/c used3 never requires it

    // keys:* should work directly in global block
    [query1('foo_global'), 'foo key just a string'],

    [query1('getBar'), { baz: 'baz subkey for bar key', qux: 'qux subkey for bar key' }],
    [query1('getBarN', { name: 'baz' }), 'baz subkey for bar key'],
    [query1('getBarN', { name: 'qux' }), 'qux subkey for bar key'],
    [query1('getBarN', { name: 'blah' }), null],

    // not shared with either
    qError(query1('getQuux'), 'Error: keys:quux not defined'),
    qError(query2('getQuux'), 'Error: keys:quux not defined'),

    // only shared with 2
    qError(query1('getQuuz'), 'Error: keys:quuz not defined'),
    [query2('getQuuz'), 'this is shared to someone else'],

    // testing configured module
    [query1('getAPIKeys'), ['foo key just a string', 'baz subkey for bar key']],
    [query2('getAPIKeys'), ['default-key1', 'this key is defined inside the module']],

    // test keys: work in different execution areas
    [
      signal('key_used', 'foo'),
      [{
        name: 'foo',
        options: {
          foo: 'foo key just a string',
          foo_pre: 'foo key just a string'
        }
      }]
    ],
    [query1('getFooPostlude'), 'foo key just a string']

  ])
})

test('PicoEngine - io.picolabs.schedule rulesets', async function (t) {
  // before starting the engine, write some test data to the db
  var memdb = memdown(cuid())
  var db = DB({
    db: memdb,
    __use_sequential_ids_for_testing: true,
    __sequential_id_prefix_for_testing: 'init'
  })
  await db.newPico({})
  await db.addRulesetToPico('init0', 'io.picolabs.schedule')
  await db.scheduleEventRepeat('10 * * * * *', {
    eci: 'init1',
    eid: '1234',
    domain: 'schedule',
    type: 'push_log',
    attrs: { from: 'startup_event', name: 'qux' }
  })
  var pe = await mkTestPicoEngine({ ldb: memdb })

  var signal = mkSignalTask(pe, 'init1')
  var query = mkQueryTask(pe, 'init1', 'io.picolabs.schedule')

  var triggerTimeout = function () {
    return function (done) {
      pe.scheduler.test_mode_triggerTimeout()
      done()
    }
  }
  var triggerCron = function (id) {
    return function (done) {
      pe.scheduler.test_mode_triggerCron(id)
      done()
    }
  }

  var clearLog = [
    signal('schedule', 'clear_log'),
    [{ name: 'clear_log', options: {} }]
  ]

  await testOutputs(t, [
    clearLog,
    [
      signal('schedule', 'in_5min', { name: 'foo' }),
      [{ name: 'in_5min', options: {} }]
    ],
    [query('getLog'), [
      { 'scheduled in_5min': 'id0' }
    ]],
    [
      signal('schedule', 'in_5min', { name: 'bar' }),
      [{ name: 'in_5min', options: {} }]
    ],
    [query('getLog'), [
      { 'scheduled in_5min': 'id0' },
      { 'scheduled in_5min': 'id1' }
    ]],
    triggerTimeout(), // it's been 5 minutes
    [query('getLog'), [
      { 'scheduled in_5min': 'id0' },
      { 'scheduled in_5min': 'id1' },
      { 'from': 'in_5min', 'name': 'foo' }
    ]],
    triggerTimeout(), // it's been 5 more minutes
    [query('getLog'), [
      { 'scheduled in_5min': 'id0' },
      { 'scheduled in_5min': 'id1' },
      { 'from': 'in_5min', 'name': 'foo' },
      { 'from': 'in_5min', 'name': 'bar' }
    ]],
    triggerTimeout(), // it's been 5 more minutes
    [query('getLog'), [
      { 'scheduled in_5min': 'id0' },
      { 'scheduled in_5min': 'id1' },
      { 'from': 'in_5min', 'name': 'foo' },
      { 'from': 'in_5min', 'name': 'bar' }
      // nothing changed
    ]],

    // Start testing repeat
    clearLog,
    [
      signal('schedule', 'every_1min', { name: 'baz' }),
      [{ name: 'every_1min', options: {} }]
    ],
    [query('getLog'), [
      { 'scheduled every_1min': 'id2' }
    ]],
    triggerCron('id2'),
    [query('getLog'), [
      { 'scheduled every_1min': 'id2' },
      { from: 'every_1min', name: 'baz' }
    ]],
    triggerCron('id2'),
    triggerCron('id2'),
    [query('getLog'), [
      { 'scheduled every_1min': 'id2' },
      { from: 'every_1min', name: 'baz' },
      { from: 'every_1min', name: 'baz' },
      { from: 'every_1min', name: 'baz' }
    ]],
    triggerCron('init2'), // trigger a cron from startup
    [query('getLog'), [
      { 'scheduled every_1min': 'id2' },
      { from: 'every_1min', name: 'baz' },
      { from: 'every_1min', name: 'baz' },
      { from: 'every_1min', name: 'baz' },
      { from: 'startup_event', name: 'qux' }
    ]],

    // schedule:list() and schedule:remove(id)
    [
      signal('schedule', 'in_5min', { name: 'blah-1' }),
      [{ name: 'in_5min', options: {} }]
    ],
    [
      signal('schedule', 'in_5min', { name: 'blah-2' }),
      [{ name: 'in_5min', options: {} }]
    ],
    clearLog,
    [function (next) {
      query('listScheduled')(function (err, list) {
        if (err) return next(err)
        // so we can test dates
        next(null, _.map(list, function (e) {
          if (_.has(e, 'at')) {
            t.truthy(/^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d.\d\d\dZ$/.test(e.at))
            e.at = 'some-fake-date'
          }
          return e
        }))
      })
    }, [
      {
        id: 'id3',
        at: 'some-fake-date',
        event: mkEvent('init1/1234/schedule/push_log', { from: 'in_5min', name: 'blah-1' })
      },
      {
        id: 'id4',
        at: 'some-fake-date',
        event: mkEvent('init1/1234/schedule/push_log', { from: 'in_5min', name: 'blah-2' })
      },
      {
        id: 'id2',
        timespec: '* */1 * * * *',
        event: mkEvent('init1/1234/schedule/push_log', { from: 'every_1min', name: 'baz' })
      },
      {
        id: 'init2',
        timespec: '10 * * * * *',
        event: mkEvent('init1/1234/schedule/push_log', { from: 'startup_event', name: 'qux' })
      }
    ]],
    [query('getLog'), [
      // nothing happened yet
    ]],
    triggerTimeout(),
    [query('getLog'), [
      { from: 'in_5min', name: 'blah-1' }
    ]],
    [signal('schedule', 'rm_from_schedule', { id: 'id4' }), []], // remove blah-2
    triggerTimeout(),
    [query('getLog'), [
      { from: 'in_5min', name: 'blah-1' }
      // nothing new b/c we removed blah-2
    ]],
    [signal('schedule', 'rm_from_schedule', { id: 'init2' }), []], // remove a cron
    [query('listScheduled'), [
      {
        id: 'id2',
        timespec: '* */1 * * * *',
        event: mkEvent('init1/1234/schedule/push_log', { from: 'every_1min', name: 'baz' })
      }
    ]],
    [signal('schedule', 'rm_from_schedule', { id: 'id2' }), []], // remove a cron
    [query('listScheduled'), []],
    clearLog,

    // /////////////////////////////////////////////////////////////////////////
    // dynamic domain:type
    [signal('schedule', 'dynamic_at', {
      dn: 'schedule:push_log',
      at: (new Date(Date.now() + 10000)).toISOString(),
      name: 'AAA'
    }), []],
    [signal('schedule', 'dynamic_repeat', {
      dn: 'schedule:push_log',
      timespec: '* * */2 * * *',
      name: 'BBB'
    }), []],
    [query('getLog'), [
      { 'scheduled dynamic_at': 'id5' },
      { 'scheduled dynamic_repeat': 'id6' }
    ]],
    triggerTimeout(),
    [query('getLog'), [
      { 'scheduled dynamic_at': 'id5' },
      { 'scheduled dynamic_repeat': 'id6' },
      { from: 'dynamic_at', name: 'AAA' }
    ]],
    triggerCron('id6'),
    [query('getLog'), [
      { 'scheduled dynamic_at': 'id5' },
      { 'scheduled dynamic_repeat': 'id6' },
      { from: 'dynamic_at', name: 'AAA' },
      { from: 'dynamic_repeat', name: 'BBB' }
    ]]
  ])
})

test('PicoEngine - installRuleset', async function (t) {
  var pe = await mkTestPicoEngine()

  var ridToUse = 'io.picolabs.hello_world'

  await pe.newPico({})
  try {
    await pe.installRuleset('id404', ridToUse)
    t.fail('should throw')
  } catch (err) {
    t.is(err + '', 'NotFoundError: Pico not found: id404')
    t.truthy(err.notFound)
  }
  try {
    await pe.installRuleset('id0', 'foo.not.an.rid')
    t.fail('should throw')
  } catch (err) {
    t.is(err + '', 'Error: This rid is not found and/or enabled: foo.not.an.rid')
  }
  await pe.installRuleset('id0', ridToUse)
  t.truthy(true, 'did not throwup')
})

test('PicoEngine - io.picolabs.last rulesets', async function (t) {
  var pe = await mkTestPicoEngine({
    rootRIDs: [
      'io.picolabs.last',
      'io.picolabs.last2'
    ]
  })

  var signal = mkSignalTask(pe, 'id1')

  await testOutputs(t, [
    [
      signal('last', 'all', {}),
      [
        { name: 'foo', options: {} },
        { name: 'bar', options: {} },
        { name: 'baz', options: {} },
        // qux doesn't run b/c baz stopped it
        { name: 'last2 foo', options: {} }// still runs b/c it's a different rid
      ]
    ],
    [
      signal('last', 'all', { stop: 'bar' }),
      [
        { name: 'foo', options: {} },
        { name: 'bar', options: {} },
        { name: 'last2 foo', options: {} }
      ]
    ],
    [
      signal('last', 'all', { stop: 'foo' }),
      [
        { name: 'foo', options: {} },
        { name: 'last2 foo', options: {} }
      ]
    ]

  ])
})

test('PicoEngine - io.picolabs.error rulesets', async function (t) {
  var pe = await mkTestPicoEngine({
    rootRIDs: [
      'io.picolabs.error'
    ]
  })

  var signal = mkSignalTask(pe, 'id1')
  var query = mkQueryTask(pe, 'id1', 'io.picolabs.error')

  await testOutputs(t, [
    [
      query('getErrors'),
      null
    ],

    [signal('error', 'continue_on_error'), [
      { name: 'continue_on_errorA', options: {} },
      { name: 'continue_on_errorB', options: {} }
    ]],

    [signal('error', 'stop_on_error'), [
      { name: 'stop_on_errorA', options: {} }
      // NOTE stop_on_errorB should not execute
      // b/c stop_on_errorA raised an "error" that should stop it
    ]],

    [
      query('getErrors'),
      _.map([
        null,
        ['debug', 'continue_on_errorA', 'continue_on_errorA debug'],
        ['info', 'continue_on_errorA', 'continue_on_errorA info'],
        ['warn', 'continue_on_errorA', 'continue_on_errorA warn'],
        ['debug', 'continue_on_errorB', 'continue_on_errorB debug'],
        ['info', 'continue_on_errorB', 'continue_on_errorB info'],
        ['warn', 'continue_on_errorB', 'continue_on_errorB warn'],
        ['error', 'stop_on_errorA', 'stop_on_errorA 1']
      ], function (pair) {
        if (pair) {
          return {
            level: pair[0],
            data: pair[2],
            rid: 'io.picolabs.error',
            rule_name: pair[1],
            genus: 'user'
          }
        }
        return pair
      })
    ]

  ])
})

test("PicoEngine - (re)registering ruleset shouldn't mess up state", async function (t) {
  var pe = await mkTestPicoEngine({
    compileAndLoadRuleset: 'inline'
  })

  var krl0 = 'ruleset foo.rid {rule aa {select when foo all} rule bb {select when foo all}}'
  var krl1 = 'ruleset foo.rid {rule ab {select when foo all} rule bb {select when foo all}}'

  var order = []
  pe.emitter.on('debug', function (val, info) {
    if (val === 'event being processed') {
      order.push('EVENT: ' + info.event.domain + '/' + info.event.type)
    } else if (/^rule selected/.test(val)) {
      order.push(val)
    }
  })
  await pe.newPico({})
  await pe.registerRuleset(krl0, {})
  await pe.installRuleset('id0', 'foo.rid')
  await pe.signalEvent({ eci: 'id1', domain: 'foo', type: 'all' })
  await pe.registerRuleset(krl1, {})
  await pe.signalEvent({ eci: 'id1', domain: 'foo', type: 'all' })

  t.deepEqual(order, [
    'EVENT: foo/all',
    'rule selected: foo.rid -> aa',
    'rule selected: foo.rid -> bb',
    'EVENT: foo/all',
    'rule selected: foo.rid -> ab',
    'rule selected: foo.rid -> bb'
  ])
})

test('PicoEngine - io.picolabs.test-error-messages', async function (t) {
  var pe = await mkTestPicoEngine({
    rootRIDs: ['io.picolabs.test-error-messages']
  })

  var err
  pe.emitter.on('error', function (error) {
    err = error
  })

  t.is(await t.throwsAsync(pe.runQuery(void 0)), err)
  t.is(err + '', 'Error: missing query.eci')
  t.is(err.notFound, void 0)

  t.is(await t.throwsAsync(pe.runQuery({ eci: null })), err)
  t.is(err + '', 'Error: missing query.eci')
  t.is(err.notFound, void 0)

  t.is(await t.throwsAsync(pe.runQuery({
    eci: 'foo',
    rid: 'not-an-rid',
    name: 'hello',
    args: {}
  })), err)
  t.is(err + '', 'NotFoundError: ECI not found: foo')
  t.is(err.notFound, true)

  t.is(await t.throwsAsync(pe.runQuery({
    eci: 'id1',
    rid: 'not-an-rid',
    name: 'hello',
    args: { obj: 'Bob' }
  })), err)
  t.is(err + '', 'Error: Pico does not have that rid: not-an-rid')
  t.is(err.notFound, void 0)

  t.is(await t.throwsAsync(pe.runQuery({
    eci: 'id1',
    rid: 'io.picolabs.test-error-messages',
    name: 'zzz',
    args: { obj: 'Bob' }
  })), err)
  t.is(err + '', 'Error: Not shared: zzz')
  t.is(err.notFound, void 0)

  t.is(await t.throwsAsync(pe.runQuery({
    eci: 'id1',
    rid: 'io.picolabs.test-error-messages',
    name: 'somethingNotDefined',
    args: { obj: 'Bob' }
  })), err)
  t.is(err + '', 'Error: Shared, but not defined: somethingNotDefined')
  t.is(err.notFound, true)

  /*
  t.is(await t.throwsAsync(pe.runQuery({
    eci: 'id1',
    rid: 'io.picolabs.test-error-messages',
    name: 'infiniteRecursion'
  })), err)
  t.is(err + '', 'RangeError: Maximum call stack size exceeded')
  t.is(err.notFound, void 0)
  */
})

var mkPicoEngineFactoryWithKRLCompiler = function () {
  var memdb = memdown(cuid())// db to share between to engine instances
  return function (opts) {
    return PicoEngine(_.assign({}, {
      host: 'https://test-host',
      ___core_testing_mode: true,
      db: {
        db: memdb,
        __use_sequential_ids_for_testing: true
      }
    }, opts))
  }
}

test('PicoEngine - startup ruleset dependency ordering', async function (t) {
  var mkPE = mkPicoEngineFactoryWithKRLCompiler()

  // create a blank engine
  var pe = mkPE()
  // register some krl that has inter-dependencies
  await pe.registerRuleset('ruleset D {}', {})
  await pe.registerRuleset('ruleset E {}', {})
  await pe.registerRuleset('ruleset C {meta{use module D use module E}}', {})
  await pe.registerRuleset('ruleset B {meta{use module C use module E}}', {})
  await pe.registerRuleset('ruleset A {meta{use module B use module D}}', {})

  t.truthy(true, 'registered the ruleset successfully')

  // now the engine shuts down, and starts up again
  pe = mkPE()
  await pe.start([])
  // if the dependencies aren't loaded in the correct order it will blow up
  t.truthy(true, 'restarted successfully')
})

test('PicoEngine - root pico creation', async function (t) {
  var pe = await mkTestPicoEngine({
    rootRIDs: ['io.picolabs.hello_world']
  })

  var db = await pe.dbDump()

  t.deepEqual(db.root_pico, {
    id: 'id0',
    parent_id: null,
    admin_eci: 'id1'
  })
  t.deepEqual(db.pico, { 'id0': {
    id: 'id0',
    parent_id: null,
    admin_eci: 'id1'
  } })
  t.deepEqual(_.keys(db.channel), ['id1'])

  t.deepEqual(_.keys(db['pico-ruleset']['id0']), [
    'io.picolabs.hello_world'
  ])
})

test('PicoEngine - js-module', async function (t) {
  var pe = await mkTestPicoEngine({
    rootRIDs: [
      'io.picolabs.js-module'
    ],
    modules: {

      myJsModule: {

        // `data = myJsModule:fun0(a, b)`
        fun0: {
          type: 'function',
          args: ['a', 'b'],
          fn: function (args) {
            return args.a * args.b
          }
        },

        // `myJsModule:act(a, b) setting(data)`
        act: {
          type: 'action',
          args: ['a', 'b'],
          fn: function (args) {
            return args.b / args.a
          }
        }
      }
    }
  })

  t.is(await pe.runQuery({
    eci: 'id1',
    rid: 'io.picolabs.js-module',
    name: 'qFn',
    args: { a: 3 }
  }), 6)

  var resp = await pe.signalEvent({
    eci: 'id1',
    domain: 'js_module',
    type: 'action'
  })
  delete resp.directives[0].meta
  t.deepEqual(resp.directives[0], { name: 'resp', options: { val: 0.3 } })
})

test('PicoEngine - system ruleset dependency ordering', async function (t) {
  var mkPE = mkPicoEngineFactoryWithKRLCompiler()

  var pe = mkPE({
    rootRIDs: [
      'C'
    ]
  })
  await pe.start([
    { src: 'ruleset C {meta{use module D}}', meta: { url: 'http://foo/C.krl' } },
    { src: 'ruleset D {}', meta: { url: 'http://foo/D.krl' } }
  ])
  // if the dependencies aren't loaded in the correct order pe.start() will blow up
  t.truthy(true, 'started successfully')

  var listIns = await pe.modules.get({}, 'engine', 'listInstalledRIDs')
  var rids = await listIns({ pico_id: 'id0' }, [])

  t.deepEqual(rids, ['C'])
})

test('PicoEngine - io.picolabs.persistent-index', async function (t) {
  var pe = await mkTestPicoEngine({ rootRIDs: [
    'io.picolabs.persistent-index'
  ] })

  var query = mkQueryTask(pe, 'id1', 'io.picolabs.persistent-index')
  var signal = mkSignalTask(pe, 'id1')

  await testOutputs(t, [
    [query('getFoo'), null],
    [query('getBar'), null],

    [signal('pindex', 'setfoo', { aaa: 'blah' }), []],
    [signal('pindex', 'setbar', { aaa: 'blah' }), []],
    [query('getFoo'), { aaa: 'blah' }],
    [query('getBar'), { aaa: 'blah' }],

    [signal('pindex', 'putfoo', { key: 'bbb', value: 'wat' }), []],
    [signal('pindex', 'putbar', { key: 'bbb', value: 'wat' }), []],
    [query('getFoo'), { aaa: 'blah', bbb: 'wat' }],
    [query('getBar'), { aaa: 'blah', bbb: 'wat' }],

    [query('getFooKey', { key: 'aaa' }), 'blah'],
    [query('getBarKey', { key: 'aaa' }), 'blah'],
    [query('getFooKey', { key: '404' }), null],
    [query('getBarKey', { key: '404' }), null],
    [query('getFooKey', {}), null],
    [query('getBarKey', {}), null],

    [signal('pindex', 'delfoo', { key: 'aaa' }), []],
    [signal('pindex', 'delbar', { key: 'aaa' }), []],
    [query('getFoo'), { bbb: 'wat' }],
    [query('getBar'), { bbb: 'wat' }],
    [query('getFooKey', { key: 'aaa' }), null],
    [query('getBarKey', { key: 'aaa' }), null],

    [signal('pindex', 'nukefoo', { key: 'aaa' }), []],
    [signal('pindex', 'nukebar', { key: 'aaa' }), []],
    [query('getFoo'), null],
    [query('getBar'), null],
    [query('getFooKey', { key: 'bbb' }), null],
    [query('getBarKey', { key: 'bbb' }), null],

    // Test reading a map that was only set with a deep key path
    [signal('pindex', 'putbaz'), []],
    [query('getBaz'), { one: { two: 'three' } }],

    [query('getMaplist'), null],
    [signal('pindex', 'setmaplist'), []],
    [query('getMaplist'), [{ id: 'one' }, { id: 'two' }, { id: 'three' }]],
    [signal('pindex', 'putmaplist'), []],
    [query('getMaplist'), [{ id: 'one' }, { id: 'two', other: 'thing' }, { id: 'three' }]]

  ])
})

test('PicoEngine - io.picolabs.policies ruleset', async function (t) {
  var pe = await mkTestPicoEngine({ rootRIDs: ['io.picolabs.policies'] })
  var newPolicy = pe.newPolicy
  var newChannel = pe.newChannel

  pe.emitter.on('error', function (err) {
    if (/by channel policy/.test(err + '')) {
      // ignore
    } else {
      t.end(err)
    }
  })

  var mkECI = async function (policyJson) {
    var policy = await newPolicy(policyJson)
    var chann = await newChannel({
      pico_id: 'id0',
      name: 'name',
      type: 'type',
      policy_id: policy.id
    })
    return chann.id
  }

  var tstEventPolicy = util.promisify(function (eci, domainType, expected, callback) {
    pe.signalEvent({
      eci: eci,
      domain: domainType.split('/')[0],
      type: domainType.split('/')[1]
    }, function (err, data) {
      var actual = 'allowed'
      if (err) {
        if (/Denied by channel policy/.test(err + '')) {
          actual = 'denied'
        } else if (/Not allowed by channel policy/.test(err + '')) {
          actual = 'not-allowed'
        } else {
          return callback(err)
        }
      }
      t.is(actual, expected, 'tstEventPolicy ' + eci + '|' + domainType)
      callback()
    })
  })
  var tstQueryPolicy = util.promisify(function (eci, name, expected, callback) {
    pe.runQuery({
      eci: eci,
      rid: 'io.picolabs.policies',
      name: name
    }, function (err, data) {
      var actual = 'allowed'
      if (err) {
        if (/Denied by channel policy/.test(err + '')) {
          actual = 'denied'
        } else if (/Not allowed by channel policy/.test(err + '')) {
          actual = 'not-allowed'
        } else {
          return callback(err)
        }
      }
      t.is(actual, expected, 'tstQueryPolicy ' + eci + '|' + name)
      callback()
    })
  })

  var eci

  eci = await mkECI({
    name: 'deny all implicit'
  })
  await tstEventPolicy(eci, 'policies/foo', 'not-allowed')
  await tstEventPolicy(eci, 'policies/bar', 'not-allowed')
  await tstEventPolicy(eci, 'policies/baz', 'not-allowed')

  eci = await mkECI({
    name: 'deny all explicit',
    event: {
      deny: [{}]
    }
  })
  await tstEventPolicy(eci, 'policies/foo', 'denied')
  await tstEventPolicy(eci, 'policies/bar', 'denied')
  await tstEventPolicy(eci, 'policies/baz', 'denied')

  eci = await mkECI({
    name: 'allow all',
    event: {
      allow: [{}]
    }
  })
  await tstEventPolicy(eci, 'policies/foo', 'allowed')
  await tstEventPolicy(eci, 'policies/bar', 'allowed')
  await tstEventPolicy(eci, 'policies/baz', 'allowed')

  eci = await mkECI({
    name: 'deny before allow',
    event: {
      allow: [{}],
      deny: [{}]
    }
  })
  await tstEventPolicy(eci, 'policies/foo', 'denied')
  await tstEventPolicy(eci, 'policies/bar', 'denied')
  await tstEventPolicy(eci, 'policies/baz', 'denied')

  eci = await mkECI({
    name: 'only policies/foo',
    event: {
      allow: [{ domain: 'policies', type: 'foo' }]
    }
  })
  await tstEventPolicy(eci, 'policies/foo', 'allowed')
  await tstEventPolicy(eci, 'policies/bar', 'not-allowed')
  await tstEventPolicy(eci, 'policies/baz', 'not-allowed')

  eci = await mkECI({
    name: 'all but policies/foo',
    event: {
      deny: [{ domain: 'policies', type: 'foo' }],
      allow: [{}]
    }
  })
  await tstEventPolicy(eci, 'policies/foo', 'denied')
  await tstEventPolicy(eci, 'policies/bar', 'allowed')
  await tstEventPolicy(eci, 'policies/baz', 'allowed')

  eci = await mkECI({
    name: 'only other/*',
    event: {
      allow: [{ domain: 'other' }]
    }
  })
  await tstEventPolicy(eci, 'policies/foo', 'not-allowed')
  await tstEventPolicy(eci, 'policies/bar', 'not-allowed')
  await tstEventPolicy(eci, 'policies/baz', 'not-allowed')
  await tstEventPolicy(eci, 'other/foo', 'allowed')
  await tstEventPolicy(eci, 'other/bar', 'allowed')
  await tstEventPolicy(eci, 'other/baz', 'allowed')

  eci = await mkECI({
    name: 'only */foo',
    event: {
      allow: [{ type: 'foo' }]
    }
  })
  await tstEventPolicy(eci, 'policies/foo', 'allowed')
  await tstEventPolicy(eci, 'policies/bar', 'not-allowed')
  await tstEventPolicy(eci, 'policies/baz', 'not-allowed')
  await tstEventPolicy(eci, 'other/foo', 'allowed')
  await tstEventPolicy(eci, 'other/bar', 'not-allowed')
  await tstEventPolicy(eci, 'other/baz', 'not-allowed')

  eci = await mkECI({
    name: 'only policies/foo or other/*',
    event: {
      allow: [
        { domain: 'policies', type: 'foo' },
        { domain: 'other' }
      ]
    }
  })
  await tstEventPolicy(eci, 'policies/foo', 'allowed')
  await tstEventPolicy(eci, 'policies/bar', 'not-allowed')
  await tstEventPolicy(eci, 'policies/baz', 'not-allowed')
  await tstEventPolicy(eci, 'other/foo', 'allowed')
  await tstEventPolicy(eci, 'other/bar', 'allowed')
  await tstEventPolicy(eci, 'other/baz', 'allowed')

  eci = await mkECI({
    name: 'deny all implicit'
  })
  await tstQueryPolicy(eci, 'one', 'not-allowed')
  await tstQueryPolicy(eci, 'two', 'not-allowed')
  await tstQueryPolicy(eci, 'three', 'not-allowed')

  eci = await mkECI({
    name: 'allow all',
    query: { allow: [{}] }
  })
  await tstQueryPolicy(eci, 'one', 'allowed')
  await tstQueryPolicy(eci, 'two', 'allowed')
  await tstQueryPolicy(eci, 'three', 'allowed')

  eci = await mkECI({
    name: 'allow one and three',
    query: { allow: [
      { name: 'one' },
      { name: 'three' }
    ] }
  })
  await tstQueryPolicy(eci, 'one', 'allowed')
  await tstQueryPolicy(eci, 'two', 'not-allowed')
  await tstQueryPolicy(eci, 'three', 'allowed')
})

test('PicoEngine - handle ruleset startup errors after compiler update made breaking changes', async function (t) {
  var mkPE = mkPicoEngineFactoryWithKRLCompiler()

  // The old compiler didn't complain when the ruleset was registered
  var oldCompiler = function (rsInfo) {
    return { rid: 'my-rid' }
  }
  // The new compiler doesn't like it anymore (i.e. removed syntax)
  var newCompiler = function (rsInfo) {
    throw new Error("That won't compile anymore!")
  }

  t.plan(5)

  // First try register/enable the ruleset with the old compiler
  var pe = mkPE({ compileAndLoadRuleset: oldCompiler })
  var regRS = pe.registerRuleset
  var listRIDs = await pe.modules.get({}, 'engine', 'listAllEnabledRIDs')

  t.deepEqual(await listRIDs(), [], 'no rulesets yet')
  await regRS('ruleset my-rid{}', {})
  t.deepEqual(await listRIDs(), ['my-rid'], 'registered!')
  // so the old compiler version allowed it, now it's in the DB

  // Start the new engine
  pe = mkPE({ compileAndLoadRuleset: newCompiler })
  listRIDs = await pe.modules.get({}, 'engine', 'listAllEnabledRIDs')
  t.deepEqual(await listRIDs(), ['my-rid'], 'the ruleset is still in the DB and enabled')

  pe.emitter.on('error', function (err) {
    t.is(err + '', "Error: Failed to compile my-rid! It is now disabled. You'll need to edit and re-register it.\nCause: Error: That won't compile anymore!")
  })

  // the new compiler should blow up when it tries to initialize the rulest
  await pe.start([])
  // but shouldn't crash, just emit the error and continue starting

  t.deepEqual(await listRIDs(), [], 'the ruleset should be disabled now')
})

test('PicoEngine - handle ruleset initialization errors', async function (t) {
  var mkPE = mkPicoEngineFactoryWithKRLCompiler()

  t.plan(5)

  // First register the ruleset in the db
  var pe = mkPE({ compileAndLoadRuleset: function (rsInfo) {
    return {
      rid: 'my-rid',
      global: function () {
        // works
      }
    }
  } })
  var regRS = pe.registerRuleset
  var listRIDs = await pe.modules.get({}, 'engine', 'listAllEnabledRIDs')

  t.deepEqual(await listRIDs(), [], 'no rulesets yet')
  await regRS('ruleset my-rid{}', {})
  t.deepEqual(await listRIDs(), ['my-rid'], 'registered!')
  // so the old runtime version allowed it, now it's in the DB

  // Now in this time the ruleset won't initialize
  pe = mkPE({ compileAndLoadRuleset: function (rsInfo) {
    return {
      rid: 'my-rid',
      global: function () {
        throw new Error('something broke')
      }
    }
  } })
  listRIDs = await pe.modules.get({}, 'engine', 'listAllEnabledRIDs')
  t.deepEqual(await listRIDs(), ['my-rid'], 'the ruleset is still in the DB and enabled')

  pe.emitter.on('error', function (err) {
    t.is(err + '', "Error: Failed to initialize my-rid! It is now disabled. You'll need to edit and re-register it.\nCause: Error: something broke")
  })

  // it will compile but fail to initialize
  await pe.start([])
  // but shouldn't crash, just emit the error and continue starting

  t.deepEqual(await listRIDs(), [], 'the ruleset should be disabled now')
})

test('PicoEngine - handle dependency cycles at startup', async function (t) {
  t.plan(6)

  var mkPE = mkPicoEngineFactoryWithKRLCompiler()

  var pe = mkPE()

  pe.emitter.on('error', function (err, context) {
    var m = /Failed to initialize (B|C), it's in a dependency cycle./.exec(err.message)
    t.truthy(!!m)
    t.is(context.rid, m[1])
  })

  await pe.start([
    { src: 'ruleset A {meta{}}', meta: { url: 'http://foo/A.krl' } },
    { src: 'ruleset B {meta{use module C}}', meta: { url: 'http://foo/B.krl' } },
    { src: 'ruleset C {meta{use module B}}', meta: { url: 'http://foo/C.krl' } },
    { src: 'ruleset D {meta{}}', meta: { url: 'http://foo/D.krl' } }
  ])
  t.truthy(true, 'should start successfully')

  var listRids = await pe.modules.get({}, 'engine', 'listAllEnabledRIDs')

  t.deepEqual(await listRids({}, []), ['A', 'D'])
})

test("PicoEngine - don't register rulesets that create dependency cycles", async function (t) {
  var mkPE = mkPicoEngineFactoryWithKRLCompiler()

  var pe = mkPE()

  await pe.start()

  var tReg = async function (src) {
    t.truthy(await pe.registerRuleset(src, null))
  }
  var tRegErr = async function (src, error) {
    try {
      await pe.registerRuleset(src, null)
      t.fail('expected: ' + error)
    } catch (err) {
      t.is(err + '', error)
    }
  }

  await tRegErr('ruleset A {meta {use module A}}', 'Error: Dependency Cycle Found: A -> A')

  await tReg('ruleset A {}')

  await tRegErr('ruleset A {meta {use module C}}', 'Error: Dependant module not loaded: C')
  await tRegErr('ruleset A {meta {use module B}}', 'Error: Dependant module not loaded: B')
  await tRegErr('ruleset A {meta {use module A}}', 'Error: Dependency Cycle Found: A -> A')

  await tReg('ruleset A {}')

  await tReg('ruleset B {meta {use module A}}')
  await tRegErr('ruleset A {meta {use module B}}', 'Error: Dependency Cycle Found: A -> B -> A')
})
