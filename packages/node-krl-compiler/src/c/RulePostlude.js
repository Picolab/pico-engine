var postludeBlock = function(stmts, comp, e){
  if(!stmts){
    return e('nil');
  }
  return e('fn', ['ctx', 'callback'], comp(stmts));
};

module.exports = function(ast, comp, e){
  return e('obj', {
    fired: postludeBlock(ast.fired, comp, e),
    notfired: postludeBlock(ast.notfired, comp, e),
    always: postludeBlock(ast.always, comp, e)
  });
};
