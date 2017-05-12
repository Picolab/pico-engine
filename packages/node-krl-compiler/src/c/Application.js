var _ = require("lodash");
var callStdLibFn = require("../utils/callStdLibFn");

module.exports = function(ast, comp, e){
    if(ast.callee.type === "MemberExpression"
            && ast.callee.method === "dot"
            && ast.callee.property.type === "Identifier"
            ){
        //operator syntax is just sugar for stdlib functions
        var operator = ast.callee.property;
        var args = [comp(ast.callee.object)].concat(comp(ast.args));
        return callStdLibFn(e, operator.value, args, operator.loc);
    }
    var args_obj;
    if(_.isEmpty(ast.with)){
        args_obj = e("array", comp(ast.args));
    }else{
        var obj = {};
        _.each(ast.args, function(arg, i){
            obj[i] = comp(arg);
        });
        _.each(ast.with, function(w){
            if(w.left.type !== "Identifier"){
                throw new Error("`with` only allows keys to be identifiers");
            }
            obj[w.left.value] = comp(w.right);
        });
        args_obj = e("obj", obj);
    }
    return e("ycall", comp(ast.callee), [
        e("id", "ctx"),
        args_obj
    ]);
};
