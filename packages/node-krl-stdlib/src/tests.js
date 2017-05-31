var _ = require("lodash");
var cocb = require("co-callback");
var test = require("tape");
var stdlib = require("./");

var ylibFn = function(fn_name, args){
    args = [defaultCTX].concat(args);
    var fn = stdlib[fn_name];
    if(cocb.isGeneratorFunction(fn)){
        return cocb.promiseRun(function*(){
            return yield fn.apply(void 0, args);
        });
    }
    return new Promise(function(resolve, reject){
        try{
            resolve(fn.apply(void 0, args));
        }catch(err){
            reject(err);
        }
    });
};

var defaultCTX = {
    emit: _.noop
};

var testFn = function(t, fn, args, expected, message){
    //wrap lambdas as KRL Closures
    args = _.map(args, function(arg){
        if(_.isFunction(arg)){
            return function(ctx, args){
                return arg.apply(this, args);
            };
        }
        return arg;
    });
    t.deepEquals(stdlib[fn].apply(null, [defaultCTX].concat(args)), expected, message);
};

var mkTf = function(t){
    return function*(fn, args, expected, message){
        args = _.map(args, function(arg){
            if(cocb.isGeneratorFunction(arg)){
                return function*(ctx, args){
                    return yield arg.apply(this, args);
                };
            }else if(_.isFunction(arg)){
                return cocb.toYieldable(function(ctx, args, callback){
                    var data;
                    try{
                        data = arg.apply(this, args);
                    }catch(err){
                        callback(err);
                        return;
                    }
                    callback(null, data);
                });
            }
            return arg;
        });
        t.deepEquals(
            yield ylibFn(fn, args),
            expected,
            message
        );
    };
};

var ytest = function(msg, body){
    test(msg, function(t){
        var tf = _.partial(testFn, t);
        var ytf = mkTf(t);
        cocb.run(body(t, ytf, tf), t.end);
    });
};


test("infix operators", function(t){
    var tf = _.partial(testFn, t);

    tf("+", [1], 1);
    tf("+", [-1], -1);
    tf("+", [1, 2], 3);
    tf("+", [2.3, .1], 2.4);
    tf("+", [1, null], 1, "+ null is like + 0");
    tf("+", [null, 1], 1, "+ null is like + 0");
    tf("+", [1, false], 1, "+ false is like + 0");
    tf("+", [false, 1], 1, "+ false is like + 0");

    //concat +
    tf("+", [_.noop, "foo"], "[Function]foo");
    tf("+", [1, true], "1true");
    tf("+", ["wat", 100], "wat100");
    tf("+", [{}, []], "[Map][Array]");

    tf("-", [1, 3], -2);
    tf("-", [4, 1], 3);
    tf("-", [2], -2);

    tf("<", [1, 3], true);
    tf("<", [3, 1], false);

    tf("*", [5, 2], 10);
    tf("/", [4, 2], 2);
    tf("%", [4, 2], 0);

    tf("==", [2, 2], true);
    tf("==", ["abc", "def"], false);
    tf("==", ["abc", "abc"], true);
    tf("==", [null, NaN], true);
    tf("==", [NaN, undefined], true);
    tf("==", [null, undefined], true);
    tf("==", [NaN, NaN], true);

    tf("!=", [1, 2], true);
    tf("!=", [1, 1], false);
    tf("!=", [1, NaN], true);
    tf("!=", [null, NaN], false);

    t.end();
});

