var λ = require('contra');
var test = require('tape');
var memdown = require('memdown');
var PicoEngine = require('./');

test('write and read', function(t){
  var pe = PicoEngine({db: {db: memdown}});

  λ.waterfall([
    function(next){
      pe.dbToObj(next);
    },
    function(db_data, next){
      t.deepEquals(db_data, {});

      pe.db.newPico({}, next);
    },
    function(new_pico, next){
      λ.series({
        chan0: λ.curry(pe.db.newChannel, {pico_id: new_pico.id, name: 'zero', type: 't'}),
        db_data: λ.curry(pe.db.dbToObj)
      }, function(err, data){
        if(err) return next(err);

        console.log(JSON.stringify(data.db_data, undefined, 2));
        next();
      });
    }
  ], t.end);
});
