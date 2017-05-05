var _ = require("lodash");
var λ = require("contra");
var test = require("tape");
var mkTestPicoEngine = require("./mkTestPicoEngine");

test("DB - write and read", function(t){
    mkTestPicoEngine({dont_register_rulesets: true}, function(err, pe){
        if(err)return t.end(err);

        λ.series({
            start_db: λ.curry(pe.db.toObj),
            pico0: λ.curry(pe.db.newPico, {}),
            chan1: λ.curry(pe.db.newChannel, {pico_id: "id0", name: "one", type: "t"}),
            rule0: λ.curry(pe.db.addRuleset, {pico_id: "id0", rid: "rs0"}),
            chan2: λ.curry(pe.db.newChannel, {pico_id: "id0", name: "two", type: "t"}),
            end_db: λ.curry(pe.db.toObj),
            rmpico0: λ.curry(pe.db.removePico, "id0"),
            post_del_db: λ.curry(pe.db.toObj)
        }, function(err, data){
            if(err) return t.end(err);

            t.deepEquals(data.start_db, {});

            t.deepEquals(data.end_db, {
                channel: {
                    id1: {pico_id: "id0"},
                    id2: {pico_id: "id0"}
                },
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

            t.deepEquals(data.post_del_db, {});

            t.end();
        });
    });
});

test("DB - storeRuleset", function(t){
    mkTestPicoEngine({dont_register_rulesets: true}, function(err, pe){
        if(err)return t.end(err);

        var krl_src = "ruleset io.picolabs.cool {}";
        var rid = "io.picolabs.cool";
        var hash = "7d71c05bc934b0d41fdd2055c7644fc4d0d3eabf303d67fb97f604eaab2c0aa1";
        var timestamp = (new Date()).toISOString();
        var url = "Some-URL-to-src ";

        var expected = {};
        _.set(expected, ["rulesets", "krl", hash], {
            src: krl_src,
            rid: rid,
            url: url,
            timestamp: timestamp
        });
        _.set(expected, ["rulesets", "versions", rid, timestamp, hash], true);
        _.set(expected, ["rulesets", "url", url.toLowerCase().trim(), rid, hash], true);

        λ.series({
            start_db: λ.curry(pe.db.toObj),
            store: function(next){
                pe.db.storeRuleset(krl_src, {
                    url: url
                }, next, timestamp);
            },
            findRulesetsByURL: λ.curry(pe.db.findRulesetsByURL, url),
            end_db: λ.curry(pe.db.toObj)
        }, function(err, data){
            if(err) return t.end(err);
            t.deepEquals(data.start_db, {});
            t.deepEquals(data.store, hash);
            t.deepEquals(data.findRulesetsByURL, [{
                rid: rid,
                hash: hash
            }]);
            t.deepEquals(data.end_db, expected);
            t.end();
        });
    });
});

test("DB - enableRuleset", function(t){
    mkTestPicoEngine({}, function(err, pe){
        if(err)return t.end(err);

        var krl_src = "ruleset io.picolabs.cool {}";
        //TODO
        λ.waterfall([
            function(callback){
                pe.db.toObj(callback);
            },
            function(db, callback){
                t.deepEquals(_.omit(db, "rulesets"), {});
                pe.db.storeRuleset(krl_src, {}, callback);
            },
            function(hash, callback){
                pe.db.enableRuleset(hash, function(err){
                    callback(err, hash);
                });
            },
            function(hash, callback){
                pe.db.toObj(function(err, db){
                    callback(err, db, hash);
                });
            },
            function(db, hash, callback){
                t.deepEquals(_.get(db, [
                    "rulesets",
                    "enabled",
                    "io.picolabs.cool",
                    "hash"
                ]), hash);
                pe.db.getEnabledRuleset("io.picolabs.cool", function(err, data){
                    if(err) return callback(err);
                    t.equals(data.src, krl_src);
                    t.equals(data.hash, hash);
                    t.equals(data.rid, "io.picolabs.cool");
                    t.equals(data.timestamp_enable, _.get(db, [
                        "rulesets",
                        "enabled",
                        "io.picolabs.cool",
                        "timestamp"
                    ]));
                    callback();
                });
            }
        ], t.end);
    });
});

test("DB - read keys that don't exist", function(t){
    mkTestPicoEngine({}, function(err, pe){
        if(err)return t.end(err);

        λ.series({
            ent: λ.curry(pe.db.getEntVar, "pico0", "rid0", "var that doesn't exisit"),
            app: λ.curry(pe.db.getAppVar, "rid0", "var that doesn't exisit")
        }, function(err, data){
            if(err) return t.end(err);
            t.deepEquals(data.ent, undefined);
            t.deepEquals(data.app, undefined);
            t.end();
        });
    });
});

test("DB - getOwnerECI", function(t){
    mkTestPicoEngine({}, function(err, pe){
        if(err)return t.end(err);

        λ.series({
            eci_0: λ.curry(pe.db.getOwnerECI),
            new_chan: λ.curry(pe.db.newChannel, {pico_id: "foo", name: "bar", type: "baz"}),
            eci_1: λ.curry(pe.db.getOwnerECI),
            new_chan1: λ.curry(pe.db.newChannel, {pico_id: "foo", name: "bar", type: "baz"}),
            new_chan2: λ.curry(pe.db.newChannel, {pico_id: "foo", name: "bar", type: "baz"}),
            new_chan3: λ.curry(pe.db.newChannel, {pico_id: "foo", name: "bar", type: "baz"}),
            eci_2: λ.curry(pe.db.getOwnerECI),
        }, function(err, data){
            if(err) return t.end(err);
            t.deepEquals(data.eci_0, undefined);
            t.deepEquals(data.eci_1, "id0");
            t.deepEquals(data.eci_2, "id0");
            t.end();
        });
    });
});

test("DB - isRulesetUsed", function(t){
    mkTestPicoEngine({}, function(err, pe){
        if(err)return t.end(err);

        λ.series({
            pico0: λ.curry(pe.db.newPico, {}),
            pico1: λ.curry(pe.db.newPico, {}),

            foo0: λ.curry(pe.db.addRuleset, {pico_id: "id0", rid: "rs-foo"}),
            foo1: λ.curry(pe.db.addRuleset, {pico_id: "id1", rid: "rs-foo"}),
            bar0: λ.curry(pe.db.addRuleset, {pico_id: "id0", rid: "rs-bar"}),

            is_foo: λ.curry(pe.db.isRulesetUsed, "rs-foo"),
            is_bar: λ.curry(pe.db.isRulesetUsed, "rs-bar"),
            is_baz: λ.curry(pe.db.isRulesetUsed, "rs-baz"),
            is_qux: λ.curry(pe.db.isRulesetUsed, "rs-qux"),
        }, function(err, data){
            if(err) return t.end(err);
            t.equals(data.is_foo, true);
            t.equals(data.is_bar, true);
            t.equals(data.is_baz, false);
            t.equals(data.is_qux, false);
            t.end();
        });
    });
});

test("DB - deleteRuleset", function(t){
    mkTestPicoEngine({
        dont_register_rulesets: true,
    }, function(err, pe){
        if(err)return t.end(err);

        var storeRuleset = function(name){
            return function(callback){
                var rid = "io.picolabs." + name;
                var krl = "ruleset " + rid + " {}";
                pe.db.storeRuleset(krl, {
                    url: "file:///" + name + ".krl"
                }, function(err, hash){
                    if(err) return callback(err);
                    pe.db.enableRuleset(hash, function(err){
                        if(err) return callback(err);
                        pe.db.putAppVar(rid, "my_var", "appvar value", function(err){
                            callback(err, hash);
                        });
                    });
                });
            };
        };

        λ.series({
            store_foo: storeRuleset("foo"),
            store_bar: storeRuleset("bar"),

            init_db: λ.curry(pe.db.toObj),

            del_foo: λ.curry(pe.db.deleteRuleset, "io.picolabs.foo"),

            end_db: λ.curry(pe.db.toObj),
        }, function(err, data){
            if(err) return t.end(err);

            t.deepEquals(_.keys(data.init_db.rulesets.versions), [
                "io.picolabs.bar",
                "io.picolabs.foo",
            ], "ensure all were actually stored in the db");

            t.deepEquals(_.keys(data.end_db.rulesets.versions), [
                "io.picolabs.bar",
            ], "ensure io.picolabs.foo was removed");


            //make the `init_db` look like the expected `end_db`
            var expected_db = _.cloneDeep(data.init_db);
            t.deepEqual(expected_db, data.init_db, "sanity check");

            delete expected_db.rulesets.enabled["io.picolabs.foo"];
            delete expected_db.rulesets.krl[data.store_foo];
            delete expected_db.rulesets.url["file:///foo.krl"];
            delete expected_db.rulesets.versions["io.picolabs.foo"];
            delete expected_db.resultset["io.picolabs.foo"];

            t.notDeepEqual(expected_db, data.init_db, "sanity check");
            t.deepEquals(data.end_db, expected_db);

            t.end();
        });
    });
});

test("DB - scheduleEventAt", function(t){
    mkTestPicoEngine({
        dont_register_rulesets: true,
    }, function(err, pe){
        if(err)return t.end(err);

        var eventAt = function(date, type){
            return function(callback){
                pe.db.scheduleEventAt(new Date(date), {
                    domain: "foobar",
                    type: type,
                    attributes: {some: "attr"},
                }, callback);
            };
        };
        var rmAt = function(id, date){
            return function(callback){
                pe.db.removeScheduleEventAt(id, new Date(date), callback);
            };
        };

        var getNext = λ.curry(pe.db.nextScheduleEventAt);

        λ.series({
            init_db: λ.curry(pe.db.toObj),
            next0: getNext,
            at0: eventAt("Feb 22, 2222", "foo"),
            next1: getNext,
            at1: eventAt("Feb 23, 2222", "bar"),
            next2: getNext,
            at2: eventAt("Feb  2, 2222", "baz"),
            next3: getNext,

            rm0: rmAt("id0", "Feb 22, 2222"),
            next4: getNext,
            rm2: rmAt("id2", "Feb  2, 2222"),
            next5: getNext,
            rm1: rmAt("id1", "Feb 23, 2222"),
            next6: getNext,

            end_db: λ.curry(pe.db.toObj),
        }, function(err, data){
            if(err) return t.end(err);

            t.deepEquals(data.init_db, {});

            t.deepEquals(data.at0, {
                id: "id0",
                at: new Date("Feb 22, 2222"),
                event: {domain: "foobar", type: "foo", attributes: {some: "attr"}},
            });
            t.deepEquals(data.at1, {
                id: "id1",
                at: new Date("Feb 23, 2222"),
                event: {domain: "foobar", type: "bar", attributes: {some: "attr"}},
            });
            t.deepEquals(data.at2, {
                id: "id2",
                at: new Date("Feb  2, 2222"),
                event: {domain: "foobar", type: "baz", attributes: {some: "attr"}},
            });

            t.deepEquals(data.next0, void 0, "nothing scheduled");
            t.ok(_.has(data, "next0"), "ensure next0 was actually tested");
            t.deepEquals(data.next1, data.at0, "only one scheduled");
            t.deepEquals(data.next2, data.at0, "at0 is still sooner than at1");
            t.deepEquals(data.next3, data.at2, "at2 is sooner than at0");
            t.deepEquals(data.next4, data.at2);
            t.deepEquals(data.next5, data.at1, "at1 is soonest now that at0 and at2 were removed");
            t.deepEquals(data.next6, void 0, "nothing scheduled");
            t.ok(_.has(data, "next6"), "ensure next6 was actually tested");

            t.deepEquals(data.end_db, {}, "should be nothing left in the db");

            t.end();
        });
    });
});
