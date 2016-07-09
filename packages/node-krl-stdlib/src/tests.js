var _ = require("lodash");
var test = require("tape");
var stdlib = require("./");

var assertThrows = function(t, fn, args){
  try{
    fn.apply(null, args);
    t.fail();
  }catch(e){
    t.ok(true);
  }
};

var testFn = function(t, fn, args, expected, message){
  t.deepEquals(stdlib[fn].apply(null, args), expected, message);
};

test("general operators", function(t){

  t.equals(stdlib.as(1, "String"), "1");
  t.equals(stdlib.as(.32, "String"), "0.32");
  assertThrows(t, stdlib.as, [NaN, "String"]);
  t.equals(stdlib.as("-1.23", "Number"), -1.23);
  t.equals(stdlib.as("^a.*z$", "RegExp").source, /^a.*z$/.source);

  t.equals(stdlib.isnull(), true);
  t.equals(stdlib.isnull(void 0), true);
  t.equals(stdlib.isnull(null), true);
  t.equals(stdlib.isnull(NaN), true);
  t.equals(stdlib.isnull(false), false);
  t.equals(stdlib.isnull(0), false);
  t.equals(stdlib.isnull(""), false);
  t.equals(stdlib.isnull({}), false);

  t.ok(_.isFunction(stdlib.klog), "just checking that it's there");

  t.equals(stdlib["typeof"](""), "String");
  t.equals(stdlib["typeof"](0), "Number");
  t.equals(stdlib["typeof"](-.01), "Number");
  t.equals(stdlib["typeof"](10e10), "Number");
  t.equals(stdlib["typeof"](true), "Boolean");
  t.equals(stdlib["typeof"](false), "Boolean");
  t.equals(stdlib["typeof"](void 0), "Null");
  t.equals(stdlib["typeof"](null), "Null");
  t.equals(stdlib["typeof"](NaN), "Null");
  t.equals(stdlib["typeof"](/a/), "RegExp");
  t.equals(stdlib["typeof"]([]), "Array");
  t.equals(stdlib["typeof"]({}), "Map");

  t.end();
});

test("Number operators", function(t){
  var tf = _.partial(testFn, t);

  tf("chr", [74], "J");

  tf("range", [0, 0], [0]);
  tf("range", [0, 10], [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

  tf("sprintf", [.25, "That is %d"], "That is 0.25");

  t.end();
});

test("String operators", function(t){
  var tf = _.partial(testFn, t);

  tf("sprintf", ["Bob", "Hi %s!"], "Hi Bob!");

  tf("capitalize", ["lower"], "Lower");

  tf("decode", ["[1,2,3]"], [1, 2, 3]);

  tf("extract", ["3 + 2 - 1", /([0-9])/g], ["3", "2", "1"]);
  tf("extract", ["no-match", /([0-9])/g], null);

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

test("Collection operators", function(t){
  var tf = _.partial(testFn, t);

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

  _.each({
    "all":    [ true, false, false],
    "notall": [false,  true,  true],
    "any":    [ true,  true, false],
    "none":   [false, false,  true]
  }, function(expected, fn){
    tf(fn, [a, function(x){return x < 10;}], expected[0]);
    tf(fn, [a, function(x){return x >  3;}], expected[1]);
    tf(fn, [a, function(x){return x > 10;}], expected[2]);
    t.deepEquals(a, [3, 4, 5], "should not be mutated");
  });

  tf("append", [a, [6]], [3, 4, 5, 6]);
  t.deepEquals(a, [3, 4, 5], "should not be mutated");
  tf("append", [["a", "b"], ["c", "d"]], ["a", "b", "c", "d"]);
  tf("append", [["a", "b"], 10, 11], ["a", "b", 10, 11]);
  tf("append", [10, 11], [10, 11]);

  tf("collect", [[7, 4, 3, 5, 2, 1, 6], function(a){
    return (a < 5) ? "x" : "y";
  }], {
    "x": [4,3,2,1],
    "y": [7,5,6]
  });

  tf("filter", [a, function(x){return x < 5;}], [3, 4]);
  tf("filter", [a, function(x){return x !== 4;}], [3, 5]);
  t.deepEquals(a, [3, 4, 5], "should not be mutated");
  tf("filter", [obj2, function(v, k){return v < 3;}], {"a":1,"b":2});
  tf("filter", [obj2, function(v, k){return k === "b";}], {"b":2});
  assertObjNotMutated();

  tf("head", [a], 3);
  t.deepEquals(a, [3, 4, 5], "should not be mutated");
  tf("head", [[]], void 0);

  tf("tail", [a], [4, 5]);
  t.deepEquals(a, [3, 4, 5], "should not be mutated");
  tf("tail", [[]], []);

  tf("join", [a, ";"], "3;4;5");
  t.deepEquals(a, [3, 4, 5], "should not be mutated");

  tf("length", [a], 3);

  tf("map", [a, function(x){return x + 2;}], [5, 6, 7]);
  t.deepEquals(a, [3, 4, 5], "should not be mutated");
  tf("map", [obj2, function(x){return x + 2;}], {"a":3,"b":4,"c":5});
  assertObjNotMutated();

  tf("pairwise", [a, [6, 7, 8], function(x, y){return x + y;}], [9, 11, 13]);
  t.deepEquals(a, [3, 4, 5], "should not be mutated");

  tf("reduce", [a, function(a,b){return a+b;}], 12);
  tf("reduce", [a, function(a,b){return a+b;}, 10], 22);
  tf("reduce", [a, function(a,b){return a-b;}], -6);
  t.deepEquals(a, [3, 4, 5], "should not be mutated");
  tf("reduce", [[], function(a,b){return a+b;}], 0);
  tf("reduce", [[], function(a,b){return a+b;}, 15], 15);
  tf("reduce", [[76], function(a,b){return a+b;}], 76);
  tf("reduce", [[76], function(a,b){return a+b;}, 15], 91);

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
  tf("sort", [to_sort], [1, 12, 3, 4, 5]);
  tf("sort", [to_sort, "reverse"], [5, 4, 3, 12, 1]);
  tf("sort", [to_sort, "numeric"], [1, 3, 4, 5, 12]);
  tf("sort", [to_sort, "ciremun"], [12, 5, 4, 3, 1]);
  tf("sort", [to_sort, function(a, b){
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

  tf("put", [obj, ["foo"], {baz: "qux"}], {
    "colors": "many",
    "pi": [3, 1, 4, 1, 5, 6, 9],
    "foo": {
      "bar": {"10": "I like cheese"},
      "baz": "qux"
    }
  });
  tf("put", [obj, {flop: 12}], {
    "colors": "many",
    "pi": [3, 1, 4, 1, 5, 6, 9],
    "foo": {"bar": {"10": "I like cheese"}},
    "flop": 12
  });
  assertObjNotMutated();

  tf("intersection", [[2, 1], [2, 3]], [2]);

  tf("union", [[2], [1, 2]], [2, 1]);
  tf("union", [[1, 2], [1, 4]], [1, 2, 4]);

  tf("difference", [[2, 1], [2, 3]], [1]);

  tf("has", [[1, 2, 3, 4], [4, 2]], true);
  tf("has", [[1, 2, 3, 4], [4, 5]], false);

  tf("once", [[1, 2, 1, 3, 4, 4]], [2, 3]);

  tf("duplicates", [[1, 2, 1, 3, 4, 4]], [1, 4]);

  tf("unique", [[1, 2, 1, 3, 4, 4]], [1, 2, 3, 4]);

  t.end();
});
