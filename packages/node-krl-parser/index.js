var nearley = require('nearley');
var grammar = require('./grammar.js');

module.exports = function(src){
  var p = new nearley.Parser(grammar.ParserRules, grammar.ParserStart);
  p.feed(src);
  return p.results;
};
