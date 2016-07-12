var _ = require("lodash");
var λ = require("contra");
var test = require("tape");
var mkTestPicoEngine = require("./mkTestPicoEngine");

test("DB - write and read", function(t){
  var pe = mkTestPicoEngine();

  λ.series({
    start_db: λ.curry(pe.db.toObj),
    pico0: λ.curry(pe.db.newPico, {}),
    chan1: λ.curry(pe.db.newChannel, {pico_id: "id0", name: "one", type: "t"}),
    rule0: λ.curry(pe.db.addRuleset, {pico_id: "id0", rid: "rs0"}),
    chan2: λ.curry(pe.db.newChannel, {pico_id: "id0", name: "two", type: "t"}),
    end_db: λ.curry(pe.db.toObj)
  }, function(err, data){
    if(err) return t.end(err);

    t.deepEquals(data.start_db, {});

    t.deepEquals(data.end_db, {
      pico: {
        "id0": {
          id: "id0",
          channel: {
            "id1": {
              id: "id1",
              name: "one",
              type: "t"
            },
            "id2": {
              id: "id2",
              name: "two",
              type: "t"
            }
          },
          ruleset: {
            "rs0": {on: true}
          }
        }
      }
    });

    t.end();
  });
});

test("DB - registerRuleset", function(t){
  var pe = mkTestPicoEngine();

  var krl_src = "ruleset io.picolabs.cool {}";
  var rs_name = "io.picolabs.cool";
  var hash = "7d71c05bc934b0d41fdd2055c7644fc4d0d3eabf303d67fb97f604eaab2c0aa1";
  var timestamp = (new Date()).toISOString();

  var expected = {};
  _.set(expected, ["rulesets", "krl", hash], {
    src: krl_src,
    rs_name: rs_name,
    timestamp: timestamp
  });
  _.set(expected, ["rulesets", "versions", rs_name, timestamp, hash], true);

  λ.series({
    start_db: λ.curry(pe.db.toObj),
    install: function(next){
      pe.db.registerRuleset(krl_src, next, timestamp);
    },
    end_db: λ.curry(pe.db.toObj)
  }, function(err, data){
    if(err) return t.end(err);
    t.deepEquals(data.start_db, {});
    t.deepEquals(data.end_db, expected);
    t.end();
  });
});

test("DB - installRuleset", function(t){
  //TODO
  t.end();
});
