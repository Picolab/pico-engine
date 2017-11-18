var _ = require("lodash");
var test = require("tape");
var cocb = require("co-callback");
var ktypes = require("krl-stdlib/types");
var strictDeepEquals = require("krl-stdlib/src/strictEquals").strictDeepEquals;
var kengine = require("./engine");
var ADMIN_POLICY_ID = require("../DB").ADMIN_POLICY_ID;
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

var runAction = cocb.wrap(function*(pe, ctx, domain, id, args){
    var act = yield pe.modules.get(ctx, domain, id);
    return _.head(yield act(ctx, args));
});


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

var testError = cocb.wrap(function*(t, promise, errMsg, msg){
    try{
        yield promise;
        t.fail("should fail", msg);
    }catch(err){
        t.equals(err + "", errMsg, msg);
    }
});

var assertPicoID = function(id, callback){
    if( ! ktypes.isString(id)){
        return callback(new TypeError("Invalid pico_id: " + ktypes.toString(id)));
    }
    callback(null, id);
};


testPE("engine:getPicoIDByECI", function*(t, pe){
    var tstErr = _.partial(testError, t);

    var getPicoIDByECI = yield pe.modules.get({}, "engine", "getPicoIDByECI");
    var get = function(){
        return getPicoIDByECI({}, _.toArray(arguments));
    };

    t.equals(yield get("id1"), "id0");

    yield tstErr(
        get(),
        "Error: engine:getPicoIDByECI needs an eci string",
        "no eci is given"
    );
    yield tstErr(
        get(null),
        "TypeError: engine:getPicoIDByECI was given null instead of an eci string",
        "wrong eci type"
    );
    yield tstErr(
        get("quux"),
        "NotFoundError: ECI not found: quux",
        "eci not found"
    );
});


test("engine:registerRuleset", function(t){
    cocb.run(function*(){
        var tstErr = _.partial(testError, t);

        var engine = kengine({
            registerRulesetURL: tick(function(url, callback){
                callback(null, {
                    rid: "rid for: " + url
                });
            })
        });

        t.equals((yield engine.def.registerRuleset({}, {
            url: "http://foo.bar/qux.krl",
        }))[0], "rid for: http://foo.bar/qux.krl");

        t.equals((yield engine.def.registerRuleset({}, {
            url: "qux.krl",
            base: "https://foo.bar/baz/",
        }))[0], "rid for: https://foo.bar/baz/qux.krl");

        yield tstErr(
            engine.def.registerRuleset({}, []),
            "Error: engine:registerRuleset needs a url string",
            "no url is given"
        );

        yield tstErr(
            engine.def.registerRuleset({}, [_.noop]),
            "TypeError: engine:registerRuleset was given [Function] instead of a url string",
            "wrong url type"
        );

    }, t.end);
});

