module.exports = function(ast, comp, e){
    if(ast.op !== ":="){
        throw comp.error(ast.loc, "Unsuported PersistentVariableAssignment.op: " + ast.op);
    }
    if(ast.left.type !== "DomainIdentifier" || !/^(ent|app)$/.test(ast.left.domain)){
        throw comp.error(ast.left.loc, "PersistentVariableAssignment - only works on ent:* or app:* variables");
    }

    var value_to_store = comp(ast.right);

    var key = e("str", ast.left.value, ast.left.loc);

    if(ast.path_expression){
        key = e("obj", {
            key: key,
            path: comp(ast.path_expression)
        });
    }

    return e(";", e("ycall", e("id", "ctx.modules.set"), [
        e("id", "ctx"),
        e("str", ast.left.domain, ast.left.loc),
        key,
        value_to_store,
    ]));
};
