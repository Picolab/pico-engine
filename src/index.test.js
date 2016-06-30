var _ = require('lodash');
var λ = require('contra');
var test = require('tape');
var mkTestPicoEngine = require('./mkTestPicoEngine');

var omitMeta = function(resp){
  return _.map(resp.directives, function(d){
    return _.omit(d, 'meta');
  });
};

test('PicoEngine - hello_world ruleset', function(t){
  var pe = mkTestPicoEngine();

  λ.series({
    npico: λ.curry(pe.db.newPico, {}),
    chan0: λ.curry(pe.db.newChannel, {pico_id: 'id0', name: 'one', type: 't'}),
    rid1x: λ.curry(pe.db.addRuleset, {pico_id: 'id0', rid: 'io.picolabs.hello_world'}),

    hello_event: λ.curry(pe.signalEvent, {
      eci: 'id1',
      eid: '1234',
      domain: 'echo',
      type: 'hello',
      attrs: {}
    }),
    hello_query: λ.curry(pe.callFunction, {
      eci: 'id1',
      rid: 'io.picolabs.hello_world',
      fn_name: 'hello',
      args: {obj: 'Bob'}
    })

  }, function(err, data){
    if(err) return t.end(err);

    t.deepEquals(data.hello_event, {
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
            txn_id: 'TODO'
          }
        }
      ]
    });
    t.deepEquals(data.hello_query, 'Hello Bob');

    t.end();
  });
});

test('PicoEngine - persistent ruleset', function(t){
  var pe = mkTestPicoEngine();

  λ.series({
    pico0: λ.curry(pe.db.newPico, {}),
    chan1: λ.curry(pe.db.newChannel, {pico_id: 'id0', name: 'one', type: 't'}),
    rid_0: λ.curry(pe.db.addRuleset, {pico_id: 'id0', rid: 'io.picolabs.persistent'}),

    pico2: λ.curry(pe.db.newPico, {}),
    chan3: λ.curry(pe.db.newChannel, {pico_id: 'id2', name: 'three', type: 't'}),
    rid_1: λ.curry(pe.db.addRuleset, {pico_id: 'id2', rid: 'io.picolabs.persistent'}),

    store_bob0: λ.curry(pe.signalEvent, {
      eci: 'id1',
      eid: '1234',
      domain: 'store',
      type: 'name',
      attrs: {name: 'bob'}
    }),

    query0: λ.curry(pe.callFunction, {
      eci: 'id1',
      rid: 'io.picolabs.persistent',
      fn_name: 'getName',
      args: {}
    }),

    store_bob1: λ.curry(pe.signalEvent, {
      eci: 'id1',
      eid: '12345',
      domain: 'store',
      type: 'name',
      attrs: {name: 'jim'}
    }),

    query1: λ.curry(pe.callFunction, {
      eci: 'id1',
      rid: 'io.picolabs.persistent',
      fn_name: 'getName',
      args: {}
    }),
    query2: λ.curry(pe.callFunction, {
      eci: 'id1',
      rid: 'io.picolabs.persistent',
      fn_name: 'getName',
      args: {}
    }),

    store_appvar0: λ.curry(pe.signalEvent, {
      eci: 'id1',
      eid: '123456',
      domain: 'store',
      type: 'appvar',
      attrs: {appvar: 'global thing'}
    }),
    query3: λ.curry(pe.callFunction, {
      eci: 'id1',
      rid: 'io.picolabs.persistent',
      fn_name: 'getAppVar',
      args: {}
    }),
    query4: λ.curry(pe.callFunction, {
      eci: 'id3',
      rid: 'io.picolabs.persistent',
      fn_name: 'getAppVar',
      args: {}
    })
  }, function(err, data){
    if(err) return t.end(err);

    t.deepEquals(omitMeta(data.store_bob0), [
        {name: 'store_name', options: {name: 'bob'}}
    ]);

    t.deepEquals(data.query0, 'bob');

    t.deepEquals(omitMeta(data.store_bob1), [
      {name: 'store_name', options: {name: 'jim'}}
    ]);

    t.deepEquals(data.query1, 'jim');
    t.deepEquals(data.query2, 'jim');

    t.deepEquals(omitMeta(data.store_appvar0), [
      {name: 'store_appvar', options: {appvar: 'global thing'}}
    ]);
    t.deepEquals(data.query3, 'global thing');
    t.deepEquals(data.query4, 'global thing');

    t.end();
  });
});

