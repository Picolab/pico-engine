var _ = require("lodash");

module.exports = function(ast, comp, e){
    var rule = {
        name: e("string", ast.name.value, ast.name.loc)
    };
    if(ast.rule_state !== "active"){
        rule.rule_state = e("string", ast.rule_state);
    }
    if(ast.select){
        rule.select = comp(ast.select);
    }
    if(!_.isEmpty(ast.foreach)){
        var nestedForeach = function(arr, iter){
            if(_.isEmpty(arr)){
                return iter;
            }
            var last = _.last(arr);
            var rest = _.initial(arr);
            return nestedForeach(rest, comp(last, {iter: iter}));
        };
        rule.foreach = e("genfn", ["ctx", "foreach", "iter"], [
            nestedForeach(ast.foreach, e(";", e("ycall", e("id", "iter"), [e("id", "ctx")])))
        ]);
    }
    if(!_.isEmpty(ast.prelude)){
        rule.prelude = e("genfn", ["ctx"], comp(ast.prelude));
    }
    if(ast.action_block){
        rule.action_block = comp(ast.action_block);
    }
    if(ast.postlude){
        rule.postlude = comp(ast.postlude);
    }
    return e("obj", rule);
};
