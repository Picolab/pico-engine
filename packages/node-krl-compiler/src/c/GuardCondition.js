module.exports = function(ast, comp, e){
  if(ast.condition === "on final"){
    return e("if",
      e("id", "ctx.foreach_is_final"),
      comp(ast.statement)
    );
  }

  return e("if",
    comp(ast.condition),
    comp(ast.statement)
  );
};
