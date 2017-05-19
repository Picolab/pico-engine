module.exports = function(ast, ind, gen){
    var src = "";
    src += gen(ast.id);
    if(ast["default"]){
        src += " = ";
        src += gen(ast["default"]);
    }
    return src;
};