test("engine:installRuleset", function(t){
    cocb.run(function*(){
        var tstErr = _.partial(testError, t);

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
                assertPicoID: assertPicoID,
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

        var inst = cocb.wrap(function*(id, rid, url, base){
            var args = {};
            if(id !== void 0){
                args.pico_id = id;
            }
            if(rid !== void 0){
                args.rid = rid;
            }
            if(url !== void 0){
                args.url = url;
            }
            if(base !== void 0){
                args.base = base;
            }
            return (yield engine.def.installRuleset({}, args))[0];
        });

        t.equals(yield inst("pico0", "foo.bar"), "foo.bar");
        t.deepEquals(yield inst("pico0", ["foo.bar", "foo.qux"]), ["foo.bar", "foo.qux"]);
        strictDeepEquals(t, yield inst("pico0", []), []);
        t.deepEquals(yield inst("pico0", void 0, "file:///foo/bar.krl"), "REG:bar");
        t.deepEquals(yield inst("pico0", void 0, "qux.krl", "http://foo.bar/baz/"), "found");

        yield tstErr(
            inst("pico0", void 0, "file:///too/many.krl"),
            "Error: More than one rid found for the given url: a , b , c",
            "too many matched"
        );

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
            }),
            db: {
                assertPicoID: assertPicoID,
            }
        });

        t.equals((yield engine.def.uninstallRuleset({}, {
            pico_id: "pico0",
            rid: "foo.bar",
        }))[0], void 0);

        t.equals((yield engine.def.uninstallRuleset({}, {
            pico_id: "pico0",
            rid: ["baz", "qux"],
        }))[0], void 0);

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
        var tstErr = _.partial(testError, t);

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

        t.equals((yield engine.def.unregisterRuleset({}, {
            rid: "foo.bar",
        }))[0], void 0);

        t.equals((yield engine.def.unregisterRuleset({}, {
            rid: ["baz", "qux"],
        }))[0], void 0);

        yield tstErr(
            engine.def.unregisterRuleset({}, []),
            "Error: engine:unregisterRuleset needs a rid string or array"
        );

        yield tstErr(
            engine.def.unregisterRuleset({}, {rid: {},}),
            "TypeError: engine:unregisterRuleset was given [Map] instead of a rid string or array"
        );

        yield tstErr(
            engine.def.unregisterRuleset({}, {
                rid: ["baz", 2, "qux"],
            }),
            "TypeError: engine:unregisterRuleset was given a rid array containing a non-string (2)"
        );

        t.deepEquals(log, [
            "foo.bar",
            "baz",
            "qux",
        ]);

    }, t.end);
});

testPE("engine:describeRuleset", function * (t, pe){
    var tstErr = _.partial(testError, t);

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

    yield tstErr(
        descRID(ctx, []),
        "Error: engine:describeRuleset needs a rid string",
        "no rid is given"
    );
    yield tstErr(
        descRID(ctx, [[]]),
        "TypeError: engine:describeRuleset was given [Array] instead of a rid string",
        "wrong rid type"
    );
    try{
        yield descRID(ctx, {rid: "not.found"});
        t.fail("should fail b/c not found");
    }catch(err){
        t.ok(err && err.notFound);
    }
});


testPE("engine:listAllEnabledRIDs", function * (t, pe){
    var listAllEnabledRIDs = yield pe.modules.get({}, "engine", "listAllEnabledRIDs");
    var rids = yield listAllEnabledRIDs({}, []);
    t.ok(rids.length > 1, "should be all the test-rulesets/");
    t.ok(_.every(rids, _.isString));
    t.ok(_.includes(rids, "io.picolabs.engine"));
});


testPE("engine:newPico", function * (t, pe){
    var action = function(ctx, name, args){
        return runAction(pe, ctx, "engine", name, args);
    };

    var pico2 = yield action({}, "newPico", {
        parent_id: "id0",
    });
    t.deepEquals(pico2, {
        id: "id2",
        parent_id: "id0",
        admin_eci: "id3",
    });

    //default to ctx.pico_id
    var pico3 = yield action({
        pico_id: "id2",//called by pico2
    }, "newPico", {});
    t.deepEquals(pico3, {
        id: "id4",
        parent_id: "id2",
        admin_eci: "id5",
    });
});


