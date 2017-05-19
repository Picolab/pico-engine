var _ = require("lodash");

module.exports = function(ast, ind, gen){
    var src = "{";

    if(_.size(ast.value) > 1){
        src += "\n" + ind(1);
        src += _.map(ast.value, function(ast){
            return gen(ast, 1);
        }).join(",\n" + ind(1));
        src += "\n" + ind();
    }else{
        src += _.map(ast.value, function(ast){
            return gen(ast);
        }).join(", ");
    }

    src += "}";

    return src;
};
