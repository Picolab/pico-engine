var _ = require('lodash');
var KaRL42 = require('karl42');
var parser = require('../src/');
var nearley = require('nearley');
var grammar = require('../src/grammar.js');
var generator = require('krl-generator');
var commentsToSpaces = require('../src/commentsToSpaces');

var onAmbiguousProgram = function(src){
  console.error('Found an ambiguous program');
  console.error('--------------------------------');
  console.error(src);
  console.error('--------------------------------');

  var p = new nearley.Parser(grammar.ParserRules, grammar.ParserStart);
  p.feed(commentsToSpaces(src));

  var alternate_src = _.map(p.results, function(ast){
    return generator(ast);
  });
  console.log(alternate_src.join('\n\n----------\n\n'));
};

var n = 0;
while(true){
  n++;
  console.log('attempt', n);
  var src = KaRL42();
  try{
    parser(src);
  }catch(e){
    if(/Parsing Ambiguity/.test(e + '')){
      onAmbiguousProgram(src);
      break;
    }else{
      throw e;
    }
  }
}
