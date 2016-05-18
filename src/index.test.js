var λ = require('contra');
var test = require('tape');
var mkTestPicoEngine = require('./mkTestPicoEngine');

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
