var test = require("tape");
var stdlib = require("./");

test("general operators", function(t){
  t.equals(stdlib.as(1, "String"), "1");
  t.end();
});
