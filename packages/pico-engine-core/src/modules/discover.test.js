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

// TODO, create tests.
testPE("discover:addResource", function*(t, pe){
});
