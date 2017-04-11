var diff = require("diff-lines");
var KaRL42 = require("karl42");
var parser = require("../src/");
var nearley = require("nearley");
var grammar = require("../src/grammar.js");
var generator = require("krl-generator");
var tokenizer = require("../src/tokenizer");

var onAmbiguousProgram = function(src){
    console.error("Found an ambiguous program");
    console.error("--------------------------------");
    console.error(src);
    console.error("--------------------------------");

    var p = new nearley.Parser(grammar.ParserRules, grammar.ParserStart);
    p.feed(tokenizer(src).map(function(t){
        if(t.type === "BLOCK-COMMENT" || t.type === "LINE-COMMENT" || t.type === "WHITESPACE"){
            return t.src.replace(/[^\n]/g, " ");
        }
        return t.src;
    }).join(""));

    console.log(p.results.length, " parsings found. Here is the diff for the first two");

    var ast0 = p.results[0];
    var ast1 = p.results[1];
    var str = diff(generator(ast0), generator(ast1), {n_surrounding: 3});
    if(str.trim().length === 0){
        console.log(generator(ast0));
        str = diff(
            JSON.stringify(ast0, false, 2),
            JSON.stringify(ast1, false, 2),
            {n_surrounding: 3}
        );
    }

    console.log(str);
};

var n = 0;
while(true){//eslint-disable-line
    n++;
    console.log("attempt", n);
    var src = KaRL42({
        grammar: grammar
    });
    try{
        parser(src);
    }catch(e){
        if(/Parsing Ambiguity/.test(e + "")){
            onAmbiguousProgram(src);
            break;
        }else{
            throw e;
        }
    }
}
