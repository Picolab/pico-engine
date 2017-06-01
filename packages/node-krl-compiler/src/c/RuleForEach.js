var _ = require("lodash");

module.exports = function(ast, comp, e, context){

    var id = function(key){
        return e("id", "foreach" + context.foreach_i + "_" + key);
    };

    var stmts = [];

    var body = [];
    if(context.foreach_i === 0){
        //the first loop resets the is_final
        body.push(e(";", e("=", e("id", "foreach_is_final"), e("true"))));
    }
    body.push(e(";", e("=",
        e("id", "foreach_is_final"),
        e("&&",
            e("id", "foreach_is_final"),
            e("===", id("i"), e("-", id("len"), e("number", 1)))
        )
    )));
    _.each(ast.setting, function(set, i){
        var val;
        if(i === 0){
            val = e("get", e("get", id("pairs"), id("i")), e("number", 1));//value
        }else if(i === 1){
            val = e("get", e("get", id("pairs"), id("i")), e("number", 0));//key
        }else{
            val = e("nil");
        }
        body.push(e(";", e("call", e("id", "ctx.scope.set"), [
            e("string", set.value, set.loc),
            val
        ])));
    });
    body = body.concat(context.foreach_body);

    stmts.push(e("var", id("pairs"), e("call", e("id", "toPairs"), [comp(ast.expression)])));
    stmts.push(e("var", id("len"), e(".", id("pairs"), e("id", "length"))));
    stmts.push(e("var", id("i")));
    stmts.push(e("for",
        e("=", id("i"), e("number", 0)),
        e("<", id("i"), id("len")),
        e("++", id("i")),
        e("block", body)
    ));

    return stmts;
};