/*
test('PicoEngine - raw ruleset', function(t){
  var pe = mkTestPicoEngine();

  λ.series({
    pico: λ.curry(pe.db.newPico, {}),
    chan: λ.curry(pe.db.newChannel, {pico_id: 'id0', name: 'one', type: 't'}),
    rid3: λ.curry(pe.db.addRuleset, {pico_id: 'id0', rid: 'rid3x0'}),

    signal: λ.curry(pe.callFunction, {
      eci: 'id1',
      rid: 'rid3x0',
      fn_name: 'sayRawHello',
      args: {}
    })

  }, function(err, data){
    if(err) return t.end(err);

    t.ok(_.isFunction(data.signal));

    data.signal({
      end: function(txt){
        t.equals(txt, 'raw hello!');
        t.end();
      }
    });
  });
});
*/

test('PicoEngine - io.picolabs.events ruleset', function(t){
  var pe = mkTestPicoEngine();

  var signal = function(domain, type, attrs){
    return λ.curry(pe.signalEvent, {
      eci: 'id1',
      eid: '1234',
      domain: domain,
      type: type,
      attrs: attrs || {}
    });
  };

  λ.series({
    pico: λ.curry(pe.db.newPico, {}),
    chan: λ.curry(pe.db.newChannel, {pico_id: 'id0', name: 'one', type: 't'}),
    rid4: λ.curry(pe.db.addRuleset, {pico_id: 'id0', rid: 'io.picolabs.events'}),

    bind: signal('events', 'bind', {name: 'blah?!'}),

    or_a: signal('events_or', 'a'),
    or_b: signal('events_or', 'b'),
    or_c: signal('events_or', 'c'),

    and0: signal('events_and', 'a'),
    and1: signal('events_and', 'c'),
    and2: signal('events_and', 'b'),
    and3: signal('events_and', 'b'),
    and4: signal('events_and', 'a'),
    and5: signal('events_and', 'b'),
    and6: signal('events_and', 'b'),
    and7: signal('events_and', 'b'),
    and8: signal('events_and', 'a')

  }, function(err, data){
    if(err) return t.end(err);

    t.deepEquals(omitMeta(data.bind), [
      {name: 'bound', options: {name: 'blah?!'}}
    ]);

    t.deepEquals(omitMeta(data.or_a), [{name: 'or', options: {}}]);
    t.deepEquals(omitMeta(data.or_b), [{name: 'or', options: {}}]);
    t.deepEquals(omitMeta(data.or_c), []);

    t.deepEquals(omitMeta(data.and0), []);
    t.deepEquals(omitMeta(data.and1), []);
    t.deepEquals(omitMeta(data.and2), [{name: 'and', options: {}}]);
    t.deepEquals(omitMeta(data.and3), []);
    t.deepEquals(omitMeta(data.and4), [{name: 'and', options: {}}]);
    t.deepEquals(omitMeta(data.and5), []);
    t.deepEquals(omitMeta(data.and6), []);
    t.deepEquals(omitMeta(data.and7), []);
    t.deepEquals(omitMeta(data.and8), [{name: 'and', options: {}}]);

    t.end();
  });
});

test('PicoEngine - io.picolabs.scope ruleset', function(t){
  var pe = mkTestPicoEngine();

  var signal = function(domain, type, attrs){
    return λ.curry(pe.signalEvent, {
      eci: 'id1',
      eid: '1234',
      domain: domain,
      type: type,
      attrs: attrs || {}
    });
  };

  λ.series({
    pico: λ.curry(pe.db.newPico, {}),
    chan: λ.curry(pe.db.newChannel, {pico_id: 'id0', name: 'one', type: 't'}),
    rid4: λ.curry(pe.db.addRuleset, {pico_id: 'id0', rid: 'io.picolabs.scope'}),

    e1: signal('scope', 'event0', {name: 'name 0'}),
    e2: signal('scope', 'event1', {name: 'name 1'})

  }, function(err, data){
    if(err) return t.end(err);

    t.deepEquals(omitMeta(data.e1), [
      {name: 'say', options: {name: 'name 0'}}
    ]);

    t.deepEquals(omitMeta(data.e1), [
      {name: 'say', options: {name: null}}
    ]);

    t.end();
  });
});
