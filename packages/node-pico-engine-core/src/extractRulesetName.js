var commentsRegExp = require("comment-regex");

module.exports = function(src){
  var src_no_comments = src.replace(commentsRegExp(), " ");
  var m = /^\s*ruleset\s+([^\s{]+)/.exec(src_no_comments);
  if(!m){
    return;
  }
  return m[1];
};
