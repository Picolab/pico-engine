module.exports = function(ast, ind, gen){
    var src;
    var select_when = gen(ast.event);
    src = "select " + ast.kind;
    src += select_when[0] === "\n" ? "" : " ";
    src += select_when;
    if(ast.within){
        src += "\n" + ind(1) + gen(ast.within);
    }
    return src;
};
