var _ = require('lodash');

module.exports = function rmLoc(ast){
  if(_.isArray(ast)){
    return _.map(ast, rmLoc);
  }
  if(_.isPlainObject(ast)){
    return _.mapValues(_.omit(ast, 'loc'), rmLoc);
  }
  return ast;
};
