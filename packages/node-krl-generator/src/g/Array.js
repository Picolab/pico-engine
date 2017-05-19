var _ = require("lodash");

module.exports = function(ast, ind, gen){
    var vals = _.map(ast.value, function(ast){
        return gen(ast);
    });

    var src = "[";
    if(vals.join(", ").length > 45){
        src += "\n" + ind(1);
        src += vals.join(",\n" + ind(1));
        src += "\n" + ind();
    }else{
        src += vals.join(", ");
    }
    src += "]";
    return src;
};
