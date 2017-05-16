var _ = require("lodash");
var test = require("tape");
var cocb = require("co-callback");
var kengine = require("./engine");

var mockEngine = function(core){
    return kengine(core).def;
};

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
