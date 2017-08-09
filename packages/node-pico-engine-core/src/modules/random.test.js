var test = require("tape");
var cocb = require("co-callback");
var ktypes = require("krl-stdlib/types");
var krandom = require("./random")().def;

var assertNumRange = function(n, low, high, should_be_int){
    if(ktypes.isNumber(n) && (n >= low) && (n <= high)){
        if(should_be_int && (n % 1 !== 0)){
            throw new Error("not an int: " + n);
        }
        return true;
    }
    throw new Error("invalid number range: " + low + " <= " + n + " <= " + high);
};

test("module - random:*", function(t){
    cocb.run(function*(){
        var i;
        for(i = 0; i < 5; i++){
            t.ok(/^c[^\s]+$/.test(yield krandom.uuid({}, [])));
            t.ok(/^[^\s]+$/.test(yield krandom.word({}, [])));

        }

        //just throwup when there is a fail, so we don't polute the tap log with 100s of asserts
        var n;
        for(i = 0; i < 100; i++){

            n = yield krandom.integer({}, []);
            assertNumRange(n, 0, 1, true);

            n = yield krandom.integer({}, [10]);
            assertNumRange(n, 0, 10, true);

            n = yield krandom.integer({}, [-3, 5]);
            assertNumRange(n, -3, 5, true);

            n = yield krandom.number({}, []);
            assertNumRange(n, 0, 1);

            n = yield krandom.number({}, [7]);
            assertNumRange(n, 0, 7);

            n = yield krandom.number({}, [-3, 5]);
            assertNumRange(n, -3, 5);

        }
        //if an assert hasn't thrown up by now, we're good
        t.ok(true, "random:integer passed");
        t.ok(true, "random:number passed");

    }, function(err){
        t.end(err);
    });
});
