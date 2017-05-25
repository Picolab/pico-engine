var _ = require("lodash");
var λ = require("contra");
var DB = require("./DB");
var cuid = require("cuid");
var test = require("tape");
var http = require("http");
var memdown = require("memdown");
var compiler = require("krl-compiler");
var PicoEngine = require("./");
var mkTestPicoEngine = require("./mkTestPicoEngine");

var omitMeta = function(resp){
    if(!_.has(resp, "directives")){
        return resp;
    }
    var r = _.assign({}, resp, {
        directives: _.map(resp.directives, function(d){
            return _.omit(d, "meta");
        })
    });
    if(_.isEqual(_.keys(r), ["directives"])){
        return r.directives;
    }
    return r;
};

var mkEvent = function (spec, attrs){
    var parts = spec.split("/");
    return {
        eci: parts[0],
        eid: parts[1],
        domain: parts[2],
        type: parts[3],
        attrs: attrs || {},
    };
};

var mkSignalTask = function(pe, eci){
    return function(domain, type, attrs, timestamp, eid){
        return λ.curry(pe.signalEvent, {
            eci: eci,
            eid: eid || "1234",
            domain: domain,
            type: type,
            attrs: attrs || {},
            timestamp: timestamp
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
            npico: λ.curry(pe.newPico, {}),
            chan0: λ.curry(pe.newChannel, {pico_id: "id0", name: "one", type: "t"}),
            rid1x: λ.curry(pe.installRuleset, "id0", "io.picolabs.hello_world"),

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

test("PicoEngine - io.picolabs.persistent", function(t){
    mkTestPicoEngine({}, function(err, pe){
        if(err)return t.end(err);

        //two picos with the same ruleset
        var A_query = mkQueryTask(pe, "id2", "io.picolabs.persistent");
        var B_query = mkQueryTask(pe, "id3", "io.picolabs.persistent");
        var A_signal = mkSignalTask(pe, "id2");
        var B_signal = mkSignalTask(pe, "id3");

        testOutputs(t, [
            λ.curry(pe.newPico, {}),//id0 - pico A
            λ.curry(pe.newPico, {}),//id1 - pico B
            λ.curry(pe.newChannel, {pico_id: "id0", name: "one", type: "t"}),//id2
            λ.curry(pe.newChannel, {pico_id: "id1", name: "one", type: "t"}),//id3
            λ.curry(pe.installRuleset, "id0", "io.picolabs.persistent"),
            λ.curry(pe.installRuleset, "id1", "io.picolabs.persistent"),

            //////////////////////////////////////////////////////////////////////////
            //if not set, the var should return undefined
            [A_query("getName"), void 0],
            [A_query("getAppVar"), void 0],

            //////////////////////////////////////////////////////////////////////////
            //store different names on each pico
            [
                A_signal("store", "name", {name: "Alf"}),
                [{name: "store_name", options: {name: "Alf"}}]
            ],
            [
                B_signal("store", "name", {name: "Bob"}),
                [{name: "store_name", options: {name: "Bob"}}]
            ],
            //pico's should have their respective names
            [A_query("getName"), "Alf"],
            [B_query("getName"), "Bob"],

            //////////////////////////////////////////////////////////////////////////
            //app vars are shared per-ruleset
            [
                A_signal("store", "appvar", {appvar: "Some appvar"}),
                [{name: "store_appvar", options: {appvar: "Some appvar"}}]
            ],
            [A_query("getAppVar"), "Some appvar"],
            [B_query("getAppVar"), "Some appvar"],
            [
                B_signal("store", "appvar", {appvar: "Changed by B"}),
                [{name: "store_appvar", options: {appvar: "Changed by B"}}]
            ],
            [A_query("getAppVar"), "Changed by B"],
            [B_query("getAppVar"), "Changed by B"],

            //////////////////////////////////////////////////////////////////////////
            //query paths
            [
                A_signal("store", "user_firstname", {firstname: "Leonard"}),
                [{name: "store_user_firstname", options: {name: "Leonard"}}]
            ],
            [A_query("getUser"), {firstname: "Leonard", "lastname": "McCoy"}],
            [A_query("getUserFirstname"), "Leonard"],

            //////////////////////////////////////////////////////////////////////////
            //clear vars
            function(done){
                pe.dbDump(function(err, data){
                    if(err)return done(err);
                    t.ok(_.has(data, ["pico", "id0", "io.picolabs.persistent", "vars", "user"]));
                    t.ok(_.has(data, ["resultset", "io.picolabs.persistent", "vars", "appvar"]));
                    done();
                });
            },
            [A_signal("store", "clear_user"), [{name: "clear_user", options: {}}]],
            function(done){
                pe.dbDump(function(err, data){
                    if(err)return done(err);
                    t.notOk(_.has(data, ["pico", "id0", "io.picolabs.persistent", "vars", "user"]));
                    t.ok(_.has(data, ["resultset", "io.picolabs.persistent", "vars", "appvar"]));
                    done();
                });
            },
            [A_signal("store", "clear_appvar"), [{name: "clear_appvar", options: {}}]],
            function(done){
                pe.dbDump(function(err, data){
                    if(err)return done(err);
                    t.notOk(_.has(data, ["pico", "id0", "io.picolabs.persistent", "vars", "user"]));
                    t.notOk(_.has(data, ["resultset", "io.picolabs.persistent", "vars", "appvar"]));
                    done();
                });
            },
        ], t.end);
    });
});

test("PicoEngine - io.picolabs.events ruleset", function(t){
    mkTestPicoEngine({}, function(err, pe){
        if(err)return t.end(err);

        var query = mkQueryTask(pe, "id1", "io.picolabs.events");
        var signal = mkSignalTask(pe, "id1");

        testOutputs(t, [
            λ.curry(pe.newPico, {}),
            λ.curry(pe.newChannel, {pico_id: "id0", name: "one", type: "t"}),
            λ.curry(pe.installRuleset, "id0", "io.picolabs.events"),
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
            function(next){
                signal("events", "on_sample")(function(err, resp){
                    if(err) return next(err);
                    t.equals(_.size(resp.directives), 1, "only one action should be sampled");
                    t.ok(/^on_sample - (one|two|three)$/.test(_.head(resp.directives).name));
                    next();
                });
            },
            [
                signal("events", "on_sample_if"),
                []//nothing b/c it did not fire
            ],
            function(next){
                signal("events", "on_sample_if", {fire: "yes"})(function(err, resp){
                    if(err) return next(err);
                    t.equals(_.size(resp.directives), 1, "only one action should be sampled");
                    t.ok(/^on_sample - (one|two|three)$/.test(_.head(resp.directives).name));
                    next();
                });
            },
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
            [query("getSentAttrs"), {name: "Bob"}],
            [query("getSentName"), "Bob"],
            [signal("events", "action_send", {name: "Jim"}), []],
            //this should in turn call store_sent_name and change it
            [query("getSentAttrs"), {name: "Jim"}],
            [query("getSentName"), "Jim"],

            //////////////////////////////////////////////////////////////////////////
            //Testing raise <domain> event
            [signal("events", "raise_set_name", {name: "Raised"}), []],
            [query("getSentAttrs"), {name: "Raised"}],
            [query("getSentName"), "Raised"],

            [signal("events", "raise_set_name_attr", {name: "Raised-2"}), []],
            [query("getSentAttrs"), {name: "Raised-2"}],
            [query("getSentName"), "Raised-2"],

            [signal("events", "raise_set_name_rid", {name: "Raised-3"}), []],
            [query("getSentAttrs"), {name: "Raised-3"}],
            [query("getSentName"), "Raised-3"],

            //////////////////////////////////////////////////////////////////////////
            [
                signal("events", "event_eid", {}, void 0, "some eid for this test"),
                [{name: "event_eid", options: {eid: "some eid for this test"}}]
            ],
        ], t.end);
    });
});

test("PicoEngine - io.picolabs.scope ruleset", function(t){
    mkTestPicoEngine({}, function(err, pe){
        if(err)return t.end(err);

        var query = mkQueryTask(pe, "id1", "io.picolabs.scope");
        var signal = mkSignalTask(pe, "id1");

        testOutputs(t, [
            λ.curry(pe.newPico, {}),
            λ.curry(pe.newChannel, {pico_id: "id0", name: "one", type: "t"}),
            λ.curry(pe.installRuleset, "id0", "io.picolabs.scope"),
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
                query("sum", {"arr": [1, 2, 3, 4, 5]}),
                15
            ],
            [
                signal("scope", "functions"),
                [{name: "say", options: {
                    add_one_two: 3,
                    inc5_3: 8,
                    g0: "overrided g0!"
                }}]
            ],
            [
                query("mapped"),
                [2, 3, 4]
            ]
        ], t.end);
    });
});

test("PicoEngine - io.picolabs.operators ruleset", function(t){
    mkTestPicoEngine({}, function(err, pe){
        if(err)return t.end(err);

        var query = mkQueryTask(pe, "id1", "io.picolabs.operators");

        testOutputs(t, [
            λ.curry(pe.newPico, {}),
            λ.curry(pe.newChannel, {pico_id: "id0", name: "one", type: "t"}),
            λ.curry(pe.installRuleset, "id0", "io.picolabs.operators"),
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
            λ.curry(pe.newPico, {}),
            λ.curry(pe.newChannel, {pico_id: "id0", name: "one", type: "t"}),
            λ.curry(pe.installRuleset, "id0", "io.picolabs.chevron"),
            [
                query("d"),
                "\n            hi 1 + 2 = 3\n            <h1>some<b>html</b></h1>\n        "
            ]
        ], t.end);
    });
});

test("PicoEngine - io.picolabs.execution-order ruleset", function(t){
    mkTestPicoEngine({}, function(err, pe){
        if(err)return t.end(err);

        var query = mkQueryTask(pe, "id1", "io.picolabs.execution-order");
        var signal = mkSignalTask(pe, "id1");
        var query2 = mkQueryTask(pe, "id1", "io.picolabs.execution-order2");

        testOutputs(t, [
            λ.curry(pe.newPico, {}),
            λ.curry(pe.newChannel, {pico_id: "id0", name: "one", type: "t"}),
            λ.curry(pe.installRuleset, "id0", "io.picolabs.execution-order"),
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
            ],
            [
                signal("execution_order", "reset_order"),
                [{name: "reset_order", options: {}}]
            ],
            [
                query("getOrder"),
                []
            ],
            [
                signal("execution_order", "foo"),
                [{name: "foo_or_bar", options: {}}, {name: "foo", options: {}}]
            ],
            [
                signal("execution_order", "bar"),
                [{name: "foo_or_bar", options: {}}, {name: "bar", options: {}}]
            ],
            [
                query("getOrder"),
                ["foo_or_bar", "foo", "foo_or_bar", "bar"]
            ],
            λ.curry(pe.installRuleset, "id0", "io.picolabs.execution-order2"),
            [
                signal("execution_order", "reset_order"),
                [{name: "reset_order", options: {}}, {name: "2 - reset_order", options: {}}]
            ],
            [
                signal("execution_order", "bar"),
                [
                    {name: "foo_or_bar", options: {}},
                    {name: "bar", options: {}},
                    {name: "2 - foo_or_bar", options: {}},
                    {name: "2 - bar", options: {}},
                ]
            ],
            [
                query("getOrder"),
                ["foo_or_bar", "bar"]
            ],
            [
                query2("getOrder"),
                ["2 - foo_or_bar", "2 - bar"]
            ],
        ], t.end);
    });
});

test("PicoEngine - io.picolabs.engine ruleset", function(t){
    mkTestPicoEngine({}, function(err, pe){
        if(err)return t.end(err);

        var signal = mkSignalTask(pe, "id1");

        testOutputs(t, [
            λ.curry(pe.newPico, {}),
            λ.curry(pe.newChannel, {pico_id: "id0", name: "one", type: "t"}),
            λ.curry(pe.installRuleset, "id0", "io.picolabs.engine"),
            [signal("engine", "newPico"), []],
            [
                signal("engine", "newChannel", {
                    pico_id: "id2",
                    name: "krl created chan",
                    type: "some type?"
                }),
                []
            ],
            [signal("engine", "installRuleset", {
                pico_id: "id2",
                rid: "io.picolabs.meta",
            }),[]],
            [signal("engine", "installRuleset", {
                pico_id: "id2",
                base: "https://raw.githubusercontent.com/Picolab/node-pico-engine-core/master/test-rulesets/",
                url: "scope.krl",
            }),[]],
            function(done){
                pe.dbDump(function(err, data){
                    if(err)return done(err);
                    t.deepEquals(data.pico.id2, {
                        id: "id2",
                        channel: {
                            id3: {
                                id: "id3",
                                name: "krl created chan",
                                type: "some type?"
                            }
                        },
                        ruleset: {
                            "io.picolabs.meta": {on: true},
                            "io.picolabs.scope": {on: true},
                        }
                    });
                    done();
                });
            },
            [
                signal("engine", "removeChannel", {
                    eci: "id3",
                }),
                []
            ],
            function(done){
                pe.dbDump(function(err, data){
                    if(err)return done(err);
                    t.deepEquals(data.pico.id2, {
                        id: "id2",
                        //channel: {}, channel is removed
                        ruleset: {
                            "io.picolabs.meta": {on: true},
                            "io.picolabs.scope": {on: true},
                        }
                    });
                    done();
                });
            },
        ], t.end);
    });
});

test("PicoEngine - io.picolabs.module-used ruleset", function(t){
    mkTestPicoEngine({}, function(err, pe){
        if(err)return t.end(err);

        var query = mkQueryTask(pe, "id1", "io.picolabs.module-defined");
        var signal = mkSignalTask(pe, "id1");

        testOutputs(t, [
            λ.curry(pe.newPico, {}),
            λ.curry(pe.newChannel, {pico_id: "id0", name: "one", type: "t"}),
            λ.curry(pe.installRuleset, "id0", "io.picolabs.module-used"),

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
            λ.curry(pe.installRuleset, "id0", "io.picolabs.module-defined"),
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
            ],
            function(next){
                pe.runQuery({
                    eci: "id1",
                    rid: "io.picolabs.module-used",
                    name: "now",
                    args: {}
                }, function(err, ts){
                    if(err) return next(err);
                    t.ok(/^[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T/.test(ts));
                    next();
                });
            },


            //Test unregisterRuleset checks
            function(next){
                pe.unregisterRuleset("io.picolabs.module-defined", function(err){
                    t.equals(err + "", "Error: \"io.picolabs.module-defined\" is depended on by \"io.picolabs.module-used\"");
                    next();
                });
            },
            function(next){
                pe.unregisterRuleset("io.picolabs.module-used", function(err){
                    t.equals(err + "", "Error: unregisterRuleset(\"io.picolabs.module-used\")- it is installed by at least one pico");
                    next();
                });
            },
        ], t.end);
    });
});

test("PicoEngine - io.picolabs.expressions ruleset", function(t){
    mkTestPicoEngine({}, function(err, pe){
        if(err)return t.end(err);

        var query = mkQueryTask(pe, "id1", "io.picolabs.expressions");

        testOutputs(t, [
            λ.curry(pe.newPico, {}),
            λ.curry(pe.newChannel, {pico_id: "id0", name: "one", type: "t"}),
            λ.curry(pe.installRuleset, "id0", "io.picolabs.expressions"),
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
            ],
            [
                query("paramFnTest"),
                [
                    [4, 6, "6?"],
                    ["one", "one2", "one2?"],
                    [3, 4, 5],
                ]
            ],
        ], t.end);
    });
});

test("PicoEngine - io.picolabs.meta ruleset", function(t){
    mkTestPicoEngine({}, function(err, pe){
        if(err)return t.end(err);

        var query = mkQueryTask(pe, "id1", "io.picolabs.meta");
        var signal = mkSignalTask(pe, "id1");

        testOutputs(t, [
            λ.curry(pe.newPico, {}),
            λ.curry(pe.newChannel, {pico_id: "id0", name: "one", type: "t"}),
            λ.curry(pe.installRuleset, "id0", "io.picolabs.meta"),
            [
                signal("meta", "event"),
                [{name: "event", options: {
                    rid: "io.picolabs.meta",
                    host: "https://test-host",
                    rulesetName: "testing meta module",
                    rulesetDescription: "\nsome description for the meta test module\n        ",
                    rulesetAuthor: "meta author",
                    rulesetURI: "https://raw.githubusercontent.com/Picolab/node-pico-engine-core/master/test-rulesets/meta.krl",
                    ruleName: "meta_event",
                    inEvent: true,
                    inQuery: false,
                    eci: "id1",
                }}]
            ],
            [
                query("metaQuery"),
                {
                    rid: "io.picolabs.meta",
                    host: "https://test-host",
                    rulesetName: "testing meta module",
                    rulesetDescription: "\nsome description for the meta test module\n        ",
                    rulesetAuthor: "meta author",
                    rulesetURI: "https://raw.githubusercontent.com/Picolab/node-pico-engine-core/master/test-rulesets/meta.krl",
                    ruleName: void 0,
                    inEvent: false,
                    inQuery: true,
                    eci: "id1",
                }
            ],
        ], t.end);
    });
});

test("PicoEngine - io.picolabs.http ruleset", function(t){
    mkTestPicoEngine({}, function(err, pe){
        if(err)return t.end(err);

        var query = mkQueryTask(pe, "id1", "io.picolabs.http");
        var signal = mkSignalTask(pe, "id1");

        var server = http.createServer(function(req, res){
            var body = "";
            req.on("data", function(buffer){
                body += buffer.toString();
            });
            req.on("end", function(){
                var out = JSON.stringify({
                    url: req.url,
                    headers: req.headers,
                    body: body,
                }, false, 2);
                res.writeHead(200, {
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(out),
                });
                res.end(out);
            });
        });

        server.listen(0, function(){
            var url = "http://localhost:" + server.address().port;
            testOutputs(t, [
                λ.curry(pe.newPico, {}),
                λ.curry(pe.newChannel, {pico_id: "id0", name: "one", type: "t"}),
                λ.curry(pe.installRuleset, "id0", "io.picolabs.http"),
                [
                    signal("http_test", "get", {url: url}),
                    []
                ],
                [
                    query("getResp"),
                    {
                        content: {
                            url: "/?foo=bar",
                            headers: {
                                baz: "quix",
                                connection: "close",
                                host: "localhost:" + server.address().port
                            },
                            body: ""
                        },
                        content_type: "application/json",
                        status_code: 200,
                        status_line: "OK",
                        headers: {
                            "content-type": "application/json",
                            "connection": "close",
                        }
                    }
                ],
                [
                    signal("http_test", "post", {url: url}),
                    []//nothing should be returned
                ],
                [
                    signal("http_test", "post_setting", {url: url}),
                    []//nothing should be returned
                ],
                [
                    query("getResp"),
                    {
                        content: {
                            url: "/?foo=bar",
                            headers: {
                                connection: "close",
                                "content-type": "application/x-www-form-urlencoded",
                                host: "localhost:" + server.address().port
                            },
                            body: "baz=qux"
                        },
                        content_type: "application/json",
                        status_code: 200,
                        status_line: "OK",
                        headers: {
                            "content-type": "application/json",
                            "connection": "close",
                        }
                    }
                ],

                //testing autoraise
                [
                    signal("http_test", "autoraise", {url: url}),
                    //autoraise happens on the same event schedule
                    [{
                        name: "http_post_event_handler",
                        options: {attrs: {
                            content: {
                                body: "baz=qux",
                                headers: {
                                    connection: "close",
                                    "content-type": "application/x-www-form-urlencoded",
                                    host: "localhost:" + server.address().port
                                },
                                url: "/?foo=bar"
                            },
                            content_type: "application/json",
                            headers: {
                                connection: "close",
                                "content-type": "application/json"
                            },
                            label: "foobar",
                            status_code: 200,
                            status_line: "OK"
                        }}
                    }]
                ],
                [
                    query("getLastPostEvent"),
                    {
                        content: {
                            body: "baz=qux",
                            headers: {
                                connection: "close",
                                "content-type": "application/x-www-form-urlencoded",
                                host: "localhost:" + server.address().port
                            },
                            url: "/?foo=bar"
                        },
                        content_type: "application/json",
                        headers: {
                            connection: "close",
                            "content-type": "application/json"
                        },
                        label: "foobar",
                        status_code: 200,
                        status_line: "OK"
                    }
                ],
            ], function(err){
                //stop the server so it doesn't hang forever
                server.close();
                t.end(err);
            });
        });
    });
});

test("PicoEngine - io.picolabs.foreach ruleset", function(t){
    mkTestPicoEngine({}, function(err, pe){
        if(err)return t.end(err);

        var signal = mkSignalTask(pe, "id1");

        testOutputs(t, [
            λ.curry(pe.newPico, {}),
            λ.curry(pe.newChannel, {pico_id: "id0", name: "one", type: "t"}),
            λ.curry(pe.installRuleset, "id0", "io.picolabs.foreach"),
            [
                signal("foreach", "basic"),
                [
                        {name: "basic", options: {x: 1}},
                        {name: "basic", options: {x: 2}},
                        {name: "basic", options: {x: 3}}
                ]
            ],
            [
                signal("foreach", "map"),
                [
                        {name: "map", options: {k: "a", v: 1}},
                        {name: "map", options: {k: "b", v: 2}},
                        {name: "map", options: {k: "c", v: 3}}
                ]
            ],
            [
                signal("foreach", "nested"),
                [
                        {name: "nested", options: {x: 1, y: "a"}},
                        {name: "nested", options: {x: 1, y: "b"}},
                        {name: "nested", options: {x: 1, y: "c"}},
                        {name: "nested", options: {x: 2, y: "a"}},
                        {name: "nested", options: {x: 2, y: "b"}},
                        {name: "nested", options: {x: 2, y: "c"}},
                        {name: "nested", options: {x: 3, y: "a"}},
                        {name: "nested", options: {x: 3, y: "b"}},
                        {name: "nested", options: {x: 3, y: "c"}},
                ]
            ],
            [
                signal("foreach", "scope"),
                [
                        {name: "scope", options: {foo: 1, bar: 0, baz: 0}},
                        {name: "scope", options: {foo: 1, bar: 1, baz: 1}},

                        {name: "scope", options: {foo: 2, bar: 0, baz: 0}},
                        {name: "scope", options: {foo: 2, bar: 1, baz: 2}},
                        {name: "scope", options: {foo: 2, bar: 2, baz: 4}},

                        {name: "scope", options: {foo: 3, bar: 0, baz: 0}},
                        {name: "scope", options: {foo: 3, bar: 1, baz: 3}},
                        {name: "scope", options: {foo: 3, bar: 2, baz: 6}},
                        {name: "scope", options: {foo: 3, bar: 3, baz: 9}},

                        {name: "scope", options: {foo: 1, bar: 0, baz: 0}},
                        {name: "scope", options: {foo: 1, bar: 1, baz: 1}},

                        {name: "scope", options: {foo: 2, bar: 0, baz: 0}},
                        {name: "scope", options: {foo: 2, bar: 1, baz: 2}},
                        {name: "scope", options: {foo: 2, bar: 2, baz: 4}},

                        {name: "scope", options: {foo: 3, bar: 0, baz: 0}},
                        {name: "scope", options: {foo: 3, bar: 1, baz: 3}},
                        {name: "scope", options: {foo: 3, bar: 2, baz: 6}},
                        {name: "scope", options: {foo: 3, bar: 3, baz: 9}},
                ]
            ],
        ], t.end);
    });
});

test("PicoEngine - io.picolabs.event-exp ruleset", function(t){
    mkTestPicoEngine({}, function(err, pe){
        if(err)return t.end(err);

        var signal = mkSignalTask(pe, "id1");

        testOutputs(t, [
            λ.curry(pe.newPico, {}),
            λ.curry(pe.newChannel, {pico_id: "id0", name: "one", type: "t"}),
            λ.curry(pe.installRuleset, "id0", "io.picolabs.event-exp"),
        ].concat(_.map([

            ["ee_before", "a"],
            ["ee_before", "b", {}, "before"],
            ["ee_before", "b"],
            ["ee_before", "b"],
            ["ee_before", "a"],
            ["ee_before", "a"],
            ["ee_before", "c"],
            ["ee_before", "b", {}, "before"],


            ["ee_after", "a"],
            ["ee_after", "b"],
            ["ee_after", "a", {}, "after"],
            ["ee_after", "a"],
            ["ee_after", "a"],
            ["ee_after", "b"],
            ["ee_after", "c"],
            ["ee_after", "a", {}, "after"],


            ["ee_then", "a", {name: "bob"}],
            ["ee_then", "b", {name: "bob"}, "then"],
            ["ee_then", "b", {name: "bob"}],
            ["ee_then", "a", {name: "bob"}],
            ["ee_then", "b", {name: "..."}],
            ["ee_then", "b", {name: "bob"}],


            ["ee_and", "a"],
            ["ee_and", "c"],
            ["ee_and", "b", {}, "and"],
            ["ee_and", "b"],
            ["ee_and", "a", {}, "and"],
            ["ee_and", "b"],
            ["ee_and", "b"],
            ["ee_and", "b"],
            ["ee_and", "a", {}, "and"],


            ["ee_or", "a", {}, "or"],
            ["ee_or", "b", {}, "or"],
            ["ee_or", "c"],


            ["ee_between", "b"],
            ["ee_between", "a"],
            ["ee_between", "c", {}, "between"],
            ["ee_between", "b"],
            ["ee_between", "a"],
            ["ee_between", "a"],
            ["ee_between", "c", {}, "between"],
            ["ee_between", "b"],
            ["ee_between", "a"],
            ["ee_between", "b"],
            ["ee_between", "c", {}, "between"],

            ["ee_not_between", "b"],
            ["ee_not_between", "c", {}, "not between"],
            ["ee_not_between", "b"],
            ["ee_not_between", "a"],
            ["ee_not_between", "c"],
            ["ee_not_between", "b"],
            ["ee_not_between", "c", {}, "not between"],
            ["ee_not_between", "c"],

            ["ee_andor", "c", {}, "(a and b) or c"],
            ["ee_andor", "a"],
            ["ee_andor", "c"],
            ["ee_andor", "b", {}, "(a and b) or c"],

            ["ee_orand", "a"],
            ["ee_orand", "b", {}, "a and (b or c)"],
            ["ee_orand", "c"],
            ["ee_orand", "a", {}, "a and (b or c)"],

            ["ee_and_n", "a"],
            ["ee_and_n", "c"],
            ["ee_and_n", "b", {}, "and_n"],

            ["ee_or_n", "a", {}, "or_n"],
            ["ee_or_n", "d", {}, "or_n"],

            ["ee_any", "a"],
            ["ee_any", "a"],
            ["ee_any", "b", {}, "any"],
            ["ee_any", "c"],
            ["ee_any", "a", {}, "any"],

            ["ee_count", "a"],
            ["ee_count", "a"],
            ["ee_count", "a", {}, "count"],
            ["ee_count", "a"],
            ["ee_count", "a"],
            ["ee_count", "a", {}, "count"],
            ["ee_count", "a"],

            ["ee_repeat", "a", {name: "bob"}],
            ["ee_repeat", "a", {name: "bob"}],
            ["ee_repeat", "a", {name: "bob"}, "repeat"],
            ["ee_repeat", "a", {name: "bob"}, "repeat"],
            ["ee_repeat", "a", {name: "..."}],
            ["ee_repeat", "a", {name: "bob"}],

            ["ee_count_max", "a", {b: "3"}],
            ["ee_count_max", "a", {b: "8"}],
            ["ee_count_max", "a", {b: "5"}, {name: "count_max", options: {m: 8}}],
            ["ee_count_max", "a", {b: "1"}],
            ["ee_count_max", "a", {b: "0"}],
            ["ee_count_max", "a", {b: "0"}, {name: "count_max", options: {m: 1}}],
            ["ee_count_max", "a", {b: "0"}],
            ["ee_count_max", "a", {b: "0"}],
            ["ee_count_max", "a", {b: "7"}, {name: "count_max", options: {m: 7}}],

            ["ee_repeat_min", "a", {b: "5"}],
            ["ee_repeat_min", "a", {b: "3"}],
            ["ee_repeat_min", "a", {b: "4"}, {name: "repeat_min", options: {m: 3}}],
            ["ee_repeat_min", "a", {b: "5"}, {name: "repeat_min", options: {m: 3}}],
            ["ee_repeat_min", "a", {b: "6"}, {name: "repeat_min", options: {m: 4}}],
            ["ee_repeat_min", "a", {b: null}],
            ["ee_repeat_min", "a", {b: "3"}],
            ["ee_repeat_min", "a", {b: "8"}],
            ["ee_repeat_min", "a", {b: "1"}, {name: "repeat_min", options: {m: 1}}],
            ["ee_repeat_min", "a", {b: "2"}, {name: "repeat_min", options: {m: 1}}],
            ["ee_repeat_min", "a", {b: "3"}, {name: "repeat_min", options: {m: 1}}],
            ["ee_repeat_min", "a", {b: "4"}, {name: "repeat_min", options: {m: 2}}],
            ["ee_repeat_min", "a", {b: "5"}, {name: "repeat_min", options: {m: 3}}],
            ["ee_repeat_min", "a", {b: "6"}, {name: "repeat_min", options: {m: 4}}],
            ["ee_repeat_min", "a", {b: "7"}, {name: "repeat_min", options: {m: 5}}],

            ["ee_repeat_sum", "a", {b: "1"}],
            ["ee_repeat_sum", "a", {b: "2"}],
            ["ee_repeat_sum", "a", {b: "3"}, {name: "repeat_sum", options: {m: 6}}],
            ["ee_repeat_sum", "a", {b: "4"}, {name: "repeat_sum", options: {m: 9}}],

            ["ee_repeat_avg", "a", {b: "1"}],
            ["ee_repeat_avg", "a", {b: "2"}],
            ["ee_repeat_avg", "a", {b: "3"}, {name: "repeat_avg", options: {m: 2}}],
            ["ee_repeat_avg", "a", {b: "100"}, {name: "repeat_avg", options: {m: 35}}],

            ["ee_repeat_push", "a", {b: "1"}],
            ["ee_repeat_push", "a", {b: "2"}],
            ["ee_repeat_push", "a", {b: "3"}, {name: "repeat_push", options: {m: ["1", "2", "3"]}}],
            ["ee_repeat_push", "a", {b: "4"}, {name: "repeat_push", options: {m: ["2", "3", "4"]}}],
            ["ee_repeat_push", "a", {b: "five"}],
            ["ee_repeat_push", "a", {b: "6"}],
            ["ee_repeat_push", "a", {b: "7"}],
            ["ee_repeat_push", "a", {b: "8"}, {name: "repeat_push", options: {m: ["6", "7", "8"]}}],

            ["ee_repeat_push_multi", "a", {a: "1", b: "2 three"}],
            ["ee_repeat_push_multi", "a", {a: "2", b: "3 four"}],
            ["ee_repeat_push_multi", "a", {a: "3", b: "4 five"}],
            ["ee_repeat_push_multi", "a", {a: "4", b: "5 six"}],
            ["ee_repeat_push_multi", "a", {a: "5", b: "6 seven"}, {name: "repeat_push_multi", options: {
                a: ["1", "2", "3", "4", "5"],
                b: ["2", "3", "4", "5", "6"],
                c: ["three", "four", "five", "six", "seven"],
                d: [null, null, null, null, null],
            }}],

            ["ee_repeat_sum_multi", "a", {a: "1", b: "2"}],
            ["ee_repeat_sum_multi", "a", {a: "2", b: "3"}],
            ["ee_repeat_sum_multi", "a", {a: "3", b: "4"}, {name: "repeat_sum_multi", options: {
                a: 6,
                b: 9,
            }}],

        ], function(p){
            var ans = [];
            if(_.isString(p[3])){
                ans.push({name: p[3], options: {}});
            }else if(p[3]){
                ans.push(p[3]);
            }
            return [signal(p[0], p[1], p[2]), ans];
        })), t.end);
    });
});

test("PicoEngine - io.picolabs.within ruleset", function(t){
    mkTestPicoEngine({}, function(err, pe){
        if(err)return t.end(err);

        var signal = mkSignalTask(pe, "id1");

        testOutputs(t, [
            λ.curry(pe.newPico, {}),
            λ.curry(pe.newChannel, {pico_id: "id0", name: "one", type: "t"}),
            λ.curry(pe.installRuleset, "id0", "io.picolabs.within"),
        ].concat(_.map([

            [10000000000000, "foo", "a"],
            [10000000000001, "foo", "b", {}, "foo"],
            [10000000000002, "foo", "a"],
            [10000000555555, "foo", "b"],
            [10000000555556, "foo", "a"],
            [10000000255557, "foo", "b", {}, "foo"],

            [10000000000000, "bar", "a"],
            [10000000003999, "bar", "b", {}, "bar"],
            [10000000000000, "bar", "a"],
            [10000000004000, "bar", "b", {}, "bar"],
            [10000000000000, "bar", "a"],
            [10000000004001, "bar", "b"],

            [10000000000000, "baz", "a", {}, "baz"],
            [10000000000000, "baz", "b"],
            [10031536000000, "baz", "c", {}, "baz"],
            [10000000000000, "baz", "c"],
            [10040000000000, "baz", "b"],
            [10050000000000, "baz", "c", {}, "baz"],

            [10000000000000, "qux", "a", {b: "c"}],
            [10000000000001, "qux", "a", {b: "c"}],
            [10000000001002, "qux", "a", {b: "c"}, "qux"],
            [10000000002003, "qux", "a", {b: "c"}],
            [10000000002004, "qux", "a", {b: "c"}],
            [10000000002005, "qux", "a", {b: "c"}, "qux"],
            [10000000002006, "qux", "a", {b: "c"}, "qux"],
            [10000000002007, "qux", "a", {b: "z"}],
            [10000000002008, "qux", "a", {b: "c"}],
            [10000000002009, "qux", "a", {b: "c"}],
            [10000000004008, "qux", "a", {b: "c"}, "qux"],

        ], function(p){
            var ans = [];
            if(_.isString(p[4])){
                ans.push({name: p[4], options: {}});
            }else if(p[4]){
                ans.push(p[4]);
            }
            return [signal(p[1], p[2], p[3], new Date(p[0])), ans];
        })), t.end);
    });
});

test("PicoEngine - io.picolabs.guard-conditions ruleset", function(t){
    mkTestPicoEngine({}, function(err, pe){
        if(err)return t.end(err);

        var query = mkQueryTask(pe, "id1", "io.picolabs.guard-conditions");
        var signal = mkSignalTask(pe, "id1");

        testOutputs(t, [
            λ.curry(pe.newPico, {}),
            λ.curry(pe.newChannel, {pico_id: "id0", name: "one", type: "t"}),
            λ.curry(pe.installRuleset, "id0", "io.picolabs.guard-conditions"),
            [
                query("getB"),
                undefined
            ],
            [
                signal("foo", "a", {b: "foo"}),
                [{name: "foo", options: {b: "foo"}}]
            ],
            [
                query("getB"),
                "foo"
            ],
            [
                signal("foo", "a", {b: "bar"}),
                [{name: "foo", options: {b: "bar"}}]
            ],
            [
                query("getB"),
                "foo"
            ],
            [
                signal("foo", "a", {b: "foo bar"}),
                [{name: "foo", options: {b: "foo bar"}}]
            ],
            [
                query("getB"),
                "foo bar"
            ],
            [
                signal("bar", "a", {}),
                [
                    {name: "bar", options: {x: 1, b: "foo bar"}},
                    {name: "bar", options: {x: 2, b: "foo bar"}},
                    {name: "bar", options: {x: 3, b: "foo bar"}}
                ]
            ],
            [
                query("getB"),
                3
            ],
        ], t.end);
    });
});

test("PicoEngine - io.picolabs.with ruleset", function(t){
    mkTestPicoEngine({}, function(err, pe){
        if(err)return t.end(err);

        var query = mkQueryTask(pe, "id1", "io.picolabs.with");

        testOutputs(t, [
            λ.curry(pe.newPico, {}),
            λ.curry(pe.newChannel, {pico_id: "id0", name: "one", type: "t"}),
            λ.curry(pe.installRuleset, "id0", "io.picolabs.with"),
            [query("add", {a: -2, b: 5}), 3],
            [query("inc", {n: 4}), 5],
            [query("foo", {a: 3}), 9],
        ], t.end);
    });
});

test("PicoEngine - io.picolabs.defaction ruleset", function(t){
    mkTestPicoEngine({}, function(err, pe){
        if(err)return t.end(err);

        var signal = mkSignalTask(pe, "id1");
        var query = mkQueryTask(pe, "id1", "io.picolabs.defaction");

        testOutputs(t, [
            λ.curry(pe.newPico, {}),
            λ.curry(pe.newChannel, {pico_id: "id0", name: "one", type: "t"}),
            λ.curry(pe.installRuleset, "id0", "io.picolabs.defaction"),
            [
                signal("defa", "foo", {}),
                [{name: "foo", options: {a: "bar", b: 5}}]
            ],
            [
                signal("defa", "bar", {}),
                [{name: "bar", options: {a: "baz", b: "qux", c: "quux"}}]
            ],
            [
                query("getSettingVal"),
                void 0
            ],
            [
                signal("defa", "bar_setting", {}),
                [{name: "bar", options: {a: "baz", b: "qux", c: "quux"}}]
            ],
            [
                query("getSettingVal"),
                {name: "bar", type: "directive", options: {a: "baz", b: "qux", c: "quux"},  meta: {eid: "1234", rid: "io.picolabs.defaction", rule_name: "bar_setting", txn_id: "TODO"}}
            ],
            [
                signal("defa", "chooser", {val: "asdf"}),
                [{name: "foo", options: {a: "asdf", b: 5}}]
            ],
            [
                signal("defa", "chooser", {val: "fdsa"}),
                [{name: "bar", options: {a: "fdsa", b: "ok", c: "done"}}]
            ],
            [
                signal("defa", "chooser", {}),
                []
            ],
            [
                signal("defa", "ifAnotB", {a: "true", b: "false"}),
                [{name: "yes a", options: {}}, {name: "not b", options: {}}]
            ],
            [
                signal("defa", "ifAnotB", {a: "true", b: "true"}),
                []
            ],
            [
                query("add", {a: 1, b: 2}),//try and fake an action
                {type: "directive", name: "add", options: {resp: 3}}
            ],
            function(next){
                signal("defa", "add")(function(err, resp){
                    t.equals(err + "", "Error: `add` is not defined as an action");
                    t.notOk(resp);
                    next();
                });
            },
            [
                signal("defa", "returns"),
                [{name: "wat:whereinthe", options: {b: 333}}]
            ],
            [
                query("getSettingVal"),
                ["where", "in", "the", "wat:whereinthe 433"]
            ],
            [
                signal("defa", "scope"),
                []
            ],
            [
                query("getSettingVal"),
                ["aint", "no", "echo", null, "send wat? noop returned: null"]
            ],
        ], t.end);
    });
});

test("PicoEngine - io.picolabs.log ruleset", function(t){
    mkTestPicoEngine({}, function(err, pe){
        if(err)return t.end(err);

        var signal = mkSignalTask(pe, "id1");

        var log_events = [];
        _.each([
            "log-info",
            "log-debug",
            "log-warn",
            "log-error",
        ], function(level){
            pe.emitter.on(level, function(info, val){
                log_events.push([level, val]);
            });
        });

        testOutputs(t, [
            λ.curry(pe.newPico, {}),
            λ.curry(pe.newChannel, {pico_id: "id0", name: "one", type: "t"}),
            λ.curry(pe.installRuleset, "id0", "io.picolabs.log"),
            [signal("log", "levels"), []],
            function(done){
                t.deepEquals(log_events, [
                    ["log-info", "hello default"],
                    ["log-error", "hello error"],
                    ["log-warn", "hello warn"],
                    ["log-info", "hello info"],
                    ["log-debug", "hello debug"],
                ]);
                done();
            },
        ], t.end);
    });
});

test("PicoEngine - io.picolabs.key* rulesets", function(t){
    mkTestPicoEngine({}, function(err, pe){
        if(err)return t.end(err);

        var signal = mkSignalTask(pe, "id1");
        var query1 = mkQueryTask(pe, "id1", "io.picolabs.key-used");
        var query2 = mkQueryTask(pe, "id1", "io.picolabs.key-used2");
        var query3 = mkQueryTask(pe, "id1", "io.picolabs.key-used3");

        var qError = function(q, error_msg){
            return function(next){
                q(function(err, resp){
                    t.equals(err+"", error_msg);
                    next();
                });
            };
        };

        testOutputs(t, [
            λ.curry(pe.newPico, {}),
            λ.curry(pe.newChannel, {pico_id: "id0", name: "one", type: "t"}),
            λ.curry(pe.installRuleset, "id0", "io.picolabs.key-defined"),
            λ.curry(pe.installRuleset, "id0", "io.picolabs.key-used"),
            λ.curry(pe.installRuleset, "id0", "io.picolabs.key-used2"),
            λ.curry(pe.installRuleset, "id0", "io.picolabs.key-used3"),

            [query1("getFoo"), "foo key just a string"],
            [query2("getFoo"), "foo key just a string"],
            qError(query3("getFoo"), "Error: keys:foo not defined"),//b/c used3 never requires it

            [query1("getBar"), {baz: "baz subkey for bar key", qux: "qux subkey for bar key"}],
            [query1("getBarN", {name: "baz"}), "baz subkey for bar key"],
            [query1("getBarN", {name: "qux"}), "qux subkey for bar key"],
            qError(query1("getBarN", {name: "blah"}), "Error: keys:bar(\"blah\") not defined"),

            //not shared with either
            qError(query1("getQuux"), "Error: keys:quux not defined"),
            qError(query2("getQuux"), "Error: keys:quux not defined"),

            //only shared with 2
            qError(query1("getQuuz"), "Error: keys:quuz not defined"),
            [query2("getQuuz"), "this is shared to someone else"],

            //testing configured module
            [query1("getAPIKeys"), ["foo key just a string", "baz subkey for bar key"]],
            [query2("getAPIKeys"), ["default-key1", "default-key2"]],

            //test keys: work in different execution areas
            [
                signal("key_used", "foo"),
                [{
                    name: "foo",
                    options: {
                        foo: "foo key just a string",
                        foo_pre: "foo key just a string"
                    }
                }]
            ],
            [query1("getFooPostlude"), "foo key just a string"],

        ], t.end);
    });
});

test("PicoEngine - io.picolabs.schedule rulesets", function(t){

    //before starting the engine, write some test data to the db
    var memdb = memdown(cuid());
    var db = DB({
        db: function(){return memdb;},
        newID: (function(){
            var i = 0;
            return function(){
                return "init" + i++;
            };
        }()),
    });
    λ.series([
        λ.curry(db.newPico, {}),
        λ.curry(db.newChannel, {pico_id: "init0", name: "one", type: "t"}),
        λ.curry(db.addRulesetToPico, "init0", "io.picolabs.schedule"),
        λ.curry(db.scheduleEventRepeat, "10 * * * * *", {
            eci: "init1",
            eid: "1234",
            domain: "schedule",
            type: "push_log",
            attrs: {from: "startup_event", name: "qux"},
        }),
        λ.curry(mkTestPicoEngine, {
            ldb: function(){return memdb;},
        })
    ], function(err, results){
        if(err)return t.end(err);
        testPE(_.last(results));
    });

    function testPE(pe){
        var signal = mkSignalTask(pe, "init1");
        var query = mkQueryTask(pe, "init1", "io.picolabs.schedule");

        var triggerTimeout = function(){
            return function(done){
                pe.scheduler.test_mode_triggerTimeout();
                done();
            };
        };
        var triggerCron = function(id){
            return function(done){
                pe.scheduler.test_mode_triggerCron(id);
                done();
            };
        };

        var clearLog = [
            signal("schedule", "clear_log"),
            [{name: "clear_log", options: {}}]
        ];

        testOutputs(t, [
            clearLog,
            [
                signal("schedule", "in_5min", {name: "foo"}),
                [{name: "in_5min", options: {}}]
            ],
            [query("getLog"), [
                {"scheduled in_5min": "id0"},
            ]],
            [
                signal("schedule", "in_5min", {name: "bar"}),
                [{name: "in_5min", options: {}}]
            ],
            [query("getLog"), [
                {"scheduled in_5min": "id0"},
                {"scheduled in_5min": "id1"},
            ]],
            triggerTimeout(),//it's been 5 minutes
            [query("getLog"), [
                {"scheduled in_5min": "id0"},
                {"scheduled in_5min": "id1"},
                {"from": "in_5min", "name": "foo"},
            ]],
            triggerTimeout(),//it's been 5 more minutes
            [query("getLog"), [
                {"scheduled in_5min": "id0"},
                {"scheduled in_5min": "id1"},
                {"from": "in_5min", "name": "foo"},
                {"from": "in_5min", "name": "bar"},
            ]],
            triggerTimeout(),//it's been 5 more minutes
            [query("getLog"), [
                {"scheduled in_5min": "id0"},
                {"scheduled in_5min": "id1"},
                {"from": "in_5min", "name": "foo"},
                {"from": "in_5min", "name": "bar"},
                //nothing changed
            ]],


            //Start testing repeat
            clearLog,
            [
                signal("schedule", "every_1min", {name: "baz"}),
                [{name: "every_1min", options: {}}]
            ],
            [query("getLog"), [
                {"scheduled every_1min": "id2"},
            ]],
            triggerCron("id2"),
            [query("getLog"), [
                {"scheduled every_1min": "id2"},
                {from: "every_1min", name: "baz"},
            ]],
            triggerCron("id2"),
            triggerCron("id2"),
            [query("getLog"), [
                {"scheduled every_1min": "id2"},
                {from: "every_1min", name: "baz"},
                {from: "every_1min", name: "baz"},
                {from: "every_1min", name: "baz"},
            ]],
            triggerCron("init2"),//trigger a cron from startup
            [query("getLog"), [
                {"scheduled every_1min": "id2"},
                {from: "every_1min", name: "baz"},
                {from: "every_1min", name: "baz"},
                {from: "every_1min", name: "baz"},
                {from: "startup_event", name: "qux"},
            ]],

            //schedule:list() and schedule:remove(id)
            [
                signal("schedule", "in_5min", {name: "blah-1"}),
                [{name: "in_5min", options: {}}]
            ],
            [
                signal("schedule", "in_5min", {name: "blah-2"}),
                [{name: "in_5min", options: {}}]
            ],
            clearLog,
            [function(next){
                query("listScheduled")(function(err, list){
                    if(err) return next(err);
                    //so we can test dates
                    next(null, _.map(list, function(e){
                        if(_.has(e, "at")){
                            t.ok(/^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d.\d\d\dZ$/.test(e.at));
                            e.at = "some-fake-date";
                        }
                        return e;
                    }));
                });
            }, [
                {
                    id: "id3",
                    at: "some-fake-date",
                    event: mkEvent("init1/1234/schedule/push_log", {from: "in_5min", name: "blah-1"}),
                },
                {
                    id: "id4",
                    at: "some-fake-date",
                    event: mkEvent("init1/1234/schedule/push_log", {from: "in_5min", name: "blah-2"}),
                },
                {
                    id: "id2",
                    timespec: "* */1 * * * *",
                    event: mkEvent("init1/1234/schedule/push_log", {from: "every_1min", name: "baz"}),
                },
                {
                    id: "init2",
                    timespec: "10 * * * * *",
                    event: mkEvent("init1/1234/schedule/push_log", {from: "startup_event", name: "qux"}),
                },
            ]],
            [query("getLog"), [
                //nothing happened yet
            ]],
            triggerTimeout(),
            [query("getLog"), [
                {from: "in_5min", name: "blah-1"},
            ]],
            [signal("schedule", "rm_from_schedule", {id: "id4"}),[]],//remove blah-2
            triggerTimeout(),
            [query("getLog"), [
                {from: "in_5min", name: "blah-1"},
                //nothing new b/c we removed blah-2
            ]],
            [signal("schedule", "rm_from_schedule", {id: "init2"}),[]],//remove a cron
            [query("listScheduled"), [
                {
                    id: "id2",
                    timespec: "* */1 * * * *",
                    event: mkEvent("init1/1234/schedule/push_log", {from: "every_1min", name: "baz"}),
                },
            ]],
        ], t.end);
    }
});

test("PicoEngine - installRuleset", function(t){
    mkTestPicoEngine({}, function(err, pe){
        if(err)return t.end(err);

        var rid_to_use = "io.picolabs.hello_world";

        λ.series([
            λ.curry(pe.newPico, {}),
            function(next){
                pe.installRuleset("id404", rid_to_use, function(err){
                    t.equals(err + "", "Error: Invalid pico_id: id404");
                    next();
                });
            },
            function(next){
                pe.installRuleset("id0", "foo.not.an.rid", function(err){
                    t.equals(err + "", "Error: This rid is not found and/or enabled: foo.not.an.rid");
                    next();
                });
            },
            function(next){
                pe.installRuleset("id0", rid_to_use, function(err){
                    t.notOk(err);
                    next();
                });
            },
        ], t.end);
    });
});

test("PicoEngine - io.picolabs.last rulesets", function(t){
    mkTestPicoEngine({}, function(err, pe){
        if(err)return t.end(err);

        var signal = mkSignalTask(pe, "id1");

        testOutputs(t, [
            λ.curry(pe.newPico, {}),
            λ.curry(pe.newChannel, {pico_id: "id0", name: "one", type: "t"}),
            λ.curry(pe.installRuleset, "id0", "io.picolabs.last"),

            [
                signal("last", "all", {}),
                [
                    {name: "foo", options: {}},
                    {name: "bar", options: {}},
                    {name: "baz", options: {}},
                    //qux doesn't run b/c baz stopped it
                ]
            ],
            [
                signal("last", "all", {stop: "bar"}),
                [
                    {name: "foo", options: {}},
                    {name: "bar", options: {}},
                ]
            ],
            [
                signal("last", "all", {stop: "foo"}),
                [
                    {name: "foo", options: {}},
                ]
            ],

        ], t.end);
    });
});

test("PicoEngine - io.picolabs.error rulesets", function(t){
    mkTestPicoEngine({}, function(err, pe){
        if(err)return t.end(err);

        var signal = mkSignalTask(pe, "id1");
        var query = mkQueryTask(pe, "id1", "io.picolabs.error");

        testOutputs(t, [
            λ.curry(pe.newPico, {}),
            λ.curry(pe.newChannel, {pico_id: "id0", name: "one", type: "t"}),
            λ.curry(pe.installRuleset, "id0", "io.picolabs.error"),

            [
                query("getErrors"),
                void 0
            ],

            [signal("error", "basic"), [
                {name: "basic0", options: {}},
                //NOTE basic1 should not execute b/c basic0 raised an error
            ]],

            [
                query("getErrors"),
                [
                    null,
                    {
                        level: "info",
                        msg: "some info error",
                        error_rid: "io.picolabs.error",
                        rule_name: "basic0",
                        genus: "user",
                    },
                ]
            ],

        ], t.end);
    });
});

test("PicoEngine - (re)registering ruleset shouldn't mess up state", function(t){
    PicoEngine({
        host: "https://test-host",
        ___core_testing_mode: true,
        compileAndLoadRuleset: function(rs_info, callback){
            var js;
            try{
                var js_src = compiler(rs_info.src, {
                    inline_source_map: true
                }).code;
                js = eval(js_src);
            }catch(err){
                return callback(err);
            }
            callback(null, js);
        },
        db: {
            db: memdown,
            newID: (function(){
                var i = 0;
                return function(){
                    return "id" + i++;
                };
            }())
        }
    }, function(err, pe){
        if(err)return t.end(err);

        var krl_0 = "ruleset foo.rid {rule aa {select when foo all} rule bb {select when foo all}}";
        var krl_1 = "ruleset foo.rid {rule ab {select when foo all} rule bb {select when foo all}}";

        var signal = mkSignalTask(pe, "id1");

        var order = [];
        pe.emitter.on("debug", function(info, val){
            if("event being processed" === val){
                order.push("EVENT: " + info.event.domain + "/" + info.event.type);
            }else if(/^rule selected/.test(val)){
                order.push(val);
            }
        });
        λ.series([
            λ.curry(pe.newPico, {}),
            λ.curry(pe.newChannel, {pico_id: "id0", name: "one", type: "t"}),
            λ.curry(pe.registerRuleset, krl_0, {}),
            λ.curry(pe.installRuleset, "id0", "foo.rid"),
            signal("foo", "all"),
            λ.curry(pe.registerRuleset, krl_1, {}),
            signal("foo", "all"),
        ], function(err){
            if(err) return t.end(err);

            t.deepEquals(order, [
                "EVENT: foo/all",
                "rule selected: foo.rid -> aa",
                "rule selected: foo.rid -> bb",
                "EVENT: foo/all",
                "rule selected: foo.rid -> ab",
                "rule selected: foo.rid -> bb",
            ]);

            t.end();
        });
    });
});
