var _ = require("lodash");

module.exports = function(ast, ind, gen){
    var src = "";

    var n_named = 0;

    var strs = _.map(ast.args, function(arg){
        if(arg.type === "NamedArgument"){
            n_named++;
        }
        return gen(arg);
    });

    if(n_named > 1){
        src += "\n" + ind(1);
        src += strs.join(",\n" + ind(1)) + ",";
        src += "\n" + ind();
    }else{
        src += strs.join(", ");
    }

    return src;
};
