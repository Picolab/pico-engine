var _ = require("lodash");

module.exports = function(ast, ind, gen){
    var src = "";
    src += "foreach " + gen(ast.expression);
    if(!_.isEmpty(ast.setting)){
        src += " setting(";
        src += _.map(ast.setting, function(s){
            return gen(s);
        }).join(", ");
        src += ")";
    }
    return src;
};
