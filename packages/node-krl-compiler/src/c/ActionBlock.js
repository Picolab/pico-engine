var _ = require("lodash");

module.exports = function(ast, comp, e){
    var block = {};
    if(_.isString(ast.block_type) && ast.block_type !== "every"){
        block.block_type = e("string", ast.block_type);
    }
    if(ast.condition){
        block.condition = e("genfn", ["ctx"], [
            e("return", comp(ast.condition))
        ]);
    }
    block.actions = e("arr", _.map(ast.actions, function(action){
        return comp(action);
    }));
    return e("obj", block);
};
