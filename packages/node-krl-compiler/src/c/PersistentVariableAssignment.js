var callStdLibFn = require("../utils/callStdLibFn");

module.exports = function(ast, comp, e){
    if(ast.op !== ":="){
        throw new Error("Unsuported PersistentVariableAssignment.op: " + ast.op);
    }
    if(ast.left.type !== "DomainIdentifier" || !/^(ent|app)$/.test(ast.left.domain)){
        throw new Error("PersistentVariableAssignment - only works on ent:* or app:* variables");
    }

    var value_to_store = comp(ast.right);

    if(ast.path_expression){
        value_to_store = callStdLibFn(e, "set", [
            e("ycall", e("id", "ctx.modules.get"), [
                e("id", "ctx"),
                e("str", ast.left.domain),
                e("str", ast.left.value)
            ]),
            comp(ast.path_expression),
            value_to_store
        ], ast.loc);
    }

    return e(";", e("ycall", e("id", "ctx.modules.set"), [
        e("id", "ctx"),
        e("str", ast.left.domain, ast.left.loc),
        e("str", ast.left.value, ast.left.loc),
        value_to_store
    ]));
};
