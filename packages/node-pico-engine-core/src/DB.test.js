var _ = require("lodash");
var λ = require("contra");
var DB = require("./DB");
var test = require("tape");
var memdown = require("memdown");

var mkTestDB = function(opts){
    opts = opts || {};
    return DB({
        db: opts.ldb || memdown,
        newID: (function(){
            var i = 0;
            return function(){
                return "id" + i++;
            };
        }())
    });
};

test("DB - write and read", function(t){
    var db = mkTestDB();
    λ.series({
        start_db: λ.curry(db.toObj),
        pico0: λ.curry(db.newPico, {}),
        chan1: λ.curry(db.newChannel, {pico_id: "id0", name: "one", type: "t"}),
        rule0: λ.curry(db.addRulesetToPico, "id0", "rs0"),
        chan2: λ.curry(db.newChannel, {pico_id: "id0", name: "two", type: "t"}),
        end_db: λ.curry(db.toObj),
        rmpico0: λ.curry(db.removePico, "id0"),
        post_del_db: λ.curry(db.toObj)
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

test("DB - storeRuleset", function(t){
    var db = mkTestDB();

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
        start_db: λ.curry(db.toObj),
        store: function(next){
            db.storeRuleset(krl_src, {
                url: url
            }, next, timestamp);
        },
        findRulesetsByURL: λ.curry(db.findRulesetsByURL, url),
        end_db: λ.curry(db.toObj)
    }, function(err, data){
        if(err) return t.end(err);
        t.deepEquals(data.start_db, {});
        t.deepEquals(data.store, {rid: rid, hash: hash});
        t.deepEquals(data.findRulesetsByURL, [{
            rid: rid,
            hash: hash
        }]);
        t.deepEquals(data.end_db, expected);
        t.end();
    });
});

test("DB - enableRuleset", function(t){
    var db = mkTestDB();

    var krl_src = "ruleset io.picolabs.cool {}";
    //TODO
    λ.waterfall([
        function(callback){
            db.toObj(callback);
        },
        function(db_json, callback){
            t.deepEquals(_.omit(db_json, "rulesets"), {});
            db.storeRuleset(krl_src, {}, callback);
        },
        function(data, callback){
            db.enableRuleset(data.hash, function(err){
                callback(err, data.hash);
            });
        },
        function(hash, callback){
            db.toObj(function(err, db){
                callback(err, db, hash);
            });
        },
        function(db_json, hash, callback){
            t.deepEquals(_.get(db_json, [
                "rulesets",
                "enabled",
                "io.picolabs.cool",
                "hash"
            ]), hash);
            db.getEnabledRuleset("io.picolabs.cool", function(err, data){
                if(err) return callback(err);
                t.equals(data.src, krl_src);
                t.equals(data.hash, hash);
                t.equals(data.rid, "io.picolabs.cool");
                t.equals(data.timestamp_enable, _.get(db_json, [
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

test("DB - read keys that don't exist", function(t){
    var db = mkTestDB();

    λ.series({
        ent: λ.curry(db.getEntVar, "pico0", "rid0", "var that doesn't exisit"),
        app: λ.curry(db.getAppVar, "rid0", "var that doesn't exisit")
    }, function(err, data){
        if(err) return t.end(err);
        t.deepEquals(data.ent, undefined);
        t.deepEquals(data.app, undefined);
        t.end();
    });
});

test("DB - getOwnerECI", function(t){
    var db = mkTestDB();

    λ.series({
        eci_0: λ.curry(db.getOwnerECI),
        new_chan: λ.curry(db.newChannel, {pico_id: "foo", name: "bar", type: "baz"}),
        eci_1: λ.curry(db.getOwnerECI),
        new_chan1: λ.curry(db.newChannel, {pico_id: "foo", name: "bar", type: "baz"}),
        new_chan2: λ.curry(db.newChannel, {pico_id: "foo", name: "bar", type: "baz"}),
        new_chan3: λ.curry(db.newChannel, {pico_id: "foo", name: "bar", type: "baz"}),
        eci_2: λ.curry(db.getOwnerECI),
    }, function(err, data){
        if(err) return t.end(err);
        t.deepEquals(data.eci_0, undefined);
        t.deepEquals(data.eci_1, "id0");
        t.deepEquals(data.eci_2, "id0");
        t.end();
    });
});

test("DB - isRulesetUsed", function(t){
    var db = mkTestDB();

    λ.series({
        pico0: λ.curry(db.newPico, {}),
        pico1: λ.curry(db.newPico, {}),

        foo0: λ.curry(db.addRulesetToPico, "id0", "rs-foo"),
        foo1: λ.curry(db.addRulesetToPico, "id1", "rs-foo"),
        bar0: λ.curry(db.addRulesetToPico, "id0", "rs-bar"),

        is_foo: λ.curry(db.isRulesetUsed, "rs-foo"),
        is_bar: λ.curry(db.isRulesetUsed, "rs-bar"),
        is_baz: λ.curry(db.isRulesetUsed, "rs-baz"),
        is_qux: λ.curry(db.isRulesetUsed, "rs-qux"),
    }, function(err, data){
        if(err) return t.end(err);
        t.equals(data.is_foo, true);
        t.equals(data.is_bar, true);
        t.equals(data.is_baz, false);
        t.equals(data.is_qux, false);
        t.end();
    });
});

test("DB - deleteRuleset", function(t){
    var db = mkTestDB();

    var storeRuleset = function(name){
        return function(callback){
            var rid = "io.picolabs." + name;
            var krl = "ruleset " + rid + " {}";
            db.storeRuleset(krl, {
                url: "file:///" + name + ".krl"
            }, function(err, data){
                if(err) return callback(err);
                db.enableRuleset(data.hash, function(err){
                    if(err) return callback(err);
                    db.putAppVar(rid, "my_var", "appvar value", function(err){
                        callback(err, data.hash);
                    });
                });
            });
        };
    };

    λ.series({
        store_foo: storeRuleset("foo"),
        store_bar: storeRuleset("bar"),

        init_db: λ.curry(db.toObj),

        del_foo: λ.curry(db.deleteRuleset, "io.picolabs.foo"),

        end_db: λ.curry(db.toObj),
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

test("DB - scheduleEventAt", function(t){
    var db = mkTestDB();

    var eventAt = function(date, type){
        return function(callback){
            db.scheduleEventAt(new Date(date), {
                domain: "foobar",
                type: type,
                attributes: {some: "attr"},
            }, callback);
        };
    };
    var rmAt = function(id){
        return function(callback){
            db.removeScheduled(id, callback);
        };
    };

    var getNext = λ.curry(db.nextScheduleEventAt);

    λ.series({
        init_db: λ.curry(db.toObj),
        next0: getNext,
        at0: eventAt("Feb 22, 2222", "foo"),
        next1: getNext,
        at1: eventAt("Feb 23, 2222", "bar"),
        next2: getNext,
        at2: eventAt("Feb  2, 2222", "baz"),
        next3: getNext,

        list: λ.curry(db.listScheduled),

        rm0: rmAt("id0"),
        next4: getNext,
        rm2: rmAt("id2"),
        next5: getNext,
        rm1: rmAt("id1"),
        next6: getNext,

        end_db: λ.curry(db.toObj),
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

        t.deepEquals(data.list, [
            data.at2,
            data.at0,
            data.at1,
        ].map(function(val){
            return _.assign({}, val, {
                at: val.at.toISOString(),
            });
        }));

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

test("DB - scheduleEventRepeat", function(t){
    var db = mkTestDB();

    var eventRep = function(timespec, type){
        return function(callback){
            db.scheduleEventRepeat(timespec, {
                domain: "foobar",
                type: type,
                attributes: {some: "attr"},
            }, callback);
        };
    };
    λ.series({
        init_db: λ.curry(db.toObj),

        rep0: eventRep("*/5 * * * * *", "foo"),
        rep1: eventRep("* */5 * * * *", "bar"),

        mid_db: λ.curry(db.toObj),

        list: λ.curry(db.listScheduled),

        rm0: λ.curry(db.removeScheduled, "id0"),
        rm1: λ.curry(db.removeScheduled, "id1"),

        end_db: λ.curry(db.toObj),
    }, function(err, data){
        if(err) return t.end(err);

        t.deepEquals(data.init_db, {});

        t.deepEquals(data.rep0, {
            id: "id0",
            timespec: "*/5 * * * * *",
            event: {domain: "foobar", type: "foo", attributes: {some: "attr"}},
        });
        t.deepEquals(data.rep1, {
            id: "id1",
            timespec: "* */5 * * * *",
            event: {domain: "foobar", type: "bar", attributes: {some: "attr"}},
        });

        t.deepEquals(data.mid_db, {scheduled: {
            id0: data.rep0,
            id1: data.rep1,
        }});

        t.deepEquals(data.list, [
            data.rep0,
            data.rep1,
        ]);

        t.deepEquals(data.end_db, {}, "should be nothing left in the db");

        t.end();
    });
});

test("DB - removeRulesetFromPico", function(t){
    var db = mkTestDB();

    λ.series({
        addRS: λ.curry(db.addRulesetToPico, "pico0", "rid0"),
        ent0: λ.curry(db.putEntVar, "pico0", "rid0", "foo", "val0"),
        ent1: λ.curry(db.putEntVar, "pico0", "rid0", "bar", "val1"),
        db_before: λ.curry(db.toObj),

        rmRS: λ.curry(db.removeRulesetFromPico, "pico0", "rid0"),

        db_after: λ.curry(db.toObj),
    }, function(err, data){
        if(err) return t.end(err);

        t.deepEquals(data.db_before, {
            pico: {
                pico0: {
                    rid0: {vars: {foo: "val0", bar: "val1"}},
                    ruleset: {rid0: {on: true}}
                }
            }
        });

        t.deepEquals(data.db_after, {}, "should all be gone");

        t.end();
    });
});

test("DB - getPicoIDByECI", function(t){
    var db = mkTestDB();
    λ.series({
        pico0: λ.curry(db.newPico, {}),
        pico1: λ.curry(db.newPico, {}),

        c2_p0: λ.curry(db.newChannel, {pico_id: "id0", name: "two", type: "t"}),
        c3_p1: λ.curry(db.newChannel, {pico_id: "id1", name: "three", type: "t"}),
        c4_p0: λ.curry(db.newChannel, {pico_id: "id0", name: "four", type: "t"}),
        c5_p1: λ.curry(db.newChannel, {pico_id: "id1", name: "five", type: "t"}),

        get_c2: λ.curry(db.getPicoIDByECI, "id2"),
        get_c3: λ.curry(db.getPicoIDByECI, "id3"),
        get_c4: λ.curry(db.getPicoIDByECI, "id4"),
        get_c5: λ.curry(db.getPicoIDByECI, "id5"),

    }, function(err, data){
        if(err) return t.end(err);

        t.deepEquals(data.get_c2, "id0");
        t.deepEquals(data.get_c3, "id1");
        t.deepEquals(data.get_c4, "id0");
        t.deepEquals(data.get_c5, "id1");

        db.getPicoIDByECI("bad-id", function(err, id){
            t.ok(err);
            t.notOk(id);
            t.end();
        });
    });
});

test("DB - listChannels", function(t){
    var db = mkTestDB();
    λ.series({
        pico0: λ.curry(db.newPico, {}),
        pico1: λ.curry(db.newPico, {}),

        c2_p0: λ.curry(db.newChannel, {pico_id: "id0", name: "two", type: "t2"}),
        c3_p1: λ.curry(db.newChannel, {pico_id: "id1", name: "three", type: "t3"}),
        c4_p0: λ.curry(db.newChannel, {pico_id: "id0", name: "four", type: "t4"}),
        c5_p1: λ.curry(db.newChannel, {pico_id: "id1", name: "five", type: "t5"}),

        list0: λ.curry(db.listChannels, "id0"),
        list1: λ.curry(db.listChannels, "id1"),
        list404: λ.curry(db.listChannels, "id404"),

    }, function(err, data){
        if(err) return t.end(err);


        var c2 = {id: "id2", name: "two", type: "t2"};
        var c3 = {id: "id3", name: "three", type: "t3"};
        var c4 = {id: "id4", name: "four", type: "t4"};
        var c5 = {id: "id5", name: "five", type: "t5"};


        t.deepEquals(data.c2_p0, c2);
        t.deepEquals(data.c3_p1, c3);
        t.deepEquals(data.c4_p0, c4);
        t.deepEquals(data.c5_p1, c5);

        t.deepEquals(data.list0, [c2, c4]);
        t.deepEquals(data.list1, [c3, c5]);
        t.deepEquals(data.list404, []);

        t.end();
    });
});

test("DB - listAllEnabledRIDs", function(t){
    var db = mkTestDB();

    var hashes = {};
    var store = function(rid){
        return function(done){
            db.storeRuleset("ruleset " + rid + "{}", {}, function(err, data){
                hashes[rid] = data.hash;
                done();
            });
        };
    };

    var enable = function(rid){
        return function(done){
            db.enableRuleset(hashes[rid], done);
        };
    };

    λ.series({
        list0: λ.curry(db.listAllEnabledRIDs),

        s_foo: store("foo"),
        s_bar: store("bar"),
        s_baz: store("baz"),
        list1: λ.curry(db.listAllEnabledRIDs),

        e_foo: enable("foo"),
        list2: λ.curry(db.listAllEnabledRIDs),

        e_bar: enable("bar"),
        e_baz: enable("baz"),
        list3: λ.curry(db.listAllEnabledRIDs),

        d_foo: λ.curry(db.disableRuleset, "foo"),
        list4: λ.curry(db.listAllEnabledRIDs),
    }, function(err, data){
        if(err) return t.end(err);

        t.deepEquals(data.list0, []);
        t.deepEquals(data.list1, []);
        t.deepEquals(data.list2, ["foo"]);
        t.deepEquals(data.list3, ["bar", "baz", "foo"]);
        t.deepEquals(data.list4, ["bar", "baz"]);

        t.end();
    });
});
