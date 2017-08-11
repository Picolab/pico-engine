var _ = require("lodash");
var test = require("tape");
var cocb = require("co-callback");
var kengine = require("./engine");
var mkTestPicoEngine = require("../mkTestPicoEngine");

//wrap stubbed functions in this to simulate async
var tick = function(fn){
    return function(){
        var args = _.toArray(arguments);
        process.nextTick(function(){
            fn.apply(null, args);
        });
    };
};


var testPE = function(test_name, genfn){
    test(test_name, function(t){
        mkTestPicoEngine({
            rootRIDs: ["io.picolabs.engine"],
        }, function(err, pe){
            if(err) return t.end(err);

            cocb.run(function*(){
                yield genfn(t, pe);
            }, t.end);
        });
    });
};


test("engine:getPicoIDByECI", function(t){
    cocb.run(function*(){
        var engine = kengine({
            db: {
                getPicoIDByECI: tick(function(eci, callback){
                    if(eci === "foo"){
                        return callback(null, "bar");
                    }else if(eci === "baz"){
                        return callback(null, "qux");
                    }
                    callback("NOT FOUND:" + eci);
                })
            }
        });
        var get = function*(eci){
            return yield engine.def.getPicoIDByECI({}, {eci: eci,});
        };

        t.equals(yield get("foo"), "bar");
        t.equals(yield get("baz"), "qux");

        try{
            yield get("quux");
            t.fail("should throw b/c not found");
        }catch(err){
            t.equals(err, "NOT FOUND:quux");
        }

    }, t.end);
});


test("engine:registerRuleset", function(t){
    cocb.run(function*(){

        var engine = kengine({
            registerRulesetURL: tick(function(url, callback){
                callback(null, {
                    rid: "rid for: " + url
                });
            })
        });

        t.equals(yield engine.actions.registerRuleset({}, {
            url: "http://foo.bar/qux.krl",
        }), "rid for: http://foo.bar/qux.krl");

        t.equals(yield engine.actions.registerRuleset({}, {
            url: "qux.krl",
            base: "https://foo.bar/baz/",
        }), "rid for: https://foo.bar/baz/qux.krl");

        try{
            yield engine.actions.registerRuleset({}, []);
            t.fail("should throw b/c no url is given");
        }catch(err){
            t.equals(err + "", "Error: registerRuleset expects `url`");
        }

    }, t.end);
});

test("engine:installRuleset", function(t){
    cocb.run(function*(){
        var engine = kengine({
            installRuleset: tick(function(pico_id, rid, callback){
                callback();
            }),
            registerRulesetURL: tick(function(url, callback){
                callback(null, {
                    rid: "REG:" + /\/([^/]*)\.krl$/.exec(url)[1]
                });
            }),
            db: {
                findRulesetsByURL: tick(function(url, callback){
                    if(url === "http://foo.bar/baz/qux.krl"){
                        return callback(null, [{rid: "found"}]);
                    }else if(url === "file:///too/many.krl"){
                        return callback(null, [{rid: "a"}, {rid: "b"}, {rid: "c"}]);
                    }
                    callback(null, []);
                }),
            }
        });

        var inst = function*(id, rid, url, base){
            return yield engine.actions.installRuleset({}, {
                pico_id: id,
                rid: rid,
                url: url,
                base: base,
            });
        };

        try{
            yield inst("pico0");
            t.fail("should throw b/c missing args");
        }catch(err){
            t.equals(err + "", "Error: installRuleset expects `rid` or `url`+`base`");
        }

        t.equals(yield inst("pico0", "foo.bar"), "foo.bar");
        t.deepEquals(yield inst("pico0", ["foo.bar", "foo.qux"]), ["foo.bar", "foo.qux"]);
        t.deepEquals(yield inst("pico0", []), []);
        t.deepEquals(yield inst("pico0", null, "file:///foo/bar.krl"), "REG:bar");
        t.deepEquals(yield inst("pico0", null, "qux.krl", "http://foo.bar/baz/"), "found");

        try{
            yield inst("pico0", null, "file:///too/many.krl");
            t.fail("should throw b/c too many matched");
        }catch(err){
            t.equals(err + "", "Error: More than one rid found for the given url: a , b , c");
        }

    }, t.end);
});

test("engine:uninstallRuleset", function(t){
    cocb.run(function*(){

        var uninstalled = {};
        var order = 0;

        var engine = kengine({
            uninstallRuleset: tick(function(id, rid, callback){
                if(id !== "pico0"){
                    return callback(new Error("invalid pico_id"));
                }
                if(!_.isString(rid)){
                    return callback(new Error("invalid rid"));
                }
                _.set(uninstalled, [id, rid], order++);
                callback();
            })
        });

        t.equals(yield engine.actions.uninstallRuleset({}, {
            pico_id: "pico0",
            rid: "foo.bar",
        }), void 0);

        t.equals(yield engine.actions.uninstallRuleset({}, {
            pico_id: "pico0",
            rid: ["baz", "qux"],
        }), void 0);

        t.deepEquals(uninstalled, {
            pico0: {
                "foo.bar": 0,
                "baz": 1,
                "qux": 2,
            }
        });

    }, t.end);
});

