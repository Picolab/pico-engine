var _ = require("lodash");
var λ = require("contra");
var test = require("tape");
var mkTestPicoEngine = require("./mkTestPicoEngine");

var omitMeta = function(resp){
  if(!_.has(resp, "directives")){
    return resp;
  }
  return _.map(resp.directives, function(d){
    return _.omit(d, "meta");
  });
};

var mkSignalTask = function(pe, eci){
  return function(domain, type, attrs){
    return λ.curry(pe.signalEvent, {
      eci: eci,
      eid: "1234",
      domain: domain,
      type: type,
      attrs: attrs || {}
    });
  };
};

var mkQueryTask = function(pe, eci, rid){
  return function(name, args){
    return λ.curry(pe.runQuery, {
      eci: eci,
      rid: rid,
      name: name,
      args: args || {}
    });
  };
};

var testOutputs = function(t, pairs, callback){
  λ.series(_.map(pairs, function(pair){
    if(!_.isArray(pair)){
      return pair;
    }
    return pair[0];
  }), function(err, results){
    if(err) return callback(err);
    _.each(pairs, function(pair, i){
      if(!_.isArray(pair)){
        return;
      }
      var actual = results[i];
      var expected = pair[1];

      t.deepEquals(omitMeta(actual), expected);
    });
    callback();
  });
};

test("PicoEngine - hello_world ruleset", function(t){
  mkTestPicoEngine({}, function(err, pe){
    if(err)return t.end(err);

    λ.series({
      npico: λ.curry(pe.db.newPico, {}),
      chan0: λ.curry(pe.db.newChannel, {pico_id: "id0", name: "one", type: "t"}),
      rid1x: λ.curry(pe.db.addRuleset, {pico_id: "id0", rid: "io.picolabs.hello_world"}),

      hello_event: λ.curry(pe.signalEvent, {
        eci: "id1",
        eid: "1234",
        domain: "echo",
        type: "hello",
        attrs: {}
      }),
      hello_query: λ.curry(pe.runQuery, {
        eci: "id1",
        rid: "io.picolabs.hello_world",
        name: "hello",
        args: {obj: "Bob"}
      })

    }, function(err, data){
      if(err) return t.end(err);

      t.deepEquals(data.hello_event, {
        directives: [
          {
            name: "say",
            options: {
              something: "Hello World"
            },
            meta: {
              eid: "1234",
              rid: "io.picolabs.hello_world",
              rule_name: "say_hello",
              txn_id: "TODO"
            }
          }
        ]
      });
      t.deepEquals(data.hello_query, "Hello Bob");

      t.end();
    });
  });
});

test("PicoEngine - persistent ruleset", function(t){
  mkTestPicoEngine({}, function(err, pe){
    if(err)return t.end(err);

    λ.series({
      pico0: λ.curry(pe.db.newPico, {}),
      chan1: λ.curry(pe.db.newChannel, {pico_id: "id0", name: "one", type: "t"}),
      rid_0: λ.curry(pe.db.addRuleset, {pico_id: "id0", rid: "io.picolabs.persistent"}),

      pico2: λ.curry(pe.db.newPico, {}),
      chan3: λ.curry(pe.db.newChannel, {pico_id: "id2", name: "three", type: "t"}),
      rid_1: λ.curry(pe.db.addRuleset, {pico_id: "id2", rid: "io.picolabs.persistent"}),

      store_bob0: λ.curry(pe.signalEvent, {
        eci: "id1",
        eid: "1234",
        domain: "store",
        type: "name",
        attrs: {name: "bob"}
      }),

      query0: λ.curry(pe.runQuery, {
        eci: "id1",
        rid: "io.picolabs.persistent",
        name: "getName",
        args: {}
      }),

      store_bob1: λ.curry(pe.signalEvent, {
        eci: "id1",
        eid: "12345",
        domain: "store",
        type: "name",
        attrs: {name: "jim"}
      }),

      query1: λ.curry(pe.runQuery, {
        eci: "id1",
        rid: "io.picolabs.persistent",
        name: "getName",
        args: {}
      }),
      query2: λ.curry(pe.runQuery, {
        eci: "id1",
        rid: "io.picolabs.persistent",
        name: "getName",
        args: {}
      }),

      store_appvar0: λ.curry(pe.signalEvent, {
        eci: "id1",
        eid: "123456",
        domain: "store",
        type: "appvar",
        attrs: {appvar: "global thing"}
      }),
      query3: λ.curry(pe.runQuery, {
        eci: "id1",
        rid: "io.picolabs.persistent",
        name: "getAppVar",
        args: {}
      }),
      query4: λ.curry(pe.runQuery, {
        eci: "id3",
        rid: "io.picolabs.persistent",
        name: "getAppVar",
        args: {}
      })
    }, function(err, data){
      if(err) return t.end(err);

      t.deepEquals(omitMeta(data.store_bob0), [
          {name: "store_name", options: {name: "bob"}}
      ]);

      t.deepEquals(data.query0, "bob");

      t.deepEquals(omitMeta(data.store_bob1), [
        {name: "store_name", options: {name: "jim"}}
      ]);

      t.deepEquals(data.query1, "jim");
      t.deepEquals(data.query2, "jim");

      t.deepEquals(omitMeta(data.store_appvar0), [
        {name: "store_appvar", options: {appvar: "global thing"}}
      ]);
      t.deepEquals(data.query3, "global thing");
      t.deepEquals(data.query4, "global thing");

      t.end();
    });
  });
});

