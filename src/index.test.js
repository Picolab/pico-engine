var _ = require('lodash');
var λ = require('contra');
var test = require('tape');
var mkTestPicoEngine = require('./mkTestPicoEngine');

test('PicoEngine - the basics', function(t){
  var pe = mkTestPicoEngine();

  λ.series([
    λ.curry(pe.db.toObj),

    λ.curry(pe.db.newPico, {}),
    λ.curry(pe.db.newChannel, {pico_id: 'id0', name: 'one', type: 't'}),
    λ.curry(pe.db.addRuleset, {pico_id: 'id0', rid: 'rid1x0'}),
    λ.curry(pe.db.addRuleset, {pico_id: 'id0', rid: 'rid2x0'}),

    λ.curry(pe.queryFn, 'id1', 'rid1x0', 'hello', {obj: 'Bob'}),

    λ.curry(pe.db.toObj)
  ], function(err, results){
    if(err) return t.end(err);

    t.deepEquals(_.head(results), {});

    t.deepEquals(results[5], 'Hello Bob');

    t.deepEquals(_.last(results), {
      pico: {
        'id0': {
          id: 'id0',
          channel: {
            'id1': {
              id: 'id1',
              name: 'one',
              type: 't'
            }
          },
          ruleset: {
            'rid1x0': {on: true},
            'rid2x0': {on: true}
          }
        }
      }
    });

    t.end();
  });
});
