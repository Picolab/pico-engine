var _ = require("lodash");
var callStdLibFn = require("../utils/callStdLibFn");

module.exports = function(ast, comp, e){
    if(ast.callee.type === "MemberExpression"
            && ast.callee.method === "dot"
            && ast.callee.property.type === "Identifier"
    ){
        //operator syntax is just sugar for stdlib functions
        var operator = ast.callee.property;

        var args = comp(_.assign({}, ast.args, {
            //the object is the first argument in the stdlib function
            args: [ast.callee.object].concat(ast.args.args)
        }));

        return callStdLibFn(e, operator.value, args, operator.loc);
    }

    return e("ycall", e("id", "ctx.applyFn"), [
        comp(ast.callee),
        e("id", "ctx"),
        comp(ast.args)
    ]);
};
