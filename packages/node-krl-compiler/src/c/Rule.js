var _ = require("lodash");

module.exports = function(ast, comp, e){
    var rule = {
        name: e("string", ast.name.value, ast.name.loc)
    };
    if(ast.rule_state !== "active"){
        rule.rule_state = e("string", ast.rule_state);
    }
    if(!ast.select){
        throw new Error("Rule missing `select`");
    }
    rule.select = comp(ast.select);
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

    var rule_body = [];

    if(!_.isEmpty(ast.prelude)){
        rule_body = rule_body.concat(comp(ast.prelude));
    }
    if(ast.action_block){
        rule_body = rule_body.concat(comp(ast.action_block));
    }else{
        rule_body.push(e("var", "fired", e("true")));
    }

    rule_body.push(e("if", e("id", "fired"),
        e(";", e("call", e("id", "ctx.emit"), [e("str", "debug"), e("str", "fired")])),
        e(";", e("call", e("id", "ctx.emit"), [e("str", "debug"), e("str", "not fired")]))
    ));

    if(ast.postlude){
        rule_body = rule_body.concat(comp(ast.postlude));
    }

    rule.body = e("genfn", ["ctx", "runAction"], rule_body);

    return e("obj", rule);
};
