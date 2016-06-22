var nearley = require('nearley');
var grammar = require('./grammar.js');
var lineColumn = require('line-column');
var commentsToSpaces = require('./commentsToSpaces');
var excerptAtLineCol = require('excerpt-at-line-col');

var mkParseError = function(src, line, col, orig_err, filename){
  var msg = '' + orig_err;
  msg = msg.replace(/Error\s*:/g, '');
  msg = msg.replace(/nearley\s*:/g, '');
  msg = msg.replace(/\(@.*\)/g, '');
  msg = msg.replace(/\./g, '');
  msg = msg.trim();

  msg += "\n" + (filename  || '') + ':' + line + ":" + col;

  msg += "\n \n" + excerptAtLineCol(src, line - 1, col - 1, 0);

  var err = new Error(msg);
  err.line = line;
  err.col = col;
  return err;
};

module.exports = function(src, opts){
  opts = opts || {};

  var p = new nearley.Parser(grammar.ParserRules, grammar.ParserStart);
  try{
    p.feed(commentsToSpaces(src));
  }catch(e){
    if(typeof e.offset === "number"){
      var lc = lineColumn(src, e.offset);
      if(lc){
        throw mkParseError(src, lc.line, lc.col, e, opts.filename);
      }
    }
    throw e;
  }
  if(p.results.length !== 1){
    throw new Error(
      'Parsing Ambiguity: ' + p.results.length + ' Try adding a semi-colon.'
    );
  }
  return p.results[0];
};
