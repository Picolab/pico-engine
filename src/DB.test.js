var λ = require('contra');
var test = require('tape');
var mkTestPicoEngine = require('./mkTestPicoEngine');

test('DB - write and read', function(t){
  var pe = mkTestPicoEngine();

  λ.series({
    start_db: λ.curry(pe.db.toObj),
    pico0: λ.curry(pe.db.newPico, {}),
    chan1: λ.curry(pe.db.newChannel, {pico_id: 'id0', name: 'one', type: 't'}),
    rule0: λ.curry(pe.db.addRuleset, {pico_id: 'id0', rid: 'rs0'}),
    chan2: λ.curry(pe.db.newChannel, {pico_id: 'id0', name: 'two', type: 't'}),
    end_db: λ.curry(pe.db.toObj)
  }, function(err, data){
    if(err) return t.end(err);

    t.deepEquals(data.start_db, {});

    t.deepEquals(data.end_db, {
      pico: {
        'id0': {
          id: 'id0',
          channel: {
            'id1': {
              id: 'id1',
              name: 'one',
              type: 't'
            },
            'id2': {
              id: 'id2',
              name: 'two',
              type: 't'
            }
          },
          ruleset: {
            'rs0': {on: true}
          }
        }
      }
    });

    t.end();
  });
});
