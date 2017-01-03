var _ = require("lodash");
var test = require("tape");
var tokenizer = require("../src/tokenizer");

test("tokenizer", function(t){

  var tst = function(src, expected){
    var tokens = tokenizer(src);
    _.each(tokens, function(tok){
      //assert the loc is right
      t.equals(src.substring(tok.loc.start, tok.loc.end), tok.src);
    })
    t.deepEquals(_.map(tokens, function(tok){
      return "[" + tok.type + "]" + tok.src;
    }), expected);
  };

  tst("\"str\"", [
      "[string]\"str\""
  ]);
  tst("hello \"world\"\"two\"", [
      "[raw]hello",
      "[whitespace] ",
      "[string]\"world\"",
      "[string]\"two\""
  ]);
  tst("hello//some comment \"not a string\" ok\nok", [
      "[raw]hello",
      "[line-comment]//some comment \"not a string\" ok\n",
      "[raw]ok"
  ]);

  tst("hello/* /* wat? * // some comment\n \"not a string\" ok*/ok", [
      "[raw]hello",
      "[block-comment]/* /* wat? * // some comment\n \"not a string\" ok*/",
      "[raw]ok"
  ]);

  tst("<<some chevron\n\"?\"//string\nok?>>", [
      "[chevron]<<some chevron\n\"?\"//string\nok?>>",
  ]);

  tst("<<This #{x{\"flip\"}} that >\\> >>", [
      "[chevron]<<This #{x{\"flip\"}} that >\\> >>",
  ]);

  tst("<<This #{x{\"flip\"}} that >\\>>>", [
      "[chevron]<<This #{x{\"flip\"}} that >\\>>>",
  ]);

  tst("<<This /* wat */\n//ok\n>>", [
      "[chevron]<<This /* wat */\n//ok\n>>",
  ]);

  //NOTE a chevron in a beesting is not allowed.

  t.end();
});
