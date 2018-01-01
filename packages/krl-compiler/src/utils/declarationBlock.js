var _ = require("lodash");

module.exports = function(ast_list, comp){
    var used_ids = {};
    return _.map(ast_list, function(ast){
        var id;
        if(ast.type === "DefAction"){
            id = ast.id.value;
        }else if(ast.type === "Declaration"){
            if(ast.left.type === "Identifier"){
                id = ast.left.value;
            }
        }else{
            throw comp.error(ast.loc, "Only declarations should be in this block");
        }
        if(id){
            if(used_ids[id]){
                //TODO make this an error, but right now some code relies on this
                comp.warn(ast.loc, "Duplicate declaration: " + id);
            }
            used_ids[id] = true;
        }
        return comp(ast);
    });
};