/*
test("PicoEngine - raw ruleset", function(t){
  mkTestPicoEngine({}, function(err, pe){
    if(err)return t.end(err);

    λ.series({
      pico: λ.curry(pe.db.newPico, {}),
      chan: λ.curry(pe.db.newChannel, {pico_id: "id0", name: "one", type: "t"}),
      rid3: λ.curry(pe.db.addRuleset, {pico_id: "id0", rid: "rid3x0"}),

      signal: λ.curry(pe.runQuery, {
        eci: "id1",
        rid: "rid3x0",
        name: "sayRawHello",
        args: {}
      })

    }, function(err, data){
      if(err) return t.end(err);

      t.ok(_.isFunction(data.signal));

      data.signal({
        end: function(txt){
          t.equals(txt, "raw hello!");
          t.end();
        }
      });
    });
  });
});
*/

test("PicoEngine - io.picolabs.events ruleset", function(t){
  mkTestPicoEngine({}, function(err, pe){
    if(err)return t.end(err);

    var query = mkQueryTask(pe, "id1", "io.picolabs.events");
    var signal = mkSignalTask(pe, "id1");

    testOutputs(t, [
      λ.curry(pe.db.newPico, {}),
      λ.curry(pe.db.newChannel, {pico_id: "id0", name: "one", type: "t"}),
      λ.curry(pe.db.addRuleset, {pico_id: "id0", rid: "io.picolabs.events"}),
      [
        signal("events", "bind", {name: "blah?!"}),
        [{name: "bound", options: {name: "blah?!"}}]
      ],
      [
        signal("events", "get", {thing: "asdf"}),
        [{name: "get", options: {thing: "asdf"}}]
      ],
      [
        signal("events", "noop", {}),
        []
      ],
      [
        signal("events", "noop2", {}),
        []
      ],
      [
        signal("events_or", "a"),
        [{name: "or", options: {}}]
      ],
      [
        signal("events_or", "b"),
        [{name: "or", options: {}}]
      ],
      [
        signal("events_or", "c"),
        []
      ],
      [
        signal("events_and", "a"),
        []
      ],
      [
        signal("events_and", "c"),
        []
      ],
      [
        signal("events_and", "b"),
        [{name: "and", options: {}}]
      ],
      [
        signal("events_and", "b"),
        []
      ],
      [
        signal("events_and", "a"),
        [{name: "and", options: {}}]
      ],
      [
        signal("events_and", "b"),
        []
      ],
      [
        signal("events_and", "b"),
        []
      ],
      [
        signal("events_and", "b"),
        []
      ],
      [
        signal("events_and", "a"),
        [{name: "and", options: {}}]
      ],
      [
        signal("events", "ifthen", {name: "something"}),
        [{name: "ifthen", options: {}}]
      ],
      [
        signal("events", "ifthen", {}),
        []
      ],
      [
        signal("events", "on_fired", {name: "blah"}),
        [{name: "on_fired", options: {previous_name: undefined}}]
      ],
      [
        signal("events", "on_fired", {}),
        [{name: "on_fired", options: {previous_name: "blah"}}]
      ],
      [
        signal("events", "on_choose", {thing: "one"}),
        [{name: "on_choose - one", options: {}}]
      ],
      [
        query("getOnChooseFired"),
        true
      ],
      [
        signal("events", "on_choose", {thing: "two"}),
        [{name: "on_choose - two", options: {}}]
      ],
      [
        signal("events", "on_choose", {thing: "wat?"}),
        []
      ],
      [
        query("getOnChooseFired"),
        false
      ],
      [
        signal("events", "select_where", {something: "wat?"}),
        [{name: "select_where", options: {}}]
      ],
      [
        signal("events", "select_where", {something: "ok wat?"}),
        []
      ],
      [signal("events", "no_action", {fired: "no"}), []],
      [query("getNoActionFired"), void 0],
      [signal("events", "no_action", {fired: "yes"}), []],
      [query("getNoActionFired"), true],//fired even though no actions

      //Testing action event:send
      [signal("events", "store_sent_name", {name: "Bob"}), []],
      [query("getSentName"), "Bob"],
      [signal("events", "action_send", {name: "Jim"}), []],
      //this should in turn call store_sent_name and change it
      [query("getSentName"), "Jim"]
    ], t.end);
  });
});

