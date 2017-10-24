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

    var testErr = function*(args, error){
        try{
            yield runAction(noopCtx, void 0, "send_directive", args, []);
            t.fail("Failed to throw an error");
        }catch(err){
            t.equals(err + "", error);
        }
    };

    var str = "post";
    var map = {"don't": "mutate"};

    var errMsg1 = "Error: send_directive needs a name string";
    var errMsg2 = "TypeError: send_directive was given [Map] instead of a name string";

    cocb.run(function*(){
        yield testFn([str, map], str, map);
        yield testFn([str], str, {});

        yield testErr([], errMsg1);
        yield testErr({"options": null}, errMsg1);
        yield testErr([map], errMsg2);
        yield testErr([map, map], errMsg2);
        yield testErr([map, str], errMsg2);
        yield testErr([str, void 0], "TypeError: send_directive was given null instead of an options map");
        yield testErr([str, []], "TypeError: send_directive was given [Array] instead of an options map");
    }, t.end);
});