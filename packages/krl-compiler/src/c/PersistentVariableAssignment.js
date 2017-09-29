module.exports = function(ast, comp, e){
    if(ast.op !== ":="){
        throw new Error("Unsuported PersistentVariableAssignment.op: " + ast.op);
    }
    if(ast.left.type !== "DomainIdentifier" || !/^(ent|app)$/.test(ast.left.domain)){
        throw new Error("PersistentVariableAssignment - only works on ent:* or app:* variables");
    }

    var value_to_store = comp(ast.right);

    return e(";", e("ycall", e("id", "ctx.modules.set"), [
        e("id", "ctx"),
        e("str", ast.left.domain, ast.left.loc),
        e("str", ast.left.value, ast.left.loc),
        ast.path_expression
            ? comp(ast.path_expression)
            : e("nil"),
        value_to_store,
    ]));
};