test("PicoEngine - io.picolabs.scope ruleset", function(t){
  mkTestPicoEngine({}, function(err, pe){
    if(err)return t.end(err);

    var query = mkQueryTask(pe, "id1", "io.picolabs.scope");
    var signal = mkSignalTask(pe, "id1");

    testOutputs(t, [
      λ.curry(pe.db.newPico, {}),
      λ.curry(pe.db.newChannel, {pico_id: "id0", name: "one", type: "t"}),
      λ.curry(pe.db.addRuleset, {pico_id: "id0", rid: "io.picolabs.scope"}),
      [
        signal("scope", "event0", {name: "name 0"}),
        [{name: "say", options: {name: "name 0"}}]
      ],
      [
        signal("scope", "event1", {name: "name 1"}),
        [{name: "say", options: {name: undefined}}]
      ],
      [
        signal("scope", "event0", {}),
        [{name: "say", options: {name: ""}}]
      ],
      [
        signal("scope", "prelude", {name: "Bill"}),
        [{name: "say", options: {
          name: "Bill",
          p0: "prelude 0",
          p1: "prelude 1",
          g0: "global 0"
        }}]
      ],
      [
        query("getVals"),
        {name: "Bill", p0: "prelude 0", p1: "prelude 1"}
      ],
      [
        query("g0"),
        "global 0"
      ],
      [
        query("add", {"a": 10, "b": 2}),
        12
      ],
      [
        signal("scope", "functions"),
        [{name: "say", options: {
          add_one_two: 3,
          inc5_3: 8,
          g0: "overrided g0!"
        }}]
      ]
    ], t.end);
  });
});

