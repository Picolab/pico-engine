var _ = require("lodash");

//this could also be done with meta's ast
var assertNoSelfUse = function(ridName, meta){
    _.each(meta.use, function(value, key){
        if(value.kind === "module" && value.rid === ridName){
            throw new Error("Ruleset uses itself as a module");
        }
    });
};

module.exports = function(ast, comp, e){
    var rules_obj = {};
    _.each(ast.rules, function(rule){
        var name = rule.name.value;
        if(_.has(rules_obj, name)){
            throw new Error("Rule name " + name + " is used more than once");
        }
        rules_obj[name] = comp(rule);
    });
    var rs = {
        rid: comp(ast.rid)
    };
    if(ast.meta){
        rs.meta = comp(ast.meta);

        assertNoSelfUse(ast.rid.value, rs.meta);
    }
    if(!_.isEmpty(ast.global)){
        rs.global = e("genfn", ["ctx"], comp(ast.global));
    }
    rs.rules = e("obj", rules_obj);
    return [
        e(";", e("=", e("id", "module.exports"), e("obj", rs)))
    ];
};
