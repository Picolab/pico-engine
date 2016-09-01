var commentsRegExp = require('comment-regex');

module.exports = function(src){
  return src.replace(commentsRegExp(), function(rep){
    return rep.replace(/[^\n]/g, ' ');
  });
};
