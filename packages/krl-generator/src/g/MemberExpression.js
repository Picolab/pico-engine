module.exports = function(ast, ind, gen){
    if(ast.method === "path"){
        return gen(ast.object) + "{" + gen(ast.property) + "}";
    }else if(ast.method === "index"){
        return gen(ast.object) + "[" + gen(ast.property) + "]";
    }else if(ast.method === "dot"){
        if(true
          && ast.object.type === "Application"
          && ast.object.callee.type === "MemberExpression"
          && ast.object.callee.method === "dot"
        ){
            return gen(ast.object) + "\n"
                + ind(1) + "." + gen(ast.property)
                ;
        }
        return gen(ast.object) + "." + gen(ast.property);
    }
    throw new Error("Unsupported MemberExpression.method " + ast.method);
};
