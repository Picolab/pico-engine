var nearley = require('nearley');
var grammar = require('./grammar.js');

var p = new nearley.Parser(grammar.ParserRules, grammar.ParserStart);

p.feed(' 1+ 2');

console.log(JSON.stringify(p.results, null, 2));
