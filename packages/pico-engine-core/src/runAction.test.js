var _ = require("lodash");
var test = require("tape");
var cocb = require("co-callback");
var runAction = require("./runAction");

test("runAction - send_directive", function(t){
    var mkCtx = function(name, options){
        return {
            addActionResponse: function(ctx, type, val){
                t.equals(val.name, name);
                t.ok(_.isEqual(val.options, options));//to t.deepEqual, [] == {}
            },
            scope: {
                has: _.noop
            }
        };
    };

    var noopCtx = {
        addActionResponse: _.noop,
        scope: {
            has: _.noop
        }
    };

    var testFn = function*(args, name, options){
        var ctx = mkCtx(name, options);
        yield runAction(ctx, void 0, "send_directive", _.cloneDeep(args), []);
    };

    var testErr = function*(args, type){
        try{
            yield runAction(noopCtx, void 0, "send_directive", args, []);
            t.fail("Failed to throw an error");
        }catch(err){
            t.equals(err.name, type);
        }
    };

    var str = "post";
    var map = {"don't": "mutate"};

    cocb.run(function*(){
        yield testFn([str, map], str, map);
        yield testFn([str], str, {});
        yield testFn([str, null], str, {});
        yield testFn([map], void 0, map);
        yield testFn([map, map], "[Map]", map);
        yield testFn([[], map], "[Array]", map);
        yield testFn([map, str], str, map);

        yield testErr([str, "null"], "TypeError");
        yield testErr([str, []], "TypeError");
    }, t.end);
});