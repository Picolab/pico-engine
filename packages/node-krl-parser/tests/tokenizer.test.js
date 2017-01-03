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

  tst("123", [
      "[number]123",
  ]);
  tst(".1", [
      "[number].1",
  ]);
  tst("10.25", [
      "[number]10.25",
  ]);
  tst("10.25.25", [
      "[number]10.25",
      "[number].25",
  ]);
  tst("0.0", [
      "[number]0.0",
  ]);


  tst("re#regex#", [
      "[regexp]re#regex#",
  ]);
  tst("re#regex#iok", [
      "[regexp]re#regex#i",
      "[raw]ok",
  ]);
  tst("re#regex#gok", [
      "[regexp]re#regex#g",
      "[raw]ok",
  ]);
  tst("re#regex#igok", [
      "[regexp]re#regex#ig",
      "[raw]ok",
  ]);
  tst("re#regex#giok", [
      "[regexp]re#regex#gi",
      "[raw]ok",
  ]);


  t.end();
});