test("PicoEngine - io.picolabs.operators ruleset", function(t){
  mkTestPicoEngine({}, function(err, pe){
    if(err)return t.end(err);

    var query = mkQueryTask(pe, "id1", "io.picolabs.operators");

    testOutputs(t, [
      λ.curry(pe.db.newPico, {}),
      λ.curry(pe.db.newChannel, {pico_id: "id0", name: "one", type: "t"}),
      λ.curry(pe.db.addRuleset, {pico_id: "id0", rid: "io.picolabs.operators"}),
      [
        query("results"),
        {
          "str_as_num": 100.25,
          "num_as_str": "1.05",
          "regex_as_str": "blah",
          "isnull": [
            false,
            false,
            true
          ],
          "typeof": [
            "Number",
            "String",
            "String",
            "Array",
            "Map",
            "RegExp",
            "Null",
            "Null"
          ],
          "75.chr()": "K",
          "0.range(10)": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
          "10.sprintf": "< 10>",
          ".capitalize()": "Hello World",
          ".decode()": [3, 4, 5],
          ".extract": ["s is a st","ring"],
          ".lc()": "hello world",
          ".match true": true,
          ".match false": false,
          ".ord()": 72,
          ".replace": "Hello Billiam!",
          ".split": ["a", "b", "c"],
          ".sprintf": "Hello Jim!",
          ".substr(5)": "is a string",
          ".substr(5, 4)": "is a",
          ".substr(5, -5)": "is a s",
          ".substr(25)": undefined,
          ".uc()": "HELLO WORLD"
        }
      ],
      [
        query("returnMapAfterKlog"),
        {a: 1}
      ],
      [
        query("returnArrayAfterKlog"),
        [1, 2]
      ]
    ], t.end);
  });
});

test("PicoEngine - io.picolabs.chevron ruleset", function(t){
  mkTestPicoEngine({}, function(err, pe){
    if(err)return t.end(err);

    var query = mkQueryTask(pe, "id1", "io.picolabs.chevron");

    testOutputs(t, [
      λ.curry(pe.db.newPico, {}),
      λ.curry(pe.db.newChannel, {pico_id: "id0", name: "one", type: "t"}),
      λ.curry(pe.db.addRuleset, {pico_id: "id0", rid: "io.picolabs.chevron"}),
      [
        query("d"),
        "\n      hi 1 + 2 = 3\n      <h1>some<b>html</b></h1>\n    "
      ]
    ], t.end);
  });
});

test("PicoEngine - io.picolabs.execution-order ruleset", function(t){
  mkTestPicoEngine({}, function(err, pe){
    if(err)return t.end(err);

    var query = mkQueryTask(pe, "id1", "io.picolabs.execution-order");
    var signal = mkSignalTask(pe, "id1");

    testOutputs(t, [
      λ.curry(pe.db.newPico, {}),
      λ.curry(pe.db.newChannel, {pico_id: "id0", name: "one", type: "t"}),
      λ.curry(pe.db.addRuleset, {pico_id: "id0", rid: "io.picolabs.execution-order"}),
      [
        query("getOrder"),
        void 0
      ],
      [
        signal("execution_order", "all"),
        [{name: "first", options: {}}, {name: "second", options: {}}]
      ],
      [
        query("getOrder"),
        [null, "first-fired", "first-finally", "second-fired", "second-finally"]
      ]
    ], t.end);
  });
});

test("PicoEngine - io.picolabs.engine ruleset", function(t){
  mkTestPicoEngine({}, function(err, pe){
    if(err)return t.end(err);

    var signal = mkSignalTask(pe, "id1");

    testOutputs(t, [
      λ.curry(pe.db.newPico, {}),
      λ.curry(pe.db.newChannel, {pico_id: "id0", name: "one", type: "t"}),
      λ.curry(pe.db.addRuleset, {pico_id: "id0", rid: "io.picolabs.engine"}),
      [signal("engine", "newPico"), []],
      [
        signal("engine", "newChannel", {
          pico_id: "id2",
          name: "krl created chan",
          type: "some type?"
        }),
        []
      ],
      function(done){
        pe.db.toObj(function(err, data){
          if(err)return done(err);
          t.deepEquals(data.pico.id2, {
            id: "id2",
            channel: {
              id3: {
                id: "id3",
                name: "krl created chan",
                type: "some type?"
              }
            }
          });
          done();
        });
      }
    ], t.end);
  });
});

