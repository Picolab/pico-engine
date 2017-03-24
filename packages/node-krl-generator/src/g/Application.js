var _ = require("lodash");

module.exports = function(ast, ind, gen){
    var src = gen(ast.callee) + "(";
    src += _.map(ast.args, function(arg){
        return gen(arg);
    }).join(", ") + ")";

    if(!_.isEmpty(ast["with"])){
        src += " with\n";
        src += _.map(ast["with"], function(w){
            return gen(w, 1);
        }).join("\n" + ind(1) + "and\n");
    }

    return src;
};
