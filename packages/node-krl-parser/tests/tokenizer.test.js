var _ = require("lodash");
var test = require("tape");
var tokenizer = require("../src/tokenizer");

test("tokenizer", function(t){

    var tst = function(src, expected){
        var tokens = tokenizer(src);
        _.each(tokens, function(tok){
            //assert the loc is right
            t.equals(src.substring(tok.loc.start, tok.loc.end), tok.src);
        });
        t.deepEquals(_.map(tokens, function(tok){
            return "[" + tok.type + "]" + tok.src;
        }), expected);
    };

    tst("\"\"", [
        "[STRING]\"\""
    ]);
    tst("\"str\"", [
        "[STRING]\"str\""
    ]);
    tst("hello \"world\"\"two\"", [
        "[SYMBOL]hello",
        "[WHITESPACE] ",
        "[STRING]\"world\"",
        "[STRING]\"two\""
    ]);
    tst("hello//some comment \"not a string\" ok\nok", [
        "[SYMBOL]hello",
        "[LINE-COMMENT]//some comment \"not a string\" ok\n",
        "[SYMBOL]ok"
    ]);

    tst("hello/* /* wat? * // some comment\n \"not a string\" ok*/ok", [
        "[SYMBOL]hello",
        "[BLOCK-COMMENT]/* /* wat? * // some comment\n \"not a string\" ok*/",
        "[SYMBOL]ok"
    ]);
    tst("1; //some comment\n2/*annother comment*/;3", [
        "[NUMBER]1",
        "[RAW];",
        "[WHITESPACE] ",
        "[LINE-COMMENT]//some comment\n",
        "[NUMBER]2",
        "[BLOCK-COMMENT]/*annother comment*/",
        "[RAW];",
        "[NUMBER]3"
    ]);

    tst("<<some chevron\n\"?\"//string\nok?>>ok", [
        "[CHEVRON-OPEN]<<",
        "[CHEVRON-STRING]some chevron\n\"?\"//string\nok?",
        "[CHEVRON-CLOSE]>>",
        "[SYMBOL]ok",
    ]);

    tst("<<This #{\"is\"} a beesting>>", [
        "[CHEVRON-OPEN]<<",
        "[CHEVRON-STRING]This ",
        "[CHEVRON-BEESTING-OPEN]#{",
        "[STRING]\"is\"",
        "[CHEVRON-BEESTING-CLOSE]}",
        "[CHEVRON-STRING] a beesting",
        "[CHEVRON-CLOSE]>>",
    ]);

    tst("<<This #{x{\"flip\"}} that >\\> >>", [
        "[CHEVRON-OPEN]<<",
        "[CHEVRON-STRING]This ",
        "[CHEVRON-BEESTING-OPEN]#{",
        "[SYMBOL]x",
        "[RAW]{",
        "[STRING]\"flip\"",
        "[RAW]}",
        "[CHEVRON-BEESTING-CLOSE]}",
        "[CHEVRON-STRING] that >\\> ",
        "[CHEVRON-CLOSE]>>",
    ]);

    tst("<<This #{x{\"flip\"}} that >\\>>>", [
        "[CHEVRON-OPEN]<<",
        "[CHEVRON-STRING]This ",
        "[CHEVRON-BEESTING-OPEN]#{",
        "[SYMBOL]x",
        "[RAW]{",
        "[STRING]\"flip\"",
        "[RAW]}",
        "[CHEVRON-BEESTING-CLOSE]}",
        "[CHEVRON-STRING] that >\\>",
        "[CHEVRON-CLOSE]>>",
    ]);
    tst("<<#{ x }{#{{{{}}}}}>>", [
        "[CHEVRON-OPEN]<<",
        "[CHEVRON-BEESTING-OPEN]#{",
        "[WHITESPACE] ",
        "[SYMBOL]x",
        "[WHITESPACE] ",
        "[CHEVRON-BEESTING-CLOSE]}",
        "[CHEVRON-STRING]{",
        "[CHEVRON-BEESTING-OPEN]#{",
        "[RAW]{",
        "[RAW]{",
        "[RAW]{",
        "[RAW]}",
        "[RAW]}",
        "[RAW]}",
        "[CHEVRON-BEESTING-CLOSE]}",
        "[CHEVRON-STRING]}",
        "[CHEVRON-CLOSE]>>",
    ]);

    tst("<<This /* wat */\n//ok\n>>", [
        "[CHEVRON-OPEN]<<",
        "[CHEVRON-STRING]This /* wat */\n//ok\n",
        "[CHEVRON-CLOSE]>>",
    ]);

    //nested chevrons
    tst("<<one#{<<two#{three}>>}>>", [
        "[CHEVRON-OPEN]<<",
        "[CHEVRON-STRING]one",
        "[CHEVRON-BEESTING-OPEN]#{",
        "[CHEVRON-OPEN]<<",
        "[CHEVRON-STRING]two",
        "[CHEVRON-BEESTING-OPEN]#{",
        "[SYMBOL]three",
        "[CHEVRON-BEESTING-CLOSE]}",
        "[CHEVRON-CLOSE]>>",
        "[CHEVRON-BEESTING-CLOSE]}",
        "[CHEVRON-CLOSE]>>",
    ]);


    tst("123", [
        "[NUMBER]123",
    ]);
    tst(".1", [
        "[NUMBER].1",
    ]);
    tst("10.25", [
        "[NUMBER]10.25",
    ]);
    tst("10.25.25", [
        "[NUMBER]10.25",
        "[NUMBER].25",
    ]);
    tst("0.0", [
        "[NUMBER]0.0",
    ]);
    tst("1.", [
        "[NUMBER]1",
        "[RAW].",
    ]);
    tst("1.z", [
        "[NUMBER]1",
        "[RAW].",
        "[SYMBOL]z",
    ]);


    tst("re#regex#", [
        "[REGEXP]re#regex#",
    ]);
    tst("re#regex#iok", [
        "[REGEXP]re#regex#i",
        "[SYMBOL]ok",
    ]);
    tst("re#regex#gok", [
        "[REGEXP]re#regex#g",
        "[SYMBOL]ok",
    ]);
    tst("re#regex#igok", [
        "[REGEXP]re#regex#ig",
        "[SYMBOL]ok",
    ]);
    tst("re#regex#giok", [
        "[REGEXP]re#regex#gi",
        "[SYMBOL]ok",
    ]);
    tst("re#\\##", [
        "[REGEXP]re#\\##"
    ]);
    tst("re#\\#\\\\#", [
        "[REGEXP]re#\\#\\\\#"
    ]);


    //testing escapes i.e. \\" is not \"
    tst('"some\\\\"end', [
        "[STRING]\"some\\\\\"",
        "[SYMBOL]end",
    ]);
    tst('"some\\"string"', [
        "[STRING]\"some\\\"string\"",
    ]);
    tst('"some\\n"', [
        "[STRING]\"some\\n\"",
    ]);

    tst("ruleset rs{rule r1{}}", [
        "[SYMBOL]ruleset",
        "[WHITESPACE] ",
        "[SYMBOL]rs",
        "[RAW]{",
        "[SYMBOL]rule",
        "[WHITESPACE] ",
        "[SYMBOL]r1",
        "[RAW]{",
        "[RAW]}",
        "[RAW]}",
    ]);

    t.end();
});
