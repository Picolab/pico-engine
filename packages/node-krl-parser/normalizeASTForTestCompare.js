var _ = require('lodash');

module.exports = function normalizeAST(ast){
  if(_.isArray(ast)){
    return _.map(ast, normalizeAST);
  }
  if(_.isPlainObject(ast)){
    if(ast.type === 'RegExp'){
      if((new RegExp('/')).toString() === '///'){//old versions of v8 botch this
        ast.value = '/' + ast.value.source.split('\\').join('') + '/'
          + (ast.value.global ? 'g' : '')
          + (ast.value.ignoreCase ? 'i' : '');
      }else{
        ast.value = ast.value.toString();
      }
    }
  }
  return ast;
};
