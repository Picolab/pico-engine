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

  testFn(t, "chr", [74], "J");

  testFn(t, "range", [0, 0], [0]);
  testFn(t, "range", [0, 10], [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

  testFn(t, "sprintf", [.25, "That is %d"], "That is 0.25");

  t.end();
});
