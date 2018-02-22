var test = require("tape");
var cocb = require("co-callback");
var mkTestPicoEngine = require("../mkTestPicoEngine");


var testPE = function(test_name, genfn){
    test(test_name, function(t){
        mkTestPicoEngine({}, function(err, pe){
            if(err) return t.end(err);

            cocb.run(function*(){
                yield genfn(t, pe);
            }, t.end);
        });
    });
};


testPE("schedule:remove", function*(t, pe){

    var remove = yield pe.modules.get({}, "schedule", "remove");

    var val = yield pe.scheduleEventAtYieldable(new Date(), {
        domain: "d",
        type: "t",
        attributes: {},
    });

    t.deepEquals(yield remove({}, [val.id]), [true]);
    t.deepEquals(yield remove({}, ["404"]), [false]);
});