test("engine:unregisterRuleset", function(t){
    cocb.run(function*(){
        var log = [];
        var engine = kengine({
            unregisterRuleset: tick(function(rid, callback){
                if(!_.isString(rid)){
                    return callback("invalid rid");
                }
                log.push(rid);
                callback();
            }),
        });

        t.equals(yield engine.actions.unregisterRuleset({}, {
            rid: "foo.bar",
        }), void 0);

        t.equals(yield engine.actions.unregisterRuleset({}, {
            rid: ["baz", "qux"],
        }), void 0);

        t.deepEquals(log, [
            "foo.bar",
            "baz",
            "qux",
        ]);

        try{
            yield engine.actions.unregisterRuleset({}, {
                rid: ["baz", 2, "qux"],
            });
            t.fail();
        }catch(err){
            t.equals(err, "invalid rid");
        }

    }, t.end);
});

testPE("engine:describeRuleset", function * (t, pe){
    var ctx = {};
    var descRID = yield pe.modules.get(ctx, "engine", "describeRuleset");

    var desc = yield descRID(ctx, {rid: "io.picolabs.hello_world"});

    var isIsoString = function(str){
        return str === (new Date(str)).toISOString();
    };

    t.deepEquals(_.keys(desc), [
        "rid",
        "src",
        "hash",
        "url",
        "timestamp_stored",
        "timestamp_enable",
        "meta",
    ]);
    t.equals(desc.rid, "io.picolabs.hello_world");
    t.ok(_.isString(desc.src));
    t.ok(_.isString(desc.hash));
    t.ok(_.isString(desc.url));
    t.ok(isIsoString(desc.timestamp_stored));
    t.ok(isIsoString(desc.timestamp_enable));
    t.deepEquals(desc.meta, {
        name: "Hello World",
        description: "\nA first ruleset for the Quickstart\n        ",
        author: "Phil Windley",
    });

    try{
        yield descRID(ctx, {rid: "not.found"});
        t.fail("should fail b/c not found");
    }catch(err){
        t.ok(err && err.notFound);
    }
});

testPE("engine:listInstalledRIDs", function * (t, pe){
    var ctx = {};
    var listRIDs = yield pe.modules.get(ctx, "engine", "listInstalledRIDs");

    var rids = yield listRIDs(ctx, {pico_id: "id0"});

    t.deepEquals(rids, [
        "io.picolabs.engine",
    ]);
});

testPE("engine:newPico", function * (t, pe){
    var action = function*(ctx, name, args){
        return yield pe.modules.action(ctx, "engine", name, args);
    };

    var pico2 = yield action({}, "newPico", {
        parent_id: "id0",
    });
    t.deepEquals(pico2, {
        id: "id2",
        parent_id: "id0",
    });

    //default to ctx.pico_id
    var pico3 = yield action({
        pico_id: "id2",//called by pico2
    }, "newPico", {});
    t.deepEquals(pico3, {
        id: "id3",
        parent_id: "id2",
    });

    //no parent_id
    try{
        yield action({}, "newPico", {});
        t.fail("should have thrown");
    }catch(e){
        t.equals(e + "", "Error: Invalid pico_id: null");
    }
});


testPE("engine:getParent, engine:listChildren, engine:removePico", function * (t, pe){

    var newPico = function*(parent_id){
        return yield pe.modules.action({pico_id: parent_id}, "engine", "newPico", []);
    };
    var removePico = function*(ctx, args){
        return yield pe.modules.action(ctx, "engine", "removePico", args);
    };

    var getParent = yield pe.modules.get({}, "engine", "getParent");
    var listChildren = yield pe.modules.get({}, "engine", "listChildren");

    yield newPico("id0");// id2
    yield newPico("id0");// id3
    yield newPico("id2");// id4

    t.equals(yield getParent({}, ["id0"]), null);
    t.equals(yield getParent({}, ["id2"]), "id0");
    t.equals(yield getParent({}, ["id3"]), "id0");
    t.equals(yield getParent({}, ["id4"]), "id2");

    t.deepEquals(yield listChildren({}, ["id0"]), ["id2", "id3"]);
    t.deepEquals(yield listChildren({}, ["id2"]), ["id4"]);
    t.deepEquals(yield listChildren({}, ["id3"]), []);
    t.deepEquals(yield listChildren({}, ["id4"]), []);

    //fallback on ctx.pico_id
    t.equals(yield getParent({pico_id: "id4"}, []), "id2");
    t.deepEquals(yield listChildren({pico_id: "id2"}, []), ["id4"]);


    t.equals(yield removePico({}, ["id4"]), void 0);
    t.deepEquals(yield listChildren({}, ["id2"]), []);

    //report error on invalid pico_id
    var assertInvalidPicoID = function * (genfn, id, expected){
        try{
            yield genfn({pico_id: id}, []);
            t.fail("should have thrown on invalid pico_id");
        }catch(e){
            t.equals(e + "", expected);
        }
    };

    yield assertInvalidPicoID(getParent   , "id404", "NotFoundError: Invalid pico_id: id404");
    yield assertInvalidPicoID(listChildren, "id404", "NotFoundError: Invalid pico_id: id404");
    yield assertInvalidPicoID(removePico  , "id404", "NotFoundError: Invalid pico_id: id404");

    yield assertInvalidPicoID(getParent   , void 0, "Error: Invalid pico_id: null");
    yield assertInvalidPicoID(listChildren, void 0, "Error: Invalid pico_id: null");
    yield assertInvalidPicoID(removePico  , void 0, "Error: Invalid pico_id: null");
});

