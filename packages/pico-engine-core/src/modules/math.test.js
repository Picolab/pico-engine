var test = require("tape");
var cocb = require("co-callback");
var kmath = require("./math")().def;

var testErr = require("../testErr");

test("module - math:*", function(t){
    cocb.run(function*(){
        var terr = testErr(t, kmath);

        t.equals(yield kmath.base64encode({}, ["}{"]), "fXs=", "base64encode");
        t.equals(yield kmath.base64encode({}, [null]), yield kmath.base64encode({}, ["null"]), "base64encode coreces to strings");

        yield terr("base64encode", {}, [], "Error: math:base64encode needs a str string");

        t.equals(yield kmath.base64decode({}, ["fXs="]), "}{", "base64decode");

        yield terr("base64decode", {}, [], "Error: math:base64decode needs a str string");

        t.ok(yield kmath.hashFunctions({}, []), "hashFunctions should return something");

        t.equals(
            yield kmath.hash({}, ["sha256", "hello"]),
            "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
            "sha256 \"hello\""
        );
        t.equals(
            yield kmath.hash({}, ["sha256", null]),
            yield kmath.hash({}, ["sha256", "null"]),
            "sha2 coerces inputs to Strings"
        );
        t.equals(
            yield kmath.hash({}, ["sha256", [1, 2]]),
            yield kmath.hash({}, ["sha256", "[Array]"]),
            "sha2 coerces inputs to Strings"
        );

        yield terr("hash", {}, [], "Error: math:hash needs a hashFn string");
        yield terr("hash", {}, [0], "Error: math:hash needs a toHash string");
        yield terr("hash", {}, [0, null], "TypeError: math:hash was given 0 instead of a hashFn string");
        yield terr("hash", {}, ["0", null], "Error: math:hash doesn't recognize the hash algorithm 0");

    }, t.end);
});