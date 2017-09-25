var _ = require("lodash");

module.exports = function(ast, ind, gen){
    var src = "";
    src += ast.op;
    src += "(";
    src += _.map(ast.args, function(arg){
        return gen(arg);
    }).join(", ");
    src += ")";
    return src;
};
