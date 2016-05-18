var λ = require('contra');
var test = require('tape');
var memdown = require('memdown');
var PicoEngine = require('./');

test('DB - write and read', function(t){
  var pe = PicoEngine({
    db: {
      db: memdown,
      newID: (function(){
        var i = 0;
        return function(){
          return 'id' + i++;
        };
      }())
    }
  });

  λ.series({
    start_db: λ.curry(pe.db.dbToObj),
    pico0: λ.curry(pe.db.newPico, {}),
    chan1: λ.curry(pe.db.newChannel, {pico_id: 'id0', name: 'one', type: 't'}),
    rule0: λ.curry(pe.db.addRuleset, {pico_id: 'id0', rid: 'rs0'}),
    chan2: λ.curry(pe.db.newChannel, {pico_id: 'id0', name: 'two', type: 't'}),
    db_data: λ.curry(pe.db.dbToObj)
  }, function(err, data){
    if(err) return t.end(err);

    t.deepEquals(data.db_data, {
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
