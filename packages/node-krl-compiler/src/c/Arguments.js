var _ = require("lodash");

module.exports = function(ast, comp, e, context){
    var has_named = false;
    var r = {};
    var i = 0;

    if(context && context.prepend_arg){
        r[i] = context.prepend_arg;
        i++;
    }

    _.each(ast.args, function(arg){
        if(arg.type === "NamedArgument"){
            r[arg.id.value] = comp(arg.value);
            has_named = true;
        }else{
            r[i] = comp(arg);
        }
        i++;
    });
    return has_named
        ? e("obj", r)
        : e("array", _.values(r));
};
