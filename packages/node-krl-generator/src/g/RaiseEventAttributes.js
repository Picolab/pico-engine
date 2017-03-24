var genWith = require("../genWith");

module.exports = function(ast, ind, gen){
    var src = "";
    if(ast.expression){
        src += "attributes ";
        src += gen(ast.expression);
    }
    src += genWith(ast["with"], ind, gen).replace(/^ */, "");
    return src;
};