testPE("engine:getParent, engine:getAdminECI, engine:listChildren, engine:removePico", function * (t, pe){
    var tstErr = _.partial(testError, t);

    var newPico = function(ctx, args){
        return runAction(pe, ctx, "engine", "newPico", args);
    };
    var removePico = function(ctx, args){
        return runAction(pe, ctx, "engine", "removePico", args);
    };

    var getParent = yield pe.modules.get({}, "engine", "getParent");
    var getAdminECI = yield pe.modules.get({}, "engine", "getAdminECI");
    var listChildren = yield pe.modules.get({}, "engine", "listChildren");

    yield newPico({pico_id: "id0"}, []);// id2
    yield newPico({}, ["id0"]);// id4
    yield newPico({pico_id: "id2"}, []);// id6

    t.equals(yield getParent({}, ["id0"]), null);
    t.equals(yield getParent({}, ["id2"]), "id0");
    t.equals(yield getParent({}, ["id4"]), "id0");
    t.equals(yield getParent({}, ["id6"]), "id2");

    t.equals(yield getAdminECI({}, ["id0"]), "id1");
    t.equals(yield getAdminECI({}, ["id2"]), "id3");
    t.equals(yield getAdminECI({}, ["id4"]), "id5");
    t.equals(yield getAdminECI({}, ["id6"]), "id7");

    t.deepEquals(yield listChildren({}, ["id0"]), ["id2", "id4"]);
    t.deepEquals(yield listChildren({}, ["id2"]), ["id6"]);
    strictDeepEquals(t, yield listChildren({}, ["id4"]), []);
    strictDeepEquals(t, yield listChildren({}, ["id6"]), []);

    //fallback on ctx.pico_id
    t.equals(yield getParent({pico_id: "id6"}, []), "id2");
    t.equals(yield getAdminECI({pico_id: "id6"}, []), "id7");
    t.deepEquals(yield listChildren({pico_id: "id2"}, []), ["id6"]);
    t.equals(yield removePico({pico_id: "id6"}, []), void 0);
    strictDeepEquals(t, yield listChildren({}, ["id2"]), []);

    //report error on invalid pico_id
    var assertInvalidPicoID = function(genfn, id, expected){
        return tstErr(genfn({pico_id: id}, []), expected);
    };

    yield assertInvalidPicoID(getParent   , void 0, "TypeError: engine:getParent was given null instead of a pico_id string");
    yield assertInvalidPicoID(getAdminECI , void 0, "TypeError: engine:getAdminECI was given null instead of a pico_id string");
    yield assertInvalidPicoID(listChildren, void 0, "TypeError: engine:listChildren was given null instead of a pico_id string");
    yield assertInvalidPicoID(newPico     , void 0, "TypeError: engine:newPico was given null instead of a parent_id string");
    yield assertInvalidPicoID(removePico  , void 0, "TypeError: engine:removePico was given null instead of a pico_id string");

    yield assertInvalidPicoID(getAdminECI , "id404", "NotFoundError: Pico not found: id404");
    yield assertInvalidPicoID(getParent   , "id404", "NotFoundError: Pico not found: id404");
    yield assertInvalidPicoID(listChildren, "id404", "NotFoundError: Pico not found: id404");
    yield assertInvalidPicoID(newPico     , "id404", "NotFoundError: Pico not found: id404");
    yield assertInvalidPicoID(removePico  , "id404", "NotFoundError: Pico not found: id404");

    yield tstErr(
        removePico({}, ["id0"]),
        "Error: Cannot remove pico \"id0\" because it has 2 children",
        "you can't remove a pico with children"
    );
});


testPE("engine:newPolicy, engine:listPolicies, engine:removePolicy", function * (t, pe){
    var tstErr = _.partial(testError, t);

    var newPolicy = function(policy){
        return runAction(pe, {}, "engine", "newPolicy", [policy]);
    };
    var listPolicies = yield pe.modules.get({}, "engine", "listPolicies");
    var removePolicy = function(id){
        return runAction(pe, {}, "engine", "removePolicy", [id]);
    };

    // Making sure ChannelPolicy.clean is on
    yield tstErr(newPolicy(), "TypeError: Cannot read property 'name' of undefined");
    yield tstErr(newPolicy({name: 1}), "Error: missing `policy.name`");

    var pAdmin = {
        id: ADMIN_POLICY_ID,
        name: "admin channel policy",
        event: {allow: [{}]},
        query: {allow: [{}]},
    };

    t.deepEquals(yield listPolicies(), [pAdmin]);

    var pFoo = yield newPolicy({name: "foo"});
    t.deepEquals(pFoo, {
        id: "id2",
        name: "foo",
        event: {deny: [], allow: []},
        query: {deny: [], allow: []},
    });

    t.deepEquals(yield listPolicies(), [pAdmin, pFoo]);

    var pBar = yield newPolicy({
        name: "bar",
        event: {allow: [{domain: "system"}]}
    });
    t.deepEquals(pBar, {
        id: "id3",
        name: "bar",
        event: {deny: [], allow: [{domain: "system"}]},
        query: {deny: [], allow: []},
    });

    t.deepEquals(yield listPolicies(), [pAdmin, pFoo, pBar]);

    yield tstErr(removePolicy(), "TypeError: engine:removePolicy was given null instead of a policy_id string");
    yield tstErr(removePolicy("id404"), "NotFoundError: Policy not found: id404");

    yield removePolicy(pFoo.id);
    t.deepEquals(yield listPolicies(), [pAdmin, pBar]);

    yield tstErr(removePolicy(pAdmin.id), "Error: Policy " + pAdmin.id +  " is in use, cannot remove.");

    yield removePolicy(pBar.id);
    t.deepEquals(yield listPolicies(), [pAdmin]);
});


