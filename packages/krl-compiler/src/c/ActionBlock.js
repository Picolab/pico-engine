var _ = require("lodash");

module.exports = function(ast, comp, e){
    var body = [];

    var condition = ast.condition
        ? comp(ast.condition)
        : e("true");

    body.push(e("var", "fired", condition));

    var if_body = [];


    var block_type = _.isString(ast.block_type)
        ? ast.block_type
        : "every";


    if(block_type === "choose"){
        if_body.push(e("switch", comp(ast.discriminant), _.map(ast.actions, function(action){
            if(!action.label || action.label.type !== "Identifier"){
                throw new Error("all actions inside a `choose` block need a label");
            }
            return e("case", e("string", action.label.value, action.label.loc), [
                e(";", comp(action), action.loc),
                e("break", action.loc),
            ], action.loc);
        })));
    }else if(block_type === "sample"){

        if_body.push(e("switch", e("call", e("id", "Math.floor"), [
            e("*", e("call", e("id", "Math.random"), []), e("number", _.size(ast.actions)))
        ]), _.map(ast.actions, function(action, i){
            return e("case", e("number", i, action.loc), [
                e(";", comp(action), action.loc),
                e("break", action.loc),
            ], action.loc);
        })));

    }else if(block_type === "every"){
        if_body = if_body.concat(_.map(ast.actions, function(action){
            return e(";", comp(action));
        }));
    }else{
        throw new Error("ActionBlock.block_type = \"" + block_type + "\" not supported");
    }

    body.push(e("if", e("id", "fired"), e("block", if_body)));


    return body;
};
