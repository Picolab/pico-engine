var _ = require("lodash");

module.exports = function(ast, comp, e){
    var rules_obj = {};
    _.each(ast.rules, function(rule){
        rules_obj[rule.name.value] = comp(rule);
    });
    var rs = {
        rid: comp(ast.rid)
    };
    if(ast.meta){
        rs.meta = comp(ast.meta);
    }
    if(!_.isEmpty(ast.global)){
        rs.global = e("genfn", ["ctx"], comp(ast.global));
    }
    rs.rules = e("obj", rules_obj);
    return [
        e(";", e("=", e("id", "module.exports"), e("obj", rs)))
    ];
};
