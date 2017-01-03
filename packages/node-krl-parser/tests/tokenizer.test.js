var _ = require("lodash");
var test = require("tape");
var tokenizer = require("../src/tokenizer");

test("tokenizer", function(t){

  var tst = function(src, expected){
    t.deepEquals(_.map(tokenizer(src), function(tok){
      if(_.isString(tok)){
        return "[raw]" + tok;
      }
      return "[" + tok.type + "]" + tok.src;
    }), expected);
  };

  tst("hello \"world\"\"two\"", [
      "[raw]hello",
      "[whitespace] ",
      "[string]\"world\"",
      "[string]\"two\""
  ]);

  t.end();
});
