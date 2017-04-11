module.exports = function(ast, ind, gen){
    var src = "";
    src += ast.left.type === "InfixOperator" && ast.left.op !== ast.op
        ? "(" + gen(ast.left) + ")"
        : gen(ast.left);
    src += " " + ast.op + " ";
    src += ast.right.type === "InfixOperator" && ast.right.op !== ast.op
        ? "(" + gen(ast.right) + ")"
        : gen(ast.right);
    return src;
};
