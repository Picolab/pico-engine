var _ = require("lodash");

module.exports = function(ast, ind, gen){

    var src = "";

    var newline_params = false;
    var strs = _.map(ast.params, function(param){
        if(param["default"]){
            newline_params = true;
        }
        return gen(param);
    });
    if(newline_params){
        src += "\n" + ind(1);
        src += strs.join(",\n" + ind(1)) + ",";
        src += "\n" + ind();
    }else{
        src += strs.join(", ");
    }

    return src;
};
