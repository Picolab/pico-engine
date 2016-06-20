var nearley = require('nearley');
var grammar = require('./grammar.js');
var commentsToSpaces = require('./commentsToSpaces');

module.exports = function(src){
  var p = new nearley.Parser(grammar.ParserRules, grammar.ParserStart);
  p.feed(commentsToSpaces(src));
  return [].concat.apply([], p.results);
};
