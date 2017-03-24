var _ = require("lodash");
var genWith = require("../genWith");

module.exports = function(ast, ind, gen){
    var src = gen(ast.callee) + "(";
    src += _.map(ast.args, function(arg){
        return gen(arg);
    }).join(", ") + ")";

    src += genWith(ast["with"], ind, gen);

    return src;
};
