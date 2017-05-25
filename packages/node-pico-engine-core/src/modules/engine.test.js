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

test("engine:removeChannel", function(t){
    cocb.run(function*(){
        var engine = kengine({
            db: {
                getPicoIDByECI: tick(function(eci, callback){
                    if(eci === "foo"){
                        return callback(null, "bar");
                    }
                    callback("NOT FOUND:" + eci);
                }),
                removeChannel: tick(function(pico_id, eci, callback){
                    if(pico_id === "bar" && eci === "foo"){
                        return callback();
                    }
                    callback("cannot removeChannel " + pico_id + "," + eci);
                })
            }
        });
        var rm = function*(eci){
            return yield engine.actions.removeChannel({}, {eci: eci,});
        };

        t.equals(yield rm("foo"), void 0);
        try{
            yield rm("quux");
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
                    rid: "REG:" + /\/([^\/]*)\.krl$/.exec(url)[1]
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

test("engine:describeRuleset", function(t){
    mkTestPicoEngine({}, function(err, pe){
        if(err) return t.end(err);

        cocb.run(function*(){
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
        }, t.end);
    });
});
