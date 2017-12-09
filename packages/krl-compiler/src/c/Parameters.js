var _ = require("lodash");

module.exports = function(ast, comp, e){
    var used_ids = {};
    var has_seen_default = false;
    return _.map(ast.params, function(param){

        var id = param.id.value;
        if(used_ids[id]){
            throw comp.error(param.id.loc, "Duplicate parameter: " + id);
        }
        used_ids[id] = true;

        if(param["default"]){
            has_seen_default = true;
        }else if(has_seen_default){
            throw comp.error(param.loc, "Cannot have a non-default parameter after a defaulted one");
        }
        return comp(param);
    });
};