test("type operators", function(t){

    var tf = _.partial(testFn, t);

    tf("as", [1, "String"], "1");
    tf("as", [.32, "String"], "0.32");
    tf("as", [0, "String"], "0");
    tf("as", [null, "String"], "null");
    tf("as", [void 0, "String"], "null");
    tf("as", [NaN, "String"], "null");
    tf("as", [true, "String"], "true");
    tf("as", [false, "String"], "false");
    tf("as", ["str", "String"], "str");
    tf("as", [/^a.*b/, "String"], "re#^a.*b#");
    tf("as", [/^a.*b/gi, "String"], "re#^a.*b#gi");
    tf("as", [_.noop, "String"], "[Function]");
    tf("as", [[1,2], "String"], "[Array]");
    tf("as", [{}, "String"], "[Map]");
    tf("as", [arguments, "String"], "[JSObject]");

    tf("as", ["-1.23", "Number"], -1.23);
    tf("as", [42, "Number"], 42);
    tf("as", [true, "Number"], 1);
    tf("as", [false, "Number"], 0);
    tf("as", [null, "Number"], 0);
    tf("as", [NaN, "Number"], 0);
    tf("as", [void 0, "Number"], 0);
    tf("as", ["foo", "Number"], null);

    t.equals(stdlib.as(defaultCTX, "^a.*z$", "RegExp").source, /^a.*z$/.source);
    var test_regex = /^a.*z$/;
    tf("as", [test_regex, "RegExp"], test_regex);
    tf("as", ["true", "Boolean"], true);
    tf("as", ["false", "Boolean"], false);
    tf("as", [0, "Boolean"], false);

    tf("isnull", [], true);
    tf("isnull", [void 0], true);
    tf("isnull", [null], true);
    tf("isnull", [NaN], true);
    tf("isnull", [false], false);
    tf("isnull", [0], false);
    tf("isnull", [""], false);
    tf("isnull", [{}], false);

    tf("typeof", [""], "String");
    tf("typeof", [0], "Number");
    tf("typeof", [-.01], "Number");
    tf("typeof", [10e10], "Number");
    tf("typeof", [true], "Boolean");
    tf("typeof", [false], "Boolean");
    tf("typeof", [void 0], "Null");
    tf("typeof", [null], "Null");
    tf("typeof", [NaN], "Null");
    tf("typeof", [/a/], "RegExp");
    tf("typeof", [[]], "Array");
    tf("typeof", [{}], "Map");
    tf("typeof", [_.noop], "Function");
    tf("typeof", [arguments], "JSObject");

    t.end();
});