test("PicoEngine - io.picolabs.module-used ruleset", function(t){
  mkTestPicoEngine({}, function(err, pe){
    if(err)return t.end(err);

    var query = mkQueryTask(pe, "id1", "io.picolabs.module-defined");
    var signal = mkSignalTask(pe, "id1");

    testOutputs(t, [
      λ.curry(pe.db.newPico, {}),
      λ.curry(pe.db.newChannel, {pico_id: "id0", name: "one", type: "t"}),
      λ.curry(pe.db.addRuleset, {pico_id: "id0", rid: "io.picolabs.module-used"}),

      // Test overiding module configurations
      [
        signal("module_used", "dflt_name"),
        [{name: "dflt_name", options: {name: "Bob"}}]
      ],
      [
        signal("module_used", "conf_name"),
        [{name: "conf_name", options: {name: "Jim"}}]
      ],

      // Test using provided functions that use `ent` vars
      // NOTE: the dependent ruleset is NOT added to the pico
      [
        signal("module_used", "dflt_info"),
        [{name: "dflt_info", options: {info: {
          name: "Bob",
          memo: void 0,//there is nothing stored in that `ent` var on this pico
          privateFn: "privateFn = name: Bob memo: undefined"
        }}}]
      ],
      [
        signal("module_used", "conf_info"),
        [{name: "conf_info", options: {info: {
          name: "Jim",
          memo: void 0,//there is nothing stored in that `ent` var on this pico
          privateFn: "privateFn = name: Jim memo: undefined"
        }}}]
      ],

      // Assert dependant module is not added to the pico
      [
        signal("module_defined", "store_memo", {memo: "foo"}),
        []//should not respond to this event
      ],
      λ.curry(pe.db.addRuleset, {pico_id: "id0", rid: "io.picolabs.module-defined"}),
      [
        signal("module_defined", "store_memo", {memo: "foo"}),
        [{name: "store_memo", options: {
          name: "Bob",//the default is used when a module is added to a pico
          memo_to_store: "foo"
        }}]
      ],
      [
        query("getInfo"),
        {
          name: "Bob",
          memo: "[\"foo\" by Bob]",
          privateFn: "privateFn = name: Bob memo: [\"foo\" by Bob]"
        }
      ],
      [
        signal("module_used", "dflt_info"),
        [{name: "dflt_info", options: {info: {
          name: "Bob",
          memo: "[\"foo\" by Bob]",
          privateFn: "privateFn = name: Bob memo: [\"foo\" by Bob]"
        }}}]
      ],
      [
        signal("module_used", "conf_info"),
        [{name: "conf_info", options: {info: {
          name: "Jim",//the overrided config is used here
          memo: "[\"foo\" by Bob]",//the memo was stored on the pico ruleset with default config
          privateFn: "privateFn = name: Jim memo: [\"foo\" by Bob]"
        }}}]
      ]
    ], t.end);
  });
});

test("PicoEngine - io.picolabs.expressions ruleset", function(t){
  mkTestPicoEngine({}, function(err, pe){
    if(err)return t.end(err);

    var query = mkQueryTask(pe, "id1", "io.picolabs.expressions");

    testOutputs(t, [
      λ.curry(pe.db.newPico, {}),
      λ.curry(pe.db.newChannel, {pico_id: "id0", name: "one", type: "t"}),
      λ.curry(pe.db.addRuleset, {pico_id: "id0", rid: "io.picolabs.expressions"}),
      [
        query("obj"),
        {
          a: "changed 1",
          b: {c: [2, 3, 4, {d: {e: "changed 5"}}, 6, 7]}
        }
      ],
      [
        query("path1"),
        {e: "changed 5"}
      ],
      [
        query("path2"),
        7
      ],
      [
        query("index1"),
        "changed 1"
      ],
      [
        query("index2"),
        3
      ]
    ], t.end);
  });
});

test("PicoEngine - io.picolabs.meta ruleset", function(t){
  mkTestPicoEngine({}, function(err, pe){
    if(err)return t.end(err);

    var query = mkQueryTask(pe, "id1", "io.picolabs.meta");
    var signal = mkSignalTask(pe, "id1");

    testOutputs(t, [
      λ.curry(pe.db.newPico, {}),
      λ.curry(pe.db.newChannel, {pico_id: "id0", name: "one", type: "t"}),
      λ.curry(pe.db.addRuleset, {pico_id: "id0", rid: "io.picolabs.meta"}),
      [
        signal("meta", "eci"),
        [{name: "eci", options: {eci: "id1"}}]
      ],
      [
        query("eci"),
        "id1"
      ]
    ], t.end);
  });
});
