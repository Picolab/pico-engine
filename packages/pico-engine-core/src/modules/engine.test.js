var _ = require("lodash");
var test = require("tape");
var util = require("util");
var ktypes = require("krl-stdlib/types");
var strictDeepEquals = require("../../test/helpers/strictEquals").strictDeepEquals;
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

async function runAction(pe, ctx, domain, id, args){
    var act = await pe.modules.get(ctx, domain, id);
    return _.head(await act(ctx, args));
}


var testPE = function(test_name, genfn){
    test(test_name, function(t){
        mkTestPicoEngine({
            rootRIDs: ["io.picolabs.engine"],
        }, function(err, pe){
            if(err) return t.end(err);

            (async function(){
                await genfn(t, pe);
            }()).then(t.end).catch(t.end);
        });
    });
};

async function testError(t, promise, errMsg, msg){
    try{
        await promise;
        t.fail("should fail", msg);
    }catch(err){
        t.equals(err + "", errMsg, msg);
    }
}

var assertPicoID = function(id, callback){
    if( ! ktypes.isString(id)){
        return callback(new TypeError("Invalid pico_id: " + ktypes.toString(id)));
    }
    callback(null, id);
};


testPE("engine:getPicoIDByECI", async function(t, pe){
    var tstErr = _.partial(testError, t);

    var getPicoIDByECI = await pe.modules.get({}, "engine", "getPicoIDByECI");
    var get = function(){
        return getPicoIDByECI({}, _.toArray(arguments));
    };

    t.equals(await get("id1"), "id0");

    await tstErr(
        get(),
        "Error: engine:getPicoIDByECI needs an eci string",
        "no eci is given"
    );
    await tstErr(
        get(null),
        "TypeError: engine:getPicoIDByECI was given null instead of an eci string",
        "wrong eci type"
    );
    t.equals(await get("quux"), void 0, "eci not found");
});


test("engine:registerRuleset", function(t){
    (async function(){
        var tstErr = _.partial(testError, t);

        var engine = kengine({
            registerRulesetURL: tick(function(url, callback){
                callback(null, {
                    rid: "rid for: " + url
                });
            })
        });

        t.equals((await engine.def.registerRuleset({}, {
            url: "http://foo.bar/qux.krl",
        }))[0], "rid for: http://foo.bar/qux.krl");

        t.equals((await engine.def.registerRuleset({}, {
            url: "qux.krl",
            base: "https://foo.bar/baz/",
        }))[0], "rid for: https://foo.bar/baz/qux.krl");

        await tstErr(
            engine.def.registerRuleset({}, []),
            "Error: engine:registerRuleset needs a url string",
            "no url is given"
        );

        await tstErr(
            engine.def.registerRuleset({}, [_.noop]),
            "TypeError: engine:registerRuleset was given [Function] instead of a url string",
            "wrong url type"
        );

    }()).then(t.end).catch(t.end);
});

test("engine:installRuleset", function(t){
    (async function(){
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

        var inst = async function(id, rid, url, base){
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
            return (await engine.def.installRuleset({}, args))[0];
        };

        t.equals(await inst("pico0", "foo.bar"), "foo.bar");
        t.deepEquals(await inst("pico0", ["foo.bar", "foo.qux"]), ["foo.bar", "foo.qux"]);
        strictDeepEquals(t, await inst("pico0", []), []);
        t.deepEquals(await inst("pico0", void 0, "file:///foo/bar.krl"), "REG:bar");
        t.deepEquals(await inst("pico0", void 0, "qux.krl", "http://foo.bar/baz/"), "found");

        await tstErr(
            inst("pico0", void 0, "file:///too/many.krl"),
            "Error: More than one rid found for the given url: a , b , c",
            "too many matched"
        );

    }()).then(t.end).catch(t.end);
});

