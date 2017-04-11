var _ = require("lodash");

module.exports = function(ast, ind, gen){
    var vals = _.map(ast.value, function(ast){
        return gen(ast);
    });

    var src = "[";
    if(vals.join(", ").length > 45){
        src += "\n" + ind(2);
        src += vals.join(",\n" + ind(2));
        src += "\n" + ind(1);
    }else{
        src += vals.join(", ");
    }
    src += "]";
    return src;
};
