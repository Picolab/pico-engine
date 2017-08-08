var _ = require("lodash");
var diff = require("diff-lines");
var rmLoc = require("./rmLoc");
var parser = require("../src/");
var unparse = require("./unparse");
var nearley = require("nearley");
var grammar = require("../src/grammar.js");
var generator = require("krl-generator");
var tokenizer = require("../src/tokenizer");

var onAmbiguousProgram = function(src){
    console.error("Found an ambiguous program");
    console.error("--------------------------------");
    console.error(src);
    console.error("--------------------------------");

    var tokens = tokenizer(src).filter(function(t){
        return true
            && t.type !== "WHITESPACE"
            && t.type !== "LINE-COMMENT"
            && t.type !== "BLOCK-COMMENT"
        ;
    });

    var p = new nearley.Parser(grammar.ParserRules, grammar.ParserStart);
    p.feed(tokens);

    console.log(p.results.length, " parsings found. Here is the diff for the first two");

    var ast0 = p.results[0];
    var ast1 = p.results[1];
    var str = diff(generator(ast0), generator(ast1), {n_surrounding: 3});
    if(str.trim().length === 0){
        console.log(generator(ast0));
        str = diff(
            JSON.stringify(rmLoc(ast0), false, 2),
            JSON.stringify(rmLoc(ast1), false, 2),
            {n_surrounding: 3}
        );
    }

    console.log(str);
};

var n_tests = 10000;
var n;
for(n=0; n < n_tests; n++){//eslint-disable-line
    if(n % 500 === 0){
        console.log(_.padStart(n + "", 10), "/", n_tests);
    }
    var src = unparse({
        always_semicolons: true,
    });
    try{
        parser(src);
    }catch(e){
        console.log("FAILED", n, "/", n_tests);
        if(/Parsing Ambiguity/.test(e + "")){
            onAmbiguousProgram(src);
            throw (e + "");//don't print the whole stack trace
        }else{
            console.error(src);
            throw e;
        }
    }
}
console.log("DONE!", n_tests);
