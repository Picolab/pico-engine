var _ = require("lodash");

module.exports = function(ast, ind, gen){
    return "<<" + _.map(ast.value, function(v){
        return v.type === "String"
            ? v.value.replace(/>>/g, ">\\>")
            : "#{" + gen(v) + "}";
    }).join("") + ">>";
};
