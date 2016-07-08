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
