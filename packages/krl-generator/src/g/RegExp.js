module.exports = function(ast, ind, gen){
    var r = ast.value;
    return "re#" + r.source + "#"
        + (r.global ? "g" : "")
        + (r.ignoreCase ? "i" : "");
};
