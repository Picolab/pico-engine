var _ = require("lodash");
var DB = require("./DB");
var test = require("tape");
var async = require("async");
var memdown = require("memdown");
var migrations = require("./migrations");

var mkTestDB = function(){
    return DB({
        db: memdown,
        __use_sequential_ids_for_testing: true,
    });
};

test("DB - write and read", function(t){
    var db = mkTestDB();
    async.series({
        start_db: async.apply(db.toObj),
        pico0: async.apply(db.newPico, {}),
        rule0: async.apply(db.addRulesetToPico, "id0", "rs0"),
        chan2: async.apply(db.newChannel, {pico_id: "id0", name: "two", type: "t"}),
        pico1: async.apply(db.newPico, {parent_id: "id0"}),
        end_db: async.apply(db.toObj),
        rmpico0: async.apply(db.removePico, "id0"),
        rmpico1: async.apply(db.removePico, "id3"),
        post_del_db: async.apply(db.toObj)
    }, function(err, data){
        if(err) return t.end(err);

        t.deepEquals(data.start_db, {});

        t.deepEquals(data.end_db, {
            channel: {
                id1: {
                    pico_id: "id0",
                    id: "id1",
                    name: "admin",
                    type: "secret",
                    sovrin: {
                        did: "id1",
                        verifyKey: "verifyKey_id1",
                        secret: {
                            seed: "seed_id1",
                            signKey: "signKey_id1",
                        },
                    },
                },
                id2: {
                    pico_id: "id0",
                    id: "id2",
                    name: "two",
                    type: "t",
                    sovrin: {
                        did: "id2",
                        verifyKey: "verifyKey_id2",
                        secret: {
                            seed: "seed_id2",
                            signKey: "signKey_id2",
                        },
                    },
                },
                id4: {
                    pico_id: "id3",
                    id: "id4",
                    name: "admin",
                    type: "secret",
                    sovrin: {
                        did: "id4",
                        verifyKey: "verifyKey_id4",
                        secret: {
                            seed: "seed_id4",
                            signKey: "signKey_id4",
                        },
                    },
                },
            },
            pico: {
                "id0": {
                    id: "id0",
                    parent_id: null,
                    admin_eci: "id1",
                },
                "id3": {
                    id: "id3",
                    parent_id: "id0",
                    admin_eci: "id4",
                },
            },
            "pico-ruleset": {"id0": {"rs0": {on: true}}},
            "ruleset-pico": {"rs0": {"id0": {on: true}}},
            "pico-children": {"id0": {"id3": true}},
            "pico-eci-list": {
                "id0": {
                    "id1": true,
                    "id2": true,
                },
                "id3": {
                    "id4": true,
                },
            },
            "root_pico": {
                id: "id0",
                parent_id: null,
                admin_eci: "id1",
            },
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

    async.series({
        start_db: async.apply(db.toObj),
        store: function(next){
            db.storeRuleset(krl_src, {
                url: url
            }, next, timestamp);
        },
        findRulesetsByURL: async.apply(db.findRulesetsByURL, url),
        end_db: async.apply(db.toObj)
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
    async.waterfall([
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

    async.series({
        ent: async.apply(db.getEntVar, "pico0", "rid0", "var that doesn't exisit"),
        app: async.apply(db.getAppVar, "rid0", "var that doesn't exisit")
    }, function(err, data){
        if(err) return t.end(err);
        t.deepEquals(data.ent, undefined);
        t.deepEquals(data.app, undefined);
        t.end();
    });
});

test("DB - getRootPico", function(t){
    var db = mkTestDB();

    var tstRoot = function(assertFn){
        return function(next){
            db.getRootPico(function(err, r_pico){
                assertFn(err, r_pico);
                next();
            });
        };
    };

    async.series([
        tstRoot(function(err, r_pico){
            t.ok(err);
            t.ok(err.notFound);
            t.deepEquals(r_pico, void 0);
        }),
        async.apply(db.newChannel, {pico_id: "foo", name: "bar", type: "baz"}),
        async.apply(db.newPico, {}),
        tstRoot(function(err, r_pico){
            t.notOk(err);
            t.deepEquals(r_pico, {id: "id1", parent_id: null, admin_eci: "id2"});
        }),
        async.apply(db.newPico, {parent_id: "id1"}),
        tstRoot(function(err, r_pico){
            t.notOk(err);
            t.deepEquals(r_pico, {id: "id1", parent_id: null, admin_eci: "id2"});
        }),
        async.apply(db.newPico, {parent_id: null}),
        tstRoot(function(err, r_pico){
            t.notOk(err);
            t.deepEquals(r_pico, {id: "id5", parent_id: null, admin_eci: "id6"});
        }),
    ], t.end);
});

test("DB - isRulesetUsed", function(t){
    var db = mkTestDB();

    async.series({
        pico0: async.apply(db.newPico, {}),
        pico1: async.apply(db.newPico, {}),

        foo0: async.apply(db.addRulesetToPico, "id0", "rs-foo"),
        foo1: async.apply(db.addRulesetToPico, "id1", "rs-foo"),
        bar0: async.apply(db.addRulesetToPico, "id0", "rs-bar"),

        is_foo: async.apply(db.isRulesetUsed, "rs-foo"),
        is_bar: async.apply(db.isRulesetUsed, "rs-bar"),
        is_baz: async.apply(db.isRulesetUsed, "rs-baz"),
        is_qux: async.apply(db.isRulesetUsed, "rs-qux"),
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

    async.series({
        store_foo: storeRuleset("foo"),
        store_bar: storeRuleset("bar"),

        init_db: async.apply(db.toObj),

        del_foo: async.apply(db.deleteRuleset, "io.picolabs.foo"),

        end_db: async.apply(db.toObj),
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
        delete expected_db.appvars["io.picolabs.foo"];

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

    var getNext = async.apply(db.nextScheduleEventAt);

    async.series({
        init_db: async.apply(db.toObj),
        next0: getNext,
        at0: eventAt("Feb 22, 2222", "foo"),
        next1: getNext,
        at1: eventAt("Feb 23, 2222", "bar"),
        next2: getNext,
        at2: eventAt("Feb  2, 2222", "baz"),
        next3: getNext,

        list: async.apply(db.listScheduled),

        rm0: rmAt("id0"),
        next4: getNext,
        rm2: rmAt("id2"),
        next5: getNext,
        rm1: rmAt("id1"),
        next6: getNext,

        end_db: async.apply(db.toObj),
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
    async.series({
        init_db: async.apply(db.toObj),

        rep0: eventRep("*/5 * * * * *", "foo"),
        rep1: eventRep("* */5 * * * *", "bar"),

        mid_db: async.apply(db.toObj),

        list: async.apply(db.listScheduled),

        rm0: async.apply(db.removeScheduled, "id0"),
        rm1: async.apply(db.removeScheduled, "id1"),

        end_db: async.apply(db.toObj),
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

    async.series({
        addRS: async.apply(db.addRulesetToPico, "pico0", "rid0"),
        ent0: async.apply(db.putEntVar, "pico0", "rid0", "foo", "val0"),
        ent1: async.apply(db.putEntVar, "pico0", "rid0", "bar", "val1"),
        db_before: async.apply(db.toObj),

        rmRS: async.apply(db.removeRulesetFromPico, "pico0", "rid0"),

        db_after: async.apply(db.toObj),
    }, function(err, data){
        if(err) return t.end(err);

        t.deepEquals(data.db_before, {
            entvars: {pico0: {rid0: {foo: "val0", bar: "val1"}}},
            "pico-ruleset": {"pico0": {"rid0": {on: true}}},
            "ruleset-pico": {"rid0": {"pico0": {on: true}}},
        });

        t.deepEquals(data.db_after, {}, "should all be gone");

        t.end();
    });
});

test("DB - getPicoIDByECI", function(t){
    var db = mkTestDB();
    async.series({
        pico0: async.apply(db.newPico, {}),
        pico2: async.apply(db.newPico, {}),

        c4_p0: async.apply(db.newChannel, {pico_id: "id0", name: "four", type: "t"}),
        c5_p1: async.apply(db.newChannel, {pico_id: "id2", name: "five", type: "t"}),

        get_c2: async.apply(db.getPicoIDByECI, "id1"),
        get_c3: async.apply(db.getPicoIDByECI, "id3"),
        get_c4: async.apply(db.getPicoIDByECI, "id4"),
        get_c5: async.apply(db.getPicoIDByECI, "id5"),

    }, function(err, data){
        if(err) return t.end(err);

        t.deepEquals(data.get_c2, "id0");
        t.deepEquals(data.get_c3, "id2");
        t.deepEquals(data.get_c4, "id0");
        t.deepEquals(data.get_c5, "id2");

        db.getPicoIDByECI("bad-id", function(err, id){
            t.ok(err);
            t.ok((err && err.notFound) === true);
            t.notOk(id);
            t.end();
        });
    });
});

test("DB - listChannels", function(t){
    var db = mkTestDB();
    async.series({
        pico0: async.apply(db.newPico, {}),
        pico2: async.apply(db.newPico, {}),

        c4_p0: async.apply(db.newChannel, {pico_id: "id0", name: "four", type: "t4"}),
        c5_p1: async.apply(db.newChannel, {pico_id: "id2", name: "five", type: "t5"}),

        list0: async.apply(db.listChannels, "id0"),
        list2: async.apply(db.listChannels, "id2"),
        list404: async.apply(db.listChannels, "id404"),

    }, function(err, data){
        if(err) return t.end(err);

        var mkChan = function(pico_id, eci, name, type){
            return {
                pico_id: pico_id,
                id: eci,
                name: name,
                type: type,
                sovrin: {
                    did: eci,
                    verifyKey: "verifyKey_" + eci,
                },
            };
        };

        var c1 = mkChan("id0", "id1", "admin", "secret");
        var c3 = mkChan("id2", "id3", "admin", "secret");
        var c4 = mkChan("id0", "id4", "four", "t4");
        var c5 = mkChan("id2", "id5", "five", "t5");


        t.deepEquals(data.c4_p0, c4);
        t.deepEquals(data.c5_p1, c5);

        t.deepEquals(data.list0, [c1, c4]);
        t.deepEquals(data.list2, [c3, c5]);
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

    async.series({
        list0: async.apply(db.listAllEnabledRIDs),

        s_foo: store("foo"),
        s_bar: store("bar"),
        s_baz: store("baz"),
        list1: async.apply(db.listAllEnabledRIDs),

        e_foo: enable("foo"),
        list2: async.apply(db.listAllEnabledRIDs),

        e_bar: enable("bar"),
        e_baz: enable("baz"),
        list3: async.apply(db.listAllEnabledRIDs),

        d_foo: async.apply(db.disableRuleset, "foo"),
        list4: async.apply(db.listAllEnabledRIDs),
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

test("DB - migrations", function(t){
    var db = mkTestDB();
    async.series([
        function(next){
            db.getMigrationLog(function(err, log){
                if(err) return next(err);
                t.deepEquals(log, {});
                next();
            });
        },
        async.apply(db.recordMigration, "v1"),
        function(next){
            db.getMigrationLog(function(err, log){
                if(err) return next(err);

                t.deepEquals(_.keys(log), ["v1"]);
                t.deepEquals(_.keys(log["v1"]), ["timestamp"]);
                t.equals(log["v1"].timestamp, (new Date(log["v1"].timestamp)).toISOString());

                next();
            });
        },
        async.apply(db.recordMigration, "v200"),
        function(next){
            db.getMigrationLog(function(err, log){
                if(err) return next(err);
                t.deepEquals(_.keys(log), ["v1", "v200"]);
                next();
            });
        },
        async.apply(db.removeMigration, "v200"),
        function(next){
            db.getMigrationLog(function(err, log){
                if(err) return next(err);
                t.deepEquals(_.keys(log), ["v1"]);
                next();
            });
        },
        async.apply(db.removeMigration, "v1"),
        function(next){
            db.getMigrationLog(function(err, log){
                if(err) return next(err);
                t.deepEquals(log, {});
                next();
            });
        },
        async.apply(db.checkAndRunMigrations),
        function(next){
            db.getMigrationLog(function(err, log){
                if(err) return next(err);
                t.deepEquals(_.keys(log), _.keys(migrations));
                next();
            });
        },
    ], t.end);
});

test("DB - parent/child", function(t){
    var db = mkTestDB();

    var assertParent = function(pico_id, expected_parent_id){
        return function(next){
            db.getParent(pico_id, function(err, parent_id){
                if(err) return next(err);
                t.equals(parent_id, expected_parent_id, "testing db.getParent");
                next();
            });
        };
    };

    var assertChildren = function(pico_id, expected_children_ids){
        return function(next){
            db.listChildren(pico_id, function(err, list){
                if(err) return next(err);
                t.deepEquals(list, expected_children_ids, "testing db.listChildren");
                next();
            });
        };
    };


    async.series([
        async.apply(db.newPico, {}),// id0 and channel id1
        async.apply(db.newPico, {parent_id: "id0"}),// id2 + id3
        async.apply(db.newPico, {parent_id: "id0"}),// id4 + id5
        async.apply(db.newPico, {parent_id: "id0"}),// id6 + id7

        async.apply(db.newPico, {parent_id: "id6"}),// id8 + id9
        async.apply(db.newPico, {parent_id: "id6"}),// id10 + id11

        assertParent("id0", null),
        assertParent("id2", "id0"),
        assertParent("id4", "id0"),
        assertParent("id6", "id0"),
        assertParent("id8", "id6"),
        assertParent("id10", "id6"),

        assertChildren("id0", ["id2", "id4", "id6"]),
        assertChildren("id2", []),
        assertChildren("id4", []),
        assertChildren("id6", ["id10", "id8"]),
        assertChildren("id8", []),
        assertChildren("id10", []),

        async.apply(db.removePico, "id8"),
        assertChildren("id6", ["id10"]),

        async.apply(db.removePico, "id6"),
        assertChildren("id6", []),

    ], t.end);
});


test("DB - assertPicoID", function(t){
    var db = mkTestDB();

    var tstPID = function(id, expected_it){
        return function(next){
            db.assertPicoID(id, function(err, got_id){
                if(expected_it){
                    t.notOk(err);
                    t.equals(got_id, id);
                }else{
                    t.ok(err);
                    t.notOk(got_id);
                }
                next();
            });
        };
    };

    async.series([
        async.apply(db.newPico, {}),

        tstPID(null, false),
        tstPID(void 0, false),
        tstPID({}, false),
        tstPID(0, false),

        tstPID("id0", true),
        tstPID("id2", false),

    ], t.end);
});


test("DB - removeChannel", function(t){
    var db = mkTestDB();

    var assertECIs = function(pico_id, expected_ecis){
        return function(next){
            db.listChannels(pico_id, function(err, chans){
                if(err) return next(err);

                var eci_list = _.map(chans, "id");
                t.deepEquals(eci_list, expected_ecis, "assert the listChannels");
                t.deepEquals(_.uniq(_.map(chans, "pico_id")), [pico_id], "assert listChannels all come from the same pico_id");

                next();
            });
        };
    };

    var assertFailRemoveECI = function(eci){
        return function(next){
            db.removeChannel(eci, function(err){
                t.equals(err + "", "Error: Cannot delete the pico's admin channel");
                next();
            });
        };
    };

    async.series([

        async.apply(db.newPico, {}),
        assertECIs("id0", ["id1"]),

        async.apply(db.newChannel, {pico_id: "id0", name: "two", type: "t"}),
        assertECIs("id0", ["id1", "id2"]),


        assertFailRemoveECI("id1"),
        assertECIs("id0", ["id1", "id2"]),

        async.apply(db.removeChannel, "id2"),
        assertECIs("id0", ["id1"]),

        assertFailRemoveECI("id1"),
        assertECIs("id0", ["id1"]),

        async.apply(db.newPico, {parent_id: "id0"}),
        assertECIs("id3", ["id4"]),
        assertFailRemoveECI("id4"),
        assertECIs("id3", ["id4"]),

    ], t.end);
});
