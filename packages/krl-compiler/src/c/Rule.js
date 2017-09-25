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

    if(!_.isEmpty(ast.foreach)){
        var foreach_body = rule_body;

        var nesetedForeach = function(arr, i){
            if(_.isEmpty(arr)){
                return foreach_body;
            }
            return comp(_.head(arr), {
                foreach_i: i,
                foreach_n_left: _.size(_.tail(arr)),
                foreach_body: nesetedForeach(_.tail(arr), i + 1),
            });
        };
        rule_body = nesetedForeach(ast.foreach, 0);
    }


    rule.body = e("genfn", ["ctx", "runAction", "toPairs"], rule_body);

    return e("obj", rule);
};