test("engine:uninstallRuleset", function(t){
    (async function(){

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

        t.equals((await engine.def.uninstallRuleset({}, {
            pico_id: "pico0",
            rid: "foo.bar",
        }))[0], void 0);

        t.equals((await engine.def.uninstallRuleset({}, {
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

    }()).then(t.end).catch(t.end);
});

test("engine:unregisterRuleset", function(t){
    (async function(){
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

        t.equals((await engine.def.unregisterRuleset({}, {
            rid: "foo.bar",
        }))[0], void 0);

        t.equals((await engine.def.unregisterRuleset({}, {
            rid: ["baz", "qux"],
        }))[0], void 0);

        await tstErr(
            engine.def.unregisterRuleset({}, []),
            "Error: engine:unregisterRuleset needs a rid string or array"
        );

        await tstErr(
            engine.def.unregisterRuleset({}, {rid: {},}),
            "TypeError: engine:unregisterRuleset was given [Map] instead of a rid string or array"
        );

        await tstErr(
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

    }()).then(t.end).catch(t.end);
});

testPE("engine:describeRuleset", async function(t, pe){
    var tstErr = _.partial(testError, t);

    var ctx = {};
    var descRID = await pe.modules.get(ctx, "engine", "describeRuleset");

    var desc = await descRID(ctx, {rid: "io.picolabs.hello_world"});

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

    await tstErr(
        descRID(ctx, []),
        "Error: engine:describeRuleset needs a rid string",
        "no rid is given"
    );
    await tstErr(
        descRID(ctx, [[]]),
        "TypeError: engine:describeRuleset was given [Array] instead of a rid string",
        "wrong rid type"
    );

    t.equals(await descRID(ctx, {rid: "not.found"}), void 0);
});


testPE("engine:listAllEnabledRIDs", async function (t, pe){
    var listAllEnabledRIDs = await pe.modules.get({}, "engine", "listAllEnabledRIDs");
    var rids = await listAllEnabledRIDs({}, []);
    t.ok(rids.length > 1, "should be all the test-rulesets/");
    t.ok(_.every(rids, _.isString));
    t.ok(_.includes(rids, "io.picolabs.engine"));
});


testPE("engine:newPico", async function (t, pe){
    var action = function(ctx, name, args){
        return runAction(pe, ctx, "engine", name, args);
    };

    var pico2 = await action({}, "newPico", {
        parent_id: "id0",
    });
    t.deepEquals(pico2, {
        id: "id2",
        parent_id: "id0",
        admin_eci: "id3",
    });

    //default to ctx.pico_id
    var pico3 = await action({
        pico_id: "id2",//called by pico2
    }, "newPico", {});
    t.deepEquals(pico3, {
        id: "id4",
        parent_id: "id2",
        admin_eci: "id5",
    });
});


testPE("engine:getParent, engine:getAdminECI, engine:listChildren, engine:removePico", async function (t, pe){
    var tstErr = _.partial(testError, t);

    var newPico = function(ctx, args){
        return runAction(pe, ctx, "engine", "newPico", args);
    };
    var removePico = function(ctx, args){
        return runAction(pe, ctx, "engine", "removePico", args);
    };

    var getParent = await pe.modules.get({}, "engine", "getParent");
    var getAdminECI = await pe.modules.get({}, "engine", "getAdminECI");
    var listChildren = await pe.modules.get({}, "engine", "listChildren");

    await newPico({pico_id: "id0"}, []);// id2
    await newPico({}, ["id0"]);// id4
    await newPico({pico_id: "id2"}, []);// id6

    t.equals(await getParent({}, ["id0"]), null);
    t.equals(await getParent({}, ["id2"]), "id0");
    t.equals(await getParent({}, ["id4"]), "id0");
    t.equals(await getParent({}, ["id6"]), "id2");

    t.equals(await getAdminECI({}, ["id0"]), "id1");
    t.equals(await getAdminECI({}, ["id2"]), "id3");
    t.equals(await getAdminECI({}, ["id4"]), "id5");
    t.equals(await getAdminECI({}, ["id6"]), "id7");

    t.deepEquals(await listChildren({}, ["id0"]), ["id2", "id4"]);
    t.deepEquals(await listChildren({}, ["id2"]), ["id6"]);
    strictDeepEquals(t, await listChildren({}, ["id4"]), []);
    strictDeepEquals(t, await listChildren({}, ["id6"]), []);

    //fallback on ctx.pico_id
    t.equals(await getParent({pico_id: "id6"}, []), "id2");
    t.equals(await getAdminECI({pico_id: "id6"}, []), "id7");
    t.deepEquals(await listChildren({pico_id: "id2"}, []), ["id6"]);
    t.equals(await removePico({pico_id: "id6"}, []), true);
    t.equals(await removePico({pico_id: "id6"}, []), false);
    strictDeepEquals(t, await listChildren({}, ["id2"]), []);

    //report error on invalid pico_id
    var assertInvalidPicoID = function(genfn, id, expected){
        return tstErr(genfn({pico_id: id}, []), expected);
    };

    await assertInvalidPicoID(getParent   , void 0, "TypeError: engine:getParent was given null instead of a pico_id string");
    await assertInvalidPicoID(getAdminECI , void 0, "TypeError: engine:getAdminECI was given null instead of a pico_id string");
    await assertInvalidPicoID(listChildren, void 0, "TypeError: engine:listChildren was given null instead of a pico_id string");
    await assertInvalidPicoID(newPico     , void 0, "TypeError: engine:newPico was given null instead of a parent_id string");
    await assertInvalidPicoID(removePico  , void 0, "TypeError: engine:removePico was given null instead of a pico_id string");

    t.equals(await getAdminECI({}, ["id404"]), void 0);
    t.equals(await getParent({pico_id: "id404"}, []), void 0);
    t.equals(await listChildren({pico_id: "id404"}, []), void 0);
    await assertInvalidPicoID(newPico     , "id404", "NotFoundError: Pico not found: id404");
    t.equals(await removePico({}, ["id404"]), false);

    await tstErr(
        removePico({}, ["id0"]),
        "Error: Cannot remove pico \"id0\" because it has 2 children",
        "you can't remove a pico with children"
    );
});


testPE("engine:newPolicy, engine:listPolicies, engine:removePolicy", async function (t, pe){
    var tstErr = _.partial(testError, t);

    var newPolicy = function(policy){
        return runAction(pe, {}, "engine", "newPolicy", [policy]);
    };
    var listPolicies = await pe.modules.get({}, "engine", "listPolicies");
    var removePolicy = function(id){
        return runAction(pe, {}, "engine", "removePolicy", [id]);
    };

    // Making sure ChannelPolicy.clean is on
    await tstErr(newPolicy(), "TypeError: Policy definition should be a Map, but was Null");
    await tstErr(newPolicy({name: 1}), "Error: missing `policy.name`");

    var pAdmin = {
        id: ADMIN_POLICY_ID,
        name: "admin channel policy",
        event: {allow: [{}]},
        query: {allow: [{}]},
    };

    t.deepEquals(await listPolicies(), [pAdmin]);

    var pFoo = await newPolicy({name: "foo"});
    t.deepEquals(pFoo, {
        id: "id2",
        name: "foo",
        event: {deny: [], allow: []},
        query: {deny: [], allow: []},
    });

    t.deepEquals(await listPolicies(), [pAdmin, pFoo]);

    var pBar = await newPolicy({
        name: "bar",
        event: {allow: [{domain: "system"}]}
    });
    t.deepEquals(pBar, {
        id: "id3",
        name: "bar",
        event: {deny: [], allow: [{domain: "system"}]},
        query: {deny: [], allow: []},
    });

    t.deepEquals(await listPolicies(), [pAdmin, pFoo, pBar]);

    await tstErr(removePolicy(), "TypeError: engine:removePolicy was given null instead of a policy_id string");
    t.equals(await removePolicy("id404"), false);

    t.equals(await removePolicy(pFoo.id), true);
    t.equals(await removePolicy(pFoo.id), false);
    t.deepEquals(await listPolicies(), [pAdmin, pBar]);

    await tstErr(removePolicy(pAdmin.id), "Error: Policy " + pAdmin.id +  " is in use, cannot remove.");

    t.equals(await removePolicy(pBar.id), true);
    t.deepEquals(await listPolicies(), [pAdmin]);
});


testPE("engine:newChannel, engine:listChannels, engine:removeChannel", async function (t, pe){
    var tstErr = _.partial(testError, t);

    var newPolicy = function(policy){
        return runAction(pe, {}, "engine", "newPolicy", [policy]);
    };
    var newChannel = function(ctx, args){
        return runAction(pe, ctx, "engine", "newChannel", args);
    };
    var removeChannel = function(ctx, args){
        return runAction(pe, ctx, "engine", "removeChannel", args);
    };
    var listChannels = await pe.modules.get({}, "engine", "listChannels");

    var mkChan = function(pico_id, eci, name, type, policy_id){
        return {
            pico_id: pico_id,
            id: eci,
            name: name,
            type: type,
            policy_id: policy_id || ADMIN_POLICY_ID,
            sovrin: {
                did: eci,
                verifyKey: "verifyKey_" + eci,
            },
        };
    };

    t.deepEquals(await listChannels({}, ["id0"]), [
        mkChan("id0", "id1", "admin", "secret"),
    ]);

    t.deepEquals(await newChannel({}, ["id0", "a", "b"]), mkChan("id0", "id2", "a", "b"));
    t.deepEquals(await listChannels({}, ["id0"]), [
        mkChan("id0", "id1", "admin", "secret"),
        mkChan("id0", "id2", "a", "b"),
    ]);

    await tstErr(
        newChannel({}, ["id1"]),
        "Error: engine:newChannel needs a name string",
        "no name is given"
    );
    await tstErr(
        newChannel({}, ["id1", "id1"]),
        "Error: engine:newChannel needs a type string",
        "no type is given"
    );

    await tstErr(
        removeChannel({}, ["id1"]),
        "Error: Cannot delete the pico's admin channel",
        "removeChannel shouldn't remove the admin channel"
    );
    await tstErr(
        removeChannel({}, []),
        "Error: engine:removeChannel needs an eci string",
        "no eci is given"
    );
    await tstErr(
        removeChannel({}, [/id1/]),
        "TypeError: engine:removeChannel was given re#id1# instead of an eci string",
        "wrong eci type"
    );
    t.equals(await removeChannel({}, ["eci404"]), false);

    t.equals(await removeChannel({}, ["id2"]), true);
    t.equals(await removeChannel({}, ["id2"]), false);
    t.deepEquals(await listChannels({}, ["id0"]), [
        mkChan("id0", "id1", "admin", "secret"),
    ]);

    //fallback on ctx.pico_id
    t.deepEquals(await listChannels({pico_id: "id0"}, []), [
        mkChan("id0", "id1", "admin", "secret"),
    ]);
    t.deepEquals(await newChannel({pico_id: "id0"}, {"name": "a", "type": "b"}), mkChan("id0", "id3", "a", "b"));

    //report error on invalid pico_id
    var assertInvalidPicoID = function(genfn, id, expected){
        return tstErr(genfn({pico_id: id}, {"name": "a", "type": "b"}), expected);
    };

    await assertInvalidPicoID(newChannel  , void 0, "TypeError: engine:newChannel was given null instead of a pico_id string");
    await assertInvalidPicoID(listChannels, void 0, "TypeError: engine:listChannels was given null instead of a pico_id string");

    await assertInvalidPicoID(newChannel  , "id404", "NotFoundError: Pico not found: id404");
    t.deepEquals(await listChannels({}, ["id404"]), void 0);


    //setting policy_id on a newChannel
    tstErr(newChannel({}, ["id0", "a", "b", 100]), "TypeError: engine:newChannel argument `policy_id` should be String but was Number");
    tstErr(newChannel({}, ["id0", "a", "b", "id404"]), "NotFoundError: Policy not found: id404");

    var pFoo = await newPolicy({name: "foo"});
    t.deepEquals(await newChannel({}, ["id0", "a", "b", pFoo.id]), mkChan("id0", "id5", "a", "b", pFoo.id));
});


testPE("engine:installRuleset, engine:listInstalledRIDs, engine:uninstallRuleset", async function (t, pe){
    var tstErr = _.partial(testError, t);

    var installRS = function(ctx, args){
        return runAction(pe, ctx, "engine", "installRuleset", args);
    };
    var uninstallRID = function(ctx, args){
        return runAction(pe, ctx, "engine", "uninstallRuleset", args);
    };
    var listRIDs = await pe.modules.get({}, "engine", "listInstalledRIDs");

    t.deepEquals(await listRIDs({pico_id: "id0"}, []), [
        "io.picolabs.engine",
    ]);

    t.equals(await installRS({}, ["id0", "io.picolabs.hello_world"]), "io.picolabs.hello_world");
    await tstErr(
        installRS({}, [NaN]),
        "Error: engine:installRuleset needs either a rid string or array, or a url string",
        "no rid or url is given"
    );
    await tstErr(
        installRS({}, ["id0", NaN, 0]),
        "TypeError: engine:installRuleset was given null instead of a rid string or array",
        "wrong rid type"
    );
    await tstErr(
        installRS({}, ["id0", [[]]]),
        "TypeError: engine:installRuleset was given a rid array containing a non-string ([Array])",
        "rid array has a non-string"
    );
    await tstErr(
        installRS({"pico_id": "id0"}, {"url": {}}),
        "TypeError: engine:installRuleset was given [Map] instead of a url string",
        "wrong url type"
    );
    t.deepEquals(await listRIDs({pico_id: "id0"}, []), [
        "io.picolabs.engine",
        "io.picolabs.hello_world",
    ]);

    t.equals(await uninstallRID({}, ["id0", "io.picolabs.engine"]), void 0);
    await tstErr(
        uninstallRID({}, []),
        "Error: engine:uninstallRuleset needs a rid string or array",
        "no rid is given"
    );
    await tstErr(
        uninstallRID({}, ["id0", void 0]),
        "TypeError: engine:uninstallRuleset was given null instead of a rid string or array",
        "wrong rid type"
    );
    await tstErr(
        uninstallRID({}, ["id0", ["null", null]]),
        "TypeError: engine:uninstallRuleset was given a rid array containing a non-string (null)",
        "rid array has a non-string"
    );
    t.deepEquals(await listRIDs({pico_id: "id0"}, []), [
        "io.picolabs.hello_world",
    ]);

    //fallback on ctx.pico_id
    t.equals(await uninstallRID({pico_id: "id0"}, {rid: "io.picolabs.hello_world"}), void 0);
    strictDeepEquals(t, await listRIDs({pico_id: "id0"}, []), []);
    t.equals(await installRS({pico_id: "id0"}, {rid: "io.picolabs.hello_world"}), "io.picolabs.hello_world");

    //report error on invalid pico_id
    var assertInvalidPicoID = function(genfn, id, expected){
        return tstErr(genfn({pico_id: id}, {rid: "io.picolabs.hello_world"}), expected);
    };

    await assertInvalidPicoID(listRIDs    , void 0, "TypeError: engine:listInstalledRIDs was given null instead of a pico_id string");

    await assertInvalidPicoID(installRS   , "id404", "NotFoundError: Pico not found: id404");
    await assertInvalidPicoID(uninstallRID, "id404", "NotFoundError: Pico not found: id404");
    t.deepEquals(await listRIDs({pico_id: "id404"}, []), void 0);

});

test("engine:signChannelMessage, engine:verifySignedMessage, engine:encryptChannelMessage, engine:decryptChannelMessage", function(t){
    (async function(){
        var pe = await (util.promisify(mkTestPicoEngine)({
            rootRIDs: ["io.picolabs.engine"],
            __dont_use_sequential_ids_for_testing: true,
        }));
        var getPicoIDByECI = await pe.modules.get({}, "engine", "getPicoIDByECI");
        var newChannel = await pe.modules.get({}, "engine", "newChannel");
        var signChannelMessage = await pe.modules.get({}, "engine", "signChannelMessage");
        var verifySignedMessage = await pe.modules.get({}, "engine", "verifySignedMessage");
        var encryptChannelMessage = await pe.modules.get({}, "engine", "encryptChannelMessage");
        var decryptChannelMessage = await pe.modules.get({}, "engine", "decryptChannelMessage");
        var sign = function(eci, message){
            return signChannelMessage({}, [eci, message]);
        };
        var verify = function(verifyKey, message){
            return verifySignedMessage({}, [verifyKey, message]);
        };
        var encrypt = function(eci, message, otherPublicKey){
            return encryptChannelMessage({}, [eci, message, otherPublicKey]);
        };
        var decrypt = function(eci, encryptedMessage, nonce, otherPublicKey){
            return decryptChannelMessage({}, [eci, encryptedMessage, nonce, otherPublicKey]);
        };

        var eci = await util.promisify(pe.getRootECI)();
        var pico_id = await getPicoIDByECI({}, [eci]);

        var chan0 = await newChannel({}, [pico_id, "one", "one"]);
        var eci0 = chan0[0].id;
        var vkey0 = chan0[0].sovrin.verifyKey;
        var publicKey0 = chan0[0].sovrin.encryptionPublicKey;

        var chan1 = await newChannel({}, [pico_id, "two", "two"]);
        var eci1 = chan1[0].id;
        var vkey1 = chan1[0].sovrin.verifyKey;
        var publicKey1 = chan1[0].sovrin.encryptionPublicKey;

        var msg = "some long message! could be json {\"hi\":1}";
        var signed0 = await sign(eci0, msg);
        var signed1 = await sign(eci1, msg);
        t.ok(_.isString(signed0));
        t.ok(_.isString(signed1));
        t.notEquals(signed0, signed1);

        t.equals(await verify(vkey0, signed0), msg);
        t.equals(await verify(vkey1, signed1), msg);

        t.equals(await verify(vkey1, signed0), false, "wrong vkey");
        t.equals(await verify(vkey0, signed1), false, "wrong vkey");

        t.equals(await verify("hi", signed1), false, "rubbish vkey");
        t.equals(await verify(vkey0, "notbs58:%=+!"), false, "not bs58 message");

        var encrypted0 = await encrypt(eci0, msg, publicKey1);
        var encrypted1 = await encrypt(eci1, msg, publicKey0);

        t.ok(_.isString(encrypted0.encryptedMessage));
        t.ok(_.isString(encrypted0.nonce));
        t.ok(_.isString(encrypted1.encryptedMessage));
        t.ok(_.isString(encrypted1.nonce));
        t.notEquals(encrypted0, encrypted1);

        var nonce = encrypted0.nonce;
        var encryptedMessage = encrypted0.encryptedMessage;

        t.equals(await decrypt(eci1, encryptedMessage, nonce, publicKey0), msg, "message decrypted correctly");

        t.equals(await decrypt(eci1, encryptedMessage, "bad nonce", publicKey0), false, "bad nonce");
        t.equals(await decrypt(eci1, encryptedMessage, nonce, "Bad public key"), false, "bad key");
        t.equals(await decrypt(eci1, "bogus43212(*(****", nonce, publicKey0), false, "non bs58 message");

    }()).then(t.end).catch(t.end);
});
