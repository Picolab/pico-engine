var _ = require("lodash");
var genWith = require("../genWith");

module.exports = function(ast, ind, gen){
    var src = "";
    if(ast.label){
        src += ind() + gen(ast.label) + " =>\n";
        src += ind(1);
    }else{
        src += ind();
    }
    src += gen(ast.action) + "(";
    src += _.map(ast.args, function(arg){
        return gen(arg);
    }).join(", ");
    src += ")";
    if(ast.setting){
        src += " setting(" + gen(ast.setting) + ")";
    }
    src += genWith(ast["with"], ind, gen);
    return src;
};
