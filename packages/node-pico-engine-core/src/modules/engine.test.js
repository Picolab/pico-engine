var _ = require("lodash");
var test = require("tape");
var cocb = require("co-callback");
var kengine = require("./engine");

var mockEngine = function(core){
    return kengine(core).def;
};

test("engine:getPicoIDByECI", function(t){
    cocb.run(function*(){
        var engine = mockEngine({
            db: {
                getPicoIDByECI: function(eci, callback){
                    process.nextTick(function(){
                        if(eci === "foo"){
                            return callback(null, "bar");
                        }else if(eci === "baz"){
                            return callback(null, "qux");
                        }
                        callback("NOT FOUND:" + eci);
                    });
                }
            }
        });
        var get = function*(eci){
            return yield engine.getPicoIDByECI({}, {eci: eci,});
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
        var engine = mockEngine({
            db: {
                getPicoIDByECI: function(eci, callback){
                    process.nextTick(function(){
                        if(eci === "foo"){
                            return callback(null, "bar");
                        }
                        callback("NOT FOUND:" + eci);
                    });
                },
                removeChannel: function(pico_id, eci, callback){
                    process.nextTick(function(){
                        if(pico_id === "bar" && eci === "foo"){
                            return callback();
                        }
                        callback("cannot removeChannel " + pico_id + "," + eci);
                    });
                }
            }
        });
        var rm = function*(eci){
            return yield engine.removeChannel({}, {eci: eci,});
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

        var engine = mockEngine({
            registerRulesetURL: function(url, callback){
                process.nextTick(function(){
                    callback(null, {
                        rid: "rid for: " + url
                    });
                });
            }
        });

        t.equals(yield engine.registerRuleset({}, {
            url: "http://foo.bar/qux.krl",
        }), "rid for: http://foo.bar/qux.krl");

        t.equals(yield engine.registerRuleset({}, {
            url: "qux.krl",
            base: "https://foo.bar/baz/",
        }), "rid for: https://foo.bar/baz/qux.krl");

        try{
            yield engine.registerRuleset({}, []);
            t.fail("should throw b/c no url is given");
        }catch(err){
            t.equals(err + "", "Error: registerRuleset expects `url`");
        }

    }, t.end);
});

test("engine:uninstallRuleset", function(t){
    cocb.run(function*(){

        var uninstalled = {};
        var order = 0;

        var engine = mockEngine({
            uninstallRuleset: function(id, rid, callback){
                if(id !== "pico0"){
                    return callback(new Error("invalid pico_id"));
                }
                if(!_.isString(rid)){
                    return callback(new Error("invalid rid"));
                }
                process.nextTick(function(){
                    _.set(uninstalled, [id, rid], order++);
                    callback();
                });
            }
        });

        t.equals(yield engine.uninstallRuleset({}, {
            pico_id: "pico0",
            rid: "foo.bar",
        }), void 0);

        t.equals(yield engine.uninstallRuleset({}, {
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