testPE("engine:newChannel, engine:listChannels, engine:removeChannel", function * (t, pe){
    var tstErr = _.partial(testError, t);

    var newChannel = function(ctx, args){
        return runAction(pe, ctx, "engine", "newChannel", args);
    };
    var removeChannel = function(ctx, args){
        return runAction(pe, ctx, "engine", "removeChannel", args);
    };
    var listChannels = yield pe.modules.get({}, "engine", "listChannels");

    var mkChan = function(pico_id, eci, name, type){
        return {
            pico_id: pico_id,
            id: eci,
            name: name,
            type: type,
            policy_id: ADMIN_POLICY_ID,
            sovrin: {
                did: eci,
                verifyKey: "verifyKey_" + eci,
            },
        };
    };

    t.deepEquals(yield listChannels({}, ["id0"]), [
        mkChan("id0", "id1", "admin", "secret"),
    ]);

    t.deepEquals(yield newChannel({}, ["id0", "a", "b"]), mkChan("id0", "id2", "a", "b"));
    t.deepEquals(yield listChannels({}, ["id0"]), [
        mkChan("id0", "id1", "admin", "secret"),
        mkChan("id0", "id2", "a", "b"),
    ]);

    yield tstErr(
        newChannel({}, ["id1"]),
        "Error: engine:newChannel needs a name string",
        "no name is given"
    );
    yield tstErr(
        newChannel({}, ["id1", "id1"]),
        "Error: engine:newChannel needs a type string",
        "no type is given"
    );

    yield tstErr(
        removeChannel({}, ["id1"]),
        "Error: Cannot delete the pico's admin channel",
        "removeChannel shouldn't remove the admin channel"
    );
    yield tstErr(
        removeChannel({}, []),
        "Error: engine:removeChannel needs an eci string",
        "no eci is given"
    );
    yield tstErr(
        removeChannel({}, [/id1/]),
        "TypeError: engine:removeChannel was given re#id1# instead of an eci string",
        "wrong eci type"
    );
    yield tstErr(
        removeChannel({}, ["eci404"]),
        "NotFoundError: Key not found in database [channel,eci404]",
        "eci not found"
    );

    t.equals(yield removeChannel({}, ["id2"]), void 0);
    t.deepEquals(yield listChannels({}, ["id0"]), [
        mkChan("id0", "id1", "admin", "secret"),
    ]);

    //fallback on ctx.pico_id
    t.deepEquals(yield listChannels({pico_id: "id0"}, []), [
        mkChan("id0", "id1", "admin", "secret"),
    ]);
    t.deepEquals(yield newChannel({pico_id: "id0"}, {"name": "a", "type": "b"}), mkChan("id0", "id3", "a", "b"));

    //report error on invalid pico_id
    var assertInvalidPicoID = function(genfn, id, expected){
        return tstErr(genfn({pico_id: id}, {"name": "a", "type": "b"}), expected);
    };

    yield assertInvalidPicoID(newChannel  , void 0, "TypeError: engine:newChannel was given null instead of a pico_id string");
    yield assertInvalidPicoID(listChannels, void 0, "TypeError: engine:listChannels was given null instead of a pico_id string");

    yield assertInvalidPicoID(newChannel  , "id404", "NotFoundError: Pico not found: id404");
    yield assertInvalidPicoID(listChannels, "id404", "NotFoundError: Pico not found: id404");

});


