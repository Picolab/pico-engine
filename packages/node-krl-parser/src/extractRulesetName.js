var commentsRegExp = require('./commentsRegExp');

module.exports = function(src){
  var m = /^\s*ruleset\s+([^\s{]+)/.exec(src.replace(commentsRegExp, ' '));
  if(!m){
    return;
  }
  return m[1];
};