test("number operators", function(t){
    var tf = _.partial(testFn, t);

    tf("chr", [74], "J");

    tf("range", [0, 0], [0]);
    tf("range", [0, 10], [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

    tf("sprintf", [.25, "That is %d"], "That is 0.25");

    t.end();
});

test("string operators", function(t){
    var tf = _.partial(testFn, t);

    tf("sprintf", ["Bob", "Hi %s!"], "Hi Bob!");

    tf("capitalize", ["lower"], "Lower");

    tf("decode", ["[1,2,3]"], [1, 2, 3]);
    tf("decode", [[1,2,3]], [1, 2, 3], "if not a string, just return it");
    tf("decode", [void 0], void 0, "if not a string, just return it");
    tf("decode", ["[1,2"], "[1,2", "if parse fails, just return it");
    tf("decode", ["[1 2]"], "[1 2]", "if parse fails, just return it");

    tf("extract", ["3 + 2 - 1", /([0-9])/g], ["3", "2", "1"]);
    tf("extract", ["no-match", /([0-9])/g], []);
    tf("extract", ["This is a string", /(is)/], ["is"]);
    tf("extract", ["This is a string", /(s.+).*(.ing)/], ["s is a st", "ring"]);
    tf("extract", ["This is a string", /(boot)/], []);
    tf("extract", ["I like cheese", /like (\w+)/], ["cheese"]);
    tf("extract", ["I like cheese", /(e)/g], ["e", "e", "e", "e"]);

    tf("lc", ["UppER"], "upper");

    tf("match", ["3 + 2 - 1", /([0-9])/g], true);
    tf("match", ["no-match", /([0-9])/g], false);

    tf("ord", [""], void 0);
    tf("ord", ["a"], 97);
    tf("ord", ["bill"], 98);

    tf("replace", ["William", /W/, "B"], "Billiam");

    tf("split", ["a;b;3;4;", /;/], ["a", "b", "3", "4", ""]);

    tf("substr", ["This is a string", 5], "is a string");
    tf("substr", ["This is a string", 5, 4], "is a");
    tf("substr", ["This is a string", 5, -5], "is a s");
    tf("substr", ["This is a string", 25], void 0);

    tf("uc", ["loWer"], "LOWER");

    t.end();
});

ytest("collection operators", function*(t, ytf, tf){
    var a = [3, 4, 5];

    var obj = {
        "colors": "many",
        "pi": [3, 1, 4, 1, 5, 6, 9],
        "foo": {"bar": {"10": "I like cheese"}}
    };
    var obj2 = {"a": 1, "b": 2, "c": 3};
    var assertObjNotMutated = function(){
        t.deepEquals(obj, {
            "colors": "many",
            "pi": [3, 1, 4, 1, 5, 6, 9],
            "foo": {"bar": {"10": "I like cheese"}}
        }, "should not be mutated");
        t.deepEquals(obj2, {"a": 1, "b": 2, "c": 3}, "should not be mutated");
    };

    tf("><", [obj, "pi"], true);
    tf("><", [obj, "a"], false);
    assertObjNotMutated();
    tf("><", [[5, 6, 7], 6], true);
    tf("><", [[5, 6, 7], 3], false);
    tf("><", [{a: 1, b: 2}, "a"], true);
    tf("><", [{a: 1, b: 2}, "foo"], false);

    var exp = [
        ["all",     true, false, false],
        ["notall", false,  true,  true],
        ["any",     true,  true, false],
        ["none",   false, false,  true]
    ];
    var i;
    for(i=0; i < exp.length; i++){
        yield ytf(exp[i][0], [a, function(x){return x < 10;}], exp[i][1]);
        yield ytf(exp[i][0], [a, function(x){return x >  3;}], exp[i][2]);
        yield ytf(exp[i][0], [a, function(x){return x > 10;}], exp[i][3]);
        t.deepEquals(a, [3, 4, 5], "should not be mutated");
    }

    tf("append", [a, [6]], [3, 4, 5, 6]);
    t.deepEquals(a, [3, 4, 5], "should not be mutated");
    tf("append", [["a", "b"], ["c", "d"]], ["a", "b", "c", "d"]);
    tf("append", [["a", "b"], 10, 11], ["a", "b", 10, 11]);
    tf("append", [10, 11], [10, 11]);

    yield ytf("collect", [[7, 4, 3, 5, 2, 1, 6], function(a){
        return (a < 5) ? "x" : "y";
    }], {
        "x": [4,3,2,1],
        "y": [7,5,6]
    });

    yield ytf("filter", [a, function(x){return x < 5;}], [3, 4]);
    yield ytf("filter", [a, function(x){return x !== 4;}], [3, 5]);
    t.deepEquals(a, [3, 4, 5], "should not be mutated");
    yield ytf("filter", [obj2, function(v, k){return v < 3;}], {"a":1,"b":2});
    yield ytf("filter", [obj2, function(v, k){return k === "b";}], {"b":2});
    assertObjNotMutated();

    tf("head", [a], 3);
    t.deepEquals(a, [3, 4, 5], "should not be mutated");
    tf("head", [[]], void 0);

    tf("tail", [a], [4, 5]);
    t.deepEquals(a, [3, 4, 5], "should not be mutated");
    tf("tail", [[]], []);

    tf("index", [a, 5], 2);
    t.deepEquals(a, [3, 4, 5], "should not be mutated");

    tf("join", [a, ";"], "3;4;5");
    t.deepEquals(a, [3, 4, 5], "should not be mutated");

    tf("length", [a], 3);

    yield ytf("map", [a, function(x){return x + 2;}], [5, 6, 7]);
    t.deepEquals(a, [3, 4, 5], "should not be mutated");
    yield ytf("map", [obj2, function(x){return x + 2;}], {"a":3,"b":4,"c":5});
    assertObjNotMutated();

    yield ytf("pairwise", [a, [6, 7, 8], function(x, y){return x + y;}], [9, 11, 13]);
    yield ytf("pairwise", [a, "abcdef".split(""), function(x, y){return x + y;}], [
        "3a",
        "4b",
        "5c",
        "undefinedd",
        "undefinede",
        "undefinedf",
    ]);
    t.deepEquals(a, [3, 4, 5], "should not be mutated");

    yield ytf("reduce", [a, function(a,b){return a+b;}], 12);
    yield ytf("reduce", [a, function(a,b){return a+b;}, 10], 22);
    yield ytf("reduce", [a, function(a,b){return a-b;}], -6);
    t.deepEquals(a, [3, 4, 5], "should not be mutated");
    yield ytf("reduce", [[], function(a,b){return a+b;}], 0);
    yield ytf("reduce", [[], function(a,b){return a+b;}, 15], 15);
    yield ytf("reduce", [[76], function(a,b){return a+b;}], 76);
    yield ytf("reduce", [[76], function(a,b){return a+b;}, 15], 91);

    tf("reverse", [a], [5, 4, 3]);
    t.deepEquals(a, [3, 4, 5], "should not be mutated");

    var vegies = ["corn","tomato","tomato","tomato","sprouts","lettuce","sprouts"];
    tf("slice", [vegies, 1, 4], ["tomato","tomato","tomato","sprouts"]);
    tf("slice", [vegies, 2], ["corn","tomato","tomato"]);
    tf("slice", [vegies, 14], void 0);
    tf("slice", [vegies, 0, 0], ["corn"]);

    tf("splice", [vegies, 1, 4], ["corn","lettuce","sprouts"]);
    tf("splice", [vegies, 2, 0, ["corn", "tomato"]], ["corn","tomato","corn","tomato","tomato","tomato","sprouts","lettuce","sprouts"]);
    tf("splice", [vegies, 2, 0, "liver"], ["corn","tomato","liver","tomato","tomato","sprouts","lettuce","sprouts"]);
    tf("splice", [vegies, 2, 2, "liver"], ["corn","tomato","liver","sprouts","lettuce","sprouts"]);
    tf("splice", [vegies, 1, 10], ["corn"]);
    tf("splice", [vegies, 1, 10, "liver"], ["corn", "liver"]);
    t.deepEquals(vegies, ["corn","tomato","tomato","tomato","sprouts","lettuce","sprouts"], "should not be mutated");

    var to_sort = [5, 3, 4, 1, 12];
    yield ytf("sort", [to_sort], [1, 12, 3, 4, 5]);
    yield ytf("sort", [to_sort, "reverse"], [5, 4, 3, 12, 1]);
    yield ytf("sort", [to_sort, "numeric"], [1, 3, 4, 5, 12]);
    yield ytf("sort", [to_sort, "ciremun"], [12, 5, 4, 3, 1]);
    yield ytf("sort", [to_sort, function(a, b){
        return a < b ? -1 : (a == b ? 0 : 1);
    }], [1, 3, 4, 5, 12]);
    t.deepEquals(to_sort, [5, 3, 4, 1, 12], "should not be mutated");

    tf("delete", [obj, ["foo", "bar", 10]], {
        "colors": "many",
        "pi": [3, 1, 4, 1, 5, 6, 9],
        "foo": {"bar": {}}//or "foo": {} ???
    });
    assertObjNotMutated();

    tf("encode", [{blah: 1}], "{\"blah\":1}");
    tf("encode", [[1, 2]], "[1,2]");

    tf("keys", [obj], ["colors", "pi", "foo"]);
    tf("keys", [obj, ["foo", "bar"]], ["10"]);
    assertObjNotMutated();

    tf("values", [obj], [
        "many",
        [3, 1, 4, 1, 5, 6, 9],
        {"bar": {"10": "I like cheese"}}
    ]);
    tf("values", [obj, ["foo", "bar"]], ["I like cheese"]);
    assertObjNotMutated();

    tf("put", [{key: 5}, {foo: "bar"}], {key: 5, foo: "bar"});
    tf("put", [{key: 5}, [], {foo: "bar"}], {key: 5, foo: "bar"});
    tf("put", [{key: 5}, ["baz"], {foo: "bar"}], {key: 5, baz: {foo: "bar"}});
    tf("put", [{key: 5}, ["qux"], "wat?"], {key: 5, qux: "wat?"});
    tf("put", [{key: 5}, [null], "wat?"], {key: 5, "null": "wat?"});
    tf("put", [{key: 5}, [void 0], "wat?"], {key: 5, "null": "wat?"});
    tf("put", [{key: 5}, [void 0], "wat?"], {key: 5, "null": "wat?"});
    tf("put", [{key: 5}, [NaN], "wat?"], {key: 5, "null": "wat?"});
    tf("put", [{key: 5}, [_.noop], "wat?"], {key: 5, "[Function]": "wat?"});

    tf("put", [obj, ["foo"], {baz: "qux"}], {
        "colors": "many",
        "pi": [3, 1, 4, 1, 5, 6, 9],
        "foo": {
            "bar": {"10": "I like cheese"},
            "baz": "qux"
        }
    });
    tf("put", [obj, ["foo", "bar", 11], "wat?"], {
        "colors": "many",
        "pi": [3, 1, 4, 1, 5, 6, 9],
        "foo": {
            "bar": {
                "10": "I like cheese",
                "11": "wat?",
            },
        }
    });
    tf("put", [obj, ["foo", "bar", 10], "no cheese"], {
        "colors": "many",
        "pi": [3, 1, 4, 1, 5, 6, 9],
        "foo": {
            "bar": {"10": "no cheese"},
        }
    });
    tf("put", [obj, {flop: 12}], {
        "colors": "many",
        "pi": [3, 1, 4, 1, 5, 6, 9],
        "foo": {"bar": {"10": "I like cheese"}},
        "flop": 12
    });
    assertObjNotMutated();
    tf("put", [{}, ["key1"], "value2"], {key1: "value2"});
    tf("put", [{}, [], {key2: "value3"}], {key2: "value3"});
    tf("put", [{key: 5}, "foo", {key2: "value3"}], {key: 5, "foo": {key2: "value3"}});
    tf("put", [{key: 5}, "key", 7], {key: 7});
    tf("put", [{key: 5}, ["key"], 9], {key: 9});

    tf("get", [obj, ["foo", "bar", "10"]], "I like cheese");
    tf("get", [obj, "colors"], "many");
    assertObjNotMutated();

    tf("set", [obj, ["foo", "baz"], "qux"], {
        "colors": "many",
        "pi": [3, 1, 4, 1, 5, 6, 9],
        "foo": {
            "bar": {"10": "I like cheese"},
            "baz": "qux"
        }
    });
    tf("set", [obj, "flop", 12], {
        "colors": "many",
        "pi": [3, 1, 4, 1, 5, 6, 9],
        "foo": {
            "bar": {"10": "I like cheese"}
        },
        "flop": 12
    });
    tf("set", [obj, "colors", ["R", "G", "B"]], {
        "colors": ["R", "G", "B"],
        "pi": [3, 1, 4, 1, 5, 6, 9],
        "foo": {
            "bar": {"10": "I like cheese"}
        }
    });
    tf("set", [obj, ["foo", "bar", "10"], "modified a sub object"], {
        "colors": "many",
        "pi": [3, 1, 4, 1, 5, 6, 9],
        "foo": {
            "bar": {"10": "modified a sub object"}
        }
    });
    assertObjNotMutated();

    tf("intersection", [[2, 1], [2, 3]], [2]);

    tf("union", [[2], [1, 2]], [2, 1]);
    tf("union", [[1, 2], [1, 4]], [1, 2, 4]);
    tf("union", [[{"x":2}], [{"x":1}, {"x":2}]], [{"x":2}, {"x":1}]);

    tf("difference", [[2, 1], [2, 3]], [1]);
    tf("difference", [[{"x":2}, {"x":1}], [{"x":2}, {"x":3}]], [{"x":1}]);

    tf("has", [[1, 2, 3, 4], [4, 2]], true);
    tf("has", [[1, 2, 3, 4], [4, 5]], false);

    tf("once", [[1, 2, 1, 3, 4, 4]], [2, 3]);

    tf("duplicates", [[1, 2, 1, 3, 4, 4]], [1, 4]);

    tf("unique", [[1, 2, 1, 3, 4, 4]], [1, 2, 3, 4]);
});

test("random functions", function(t){
    t.ok(_.isString(stdlib.randomWord(defaultCTX)));
    t.notEquals(stdlib.randomWord(defaultCTX),stdlib.randomWord(defaultCTX));
    t.ok(_.isString(stdlib.uuid(defaultCTX)));
    t.notEquals(stdlib.uuid(defaultCTX),stdlib.uuid(defaultCTX));
    t.end();
});

test("klog", function(t){
    t.plan(3);
    stdlib.klog({
        emit: function(kind, val, message){
            t.equals(kind, "klog");
            t.equals(val, 42);
            t.equals(message, "message 1");
        }
    }, 42, "message 1");
});

test("defaultsTo - testing debug logging", function(t){
    t.plan(5);
    var ctx = {
        emit: function(kind, message){
            t.equals(kind, "debug");
            t.equals(message,"[DEFAULTSTO] message 2");
        }
    };

    t.equals(stdlib.defaultsTo(ctx, "not needed", 42, "message 2"), "not needed");
    t.equals(stdlib.defaultsTo(ctx, null, 42), 42, "no message to log");
    t.equals(stdlib.defaultsTo(ctx, null, 42, "message 2"), 42, "should emit debug");
});