testPE("engine:installRuleset, engine:listInstalledRIDs, engine:uninstallRuleset", function * (t, pe){
    var tstErr = _.partial(testError, t);

    var installRS = function(ctx, args){
        return runAction(pe, ctx, "engine", "installRuleset", args);
    };
    var uninstallRID = function(ctx, args){
        return runAction(pe, ctx, "engine", "uninstallRuleset", args);
    };
    var listRIDs = yield pe.modules.get({}, "engine", "listInstalledRIDs");

    t.deepEquals(yield listRIDs({pico_id: "id0"}, []), [
        "io.picolabs.engine",
    ]);

    t.equals(yield installRS({}, ["id0", "io.picolabs.hello_world"]), "io.picolabs.hello_world");
    yield tstErr(
        installRS({}, [NaN]),
        "Error: engine:installRuleset needs either a rid string or array, or a url string",
        "no rid or url is given"
    );
    yield tstErr(
        installRS({}, ["id0", NaN, 0]),
        "TypeError: engine:installRuleset was given null instead of a rid string or array",
        "wrong rid type"
    );
    yield tstErr(
        installRS({}, ["id0", [[]]]),
        "TypeError: engine:installRuleset was given a rid array containing a non-string ([Array])",
        "rid array has a non-string"
    );
    yield tstErr(
        installRS({"pico_id": "id0"}, {"url": {}}),
        "TypeError: engine:installRuleset was given [Map] instead of a url string",
        "wrong url type"
    );
    t.deepEquals(yield listRIDs({pico_id: "id0"}, []), [
        "io.picolabs.engine",
        "io.picolabs.hello_world",
    ]);

    t.equals(yield uninstallRID({}, ["id0", "io.picolabs.engine"]), void 0);
    yield tstErr(
        uninstallRID({}, []),
        "Error: engine:uninstallRuleset needs a rid string or array",
        "no rid is given"
    );
    yield tstErr(
        uninstallRID({}, ["id0", void 0]),
        "TypeError: engine:uninstallRuleset was given null instead of a rid string or array",
        "wrong rid type"
    );
    yield tstErr(
        uninstallRID({}, ["id0", ["null", null]]),
        "TypeError: engine:uninstallRuleset was given a rid array containing a non-string (null)",
        "rid array has a non-string"
    );
    t.deepEquals(yield listRIDs({pico_id: "id0"}, []), [
        "io.picolabs.hello_world",
    ]);

    //fallback on ctx.pico_id
    t.equals(yield uninstallRID({pico_id: "id0"}, {rid: "io.picolabs.hello_world"}), void 0);
    strictDeepEquals(t, yield listRIDs({pico_id: "id0"}, []), []);
    t.equals(yield installRS({pico_id: "id0"}, {rid: "io.picolabs.hello_world"}), "io.picolabs.hello_world");

    //report error on invalid pico_id
    var assertInvalidPicoID = function(genfn, id, expected){
        return tstErr(genfn({pico_id: id}, {rid: "io.picolabs.hello_world"}), expected);
    };

    yield assertInvalidPicoID(listRIDs    , void 0, "TypeError: engine:listInstalledRIDs was given null instead of a pico_id string");

    yield assertInvalidPicoID(installRS   , "id404", "NotFoundError: Pico not found: id404");
    yield assertInvalidPicoID(uninstallRID, "id404", "NotFoundError: Pico not found: id404");
    yield assertInvalidPicoID(listRIDs    , "id404", "NotFoundError: Pico not found: id404");

});