testPE("engine:newChannel, engine:listChannels, engine:removeChannel", function * (t, pe){

    var newChannel = function*(ctx, args){
        return yield pe.modules.action(ctx, "engine", "newChannel", args);
    };
    var removeChannel = function*(ctx, args){
        return yield pe.modules.action(ctx, "engine", "removeChannel", args);
    };
    var listChannels = yield pe.modules.get({}, "engine", "listChannels");

    t.deepEquals(yield listChannels({}, ["id0"]), [
        {id: "id1", pico_id: "id0", name: "root", type: "secret"},
    ]);

    t.deepEquals(yield newChannel({}, ["id0"]), {id: "id2", pico_id: "id0", name: void 0, type: void 0});
    t.deepEquals(yield listChannels({}, ["id0"]), [
        {id: "id1", pico_id: "id0", name: "root", type: "secret"},
        {id: "id2", pico_id: "id0"},
    ]);

    t.equals(yield removeChannel({}, ["id1"]), void 0);
    t.deepEquals(yield listChannels({}, ["id0"]), [
        {id: "id2", pico_id: "id0"},
    ]);

    t.equals(yield removeChannel({}, ["id2"]), void 0);
    t.deepEquals(yield listChannels({}, ["id0"]), [
    ]);

    //report error on invalid pico_id
    var assertInvalidPicoID = function * (genfn, id, expected){
        try{
            yield genfn({pico_id: id}, []);
            t.fail("should have thrown on invalid pico_id");
        }catch(e){
            t.equals(e + "", expected);
        }
    };

    yield assertInvalidPicoID(newChannel  , "id404", "NotFoundError: Invalid pico_id: id404");
    yield assertInvalidPicoID(listChannels, "id404", "NotFoundError: Invalid pico_id: id404");

    yield assertInvalidPicoID(newChannel  , void 0, "Error: Invalid pico_id: null");
    yield assertInvalidPicoID(listChannels, void 0, "Error: Invalid pico_id: null");

});


testPE("engine:installRuleset, engine:listInstalledRIDs, engine:uninstallRuleset", function * (t, pe){

    var installRS = function*(ctx, args){
        return yield pe.modules.action(ctx, "engine", "installRuleset", args);
    };
    var uninstallRID = function*(ctx, args){
        return yield pe.modules.action(ctx, "engine", "uninstallRuleset", args);
    };
    var listRIDs = yield pe.modules.get({}, "engine", "listInstalledRIDs");

    t.deepEquals(yield listRIDs({pico_id: "id0"}, []), [
        "io.picolabs.engine",
    ]);

    t.equals(yield installRS({}, ["id0", "io.picolabs.hello_world"]), "io.picolabs.hello_world");
    t.deepEquals(yield listRIDs({pico_id: "id0"}, []), [
        "io.picolabs.engine",
        "io.picolabs.hello_world",
    ]);

    t.equals(yield uninstallRID({}, ["id0", "io.picolabs.engine"]), void 0);
    t.deepEquals(yield listRIDs({pico_id: "id0"}, []), [
        "io.picolabs.hello_world",
    ]);

    //report error on invalid pico_id
    var assertInvalidPicoID = function * (genfn, id, expected){
        try{
            yield genfn({pico_id: id}, {rid: "io.picolabs.hello_world"});
            t.fail("should have thrown on invalid pico_id");
        }catch(e){
            t.equals(e + "", expected);
        }
    };

    yield assertInvalidPicoID(installRS   , "id404", "NotFoundError: Invalid pico_id: id404");
    yield assertInvalidPicoID(uninstallRID, "id404", "NotFoundError: Invalid pico_id: id404");

    yield assertInvalidPicoID(installRS   , void 0, "Error: Invalid pico_id: null");
    yield assertInvalidPicoID(uninstallRID, void 0, "Error: Invalid pico_id: null");

});
