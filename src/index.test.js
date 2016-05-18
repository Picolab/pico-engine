var _ = require('lodash');
var λ = require('contra');
var test = require('tape');
var mkTestPicoEngine = require('./mkTestPicoEngine');

var omitMeta = function(directives){
  return _.map(directives, function(d){
    return _.omit(d, 'meta');
  });
};


test('PicoEngine - hello_world ruleset', function(t){
  var pe = mkTestPicoEngine();

  λ.series({
    npico: λ.curry(pe.db.newPico, {}),
    chan0: λ.curry(pe.db.newChannel, {pico_id: 'id0', name: 'one', type: 't'}),
    rid1x: λ.curry(pe.db.addRuleset, {pico_id: 'id0', rid: 'rid1x0'}),

    hello_event: λ.curry(pe.signalEvent, {
      eci: 'id1',
      eid: '1234',
      domain: 'echo',
      type: 'hello',
      attrs: {}
    }),
    hello_query: λ.curry(pe.queryFn, 'id1', 'rid1x0', 'hello', {obj: 'Bob'})

  }, function(err, data){
    if(err) return t.end(err);

    t.deepEquals(data.hello_event, [
        {
          name: 'say',
          options: {
            something: 'Hello World'
          },
          meta: {
            eid: '1234',
            rid: 'rid1x0',
            rule_name: 'hello_world',
            txn_id: 'TODO'
          }
        }
    ]);
    t.deepEquals(data.hello_query, 'Hello Bob');

    t.end();
  });
});

test('PicoEngine - store_name ruleset', function(t){
  var pe = mkTestPicoEngine();

  λ.series({
    pico0: λ.curry(pe.db.newPico, {}),
    chan1: λ.curry(pe.db.newChannel, {pico_id: 'id0', name: 'one', type: 't'}),
    rid_0: λ.curry(pe.db.addRuleset, {pico_id: 'id0', rid: 'rid2x0'}),

    pico2: λ.curry(pe.db.newPico, {}),
    chan3: λ.curry(pe.db.newChannel, {pico_id: 'id2', name: 'three', type: 't'}),
    rid_1: λ.curry(pe.db.addRuleset, {pico_id: 'id2', rid: 'rid2x0'}),

    store_bob0: λ.curry(pe.signalEvent, {
      eci: 'id1',
      eid: '1234',
      domain: 'store',
      type: 'name',
      attrs: {name: 'bob'}
    }),

    query0: λ.curry(pe.queryFn, 'id1', 'rid2x0', 'getName', {}),

    store_bob1: λ.curry(pe.signalEvent, {
      eci: 'id1',
      eid: '12345',
      domain: 'store',
      type: 'name',
      attrs: {name: 'jim'}
    }),

    query1: λ.curry(pe.queryFn, 'id1', 'rid2x0', 'getName', {}),
    query2: λ.curry(pe.queryFn, 'id1', 'rid2x0', 'getName', {}),

    store_appvar0: λ.curry(pe.signalEvent, {
      eci: 'id1',
      eid: '123456',
      domain: 'store',
      type: 'appvar',
      attrs: {appvar: 'global thing'}
    }),
    query3: λ.curry(pe.queryFn, 'id1', 'rid2x0', 'getAppVar', {}),
    query4: λ.curry(pe.queryFn, 'id3', 'rid2x0', 'getAppVar', {})

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
      {name: 'store_appvar', options: {name: 'global thing'}}
    ]);
    t.deepEquals(data.query3, 'global thing');
    t.deepEquals(data.query4, 'global thing');

    t.end();
  });
});
