var _ = require("lodash");

module.exports = function(ast, ind, gen){
    var src = "{";

    var pairs = _.map(ast.value, function(ast){
        return gen(ast);
    });

    if(_.size(pairs) > 1){
        src += "\n" + ind(1);
        src += pairs.join(",\n" + ind(1));
        src += "\n" + ind();
    }else{
        src += pairs.join(", ");
    }

    src += "}";

    return src;
};
