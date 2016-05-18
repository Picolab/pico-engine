var test = require('tape');
var memdown = require('memdown');
var PicoEngine = require('./');

test('write and read', function(t){
  var pe = PicoEngine({db: {db: memdown}});

  pe.dbToObj(function(err, db_data){
    if(err) return t.end(err);
    t.deepEquals(db_data, {});

    pe.db.newPico({}, function(err, new_pico){
      if(err) return t.end(err);

      pe.dbToObj(function(err, db_data){
        if(err) return t.end(err);
        var exp = {};
        exp.pico = {};
        exp.pico[new_pico.id] = new_pico;

        t.deepEquals(db_data, exp);
        t.end();
      });
    });
  });

});
