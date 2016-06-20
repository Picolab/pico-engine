var commentsRegExp = require('./commentsRegExp');

module.exports = function(src){
  return src.replace(commentsRegExp, function(rep){
    return rep.replace(/[^\n]/g, ' ');
  });
};
