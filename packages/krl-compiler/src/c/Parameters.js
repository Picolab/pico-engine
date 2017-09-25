var _ = require("lodash");

module.exports = function(ast, comp, e){
    var has_seen_default = false;
    return _.map(ast.params, function(param, i){
        if(param["default"]){
            has_seen_default = true;
        }else if(has_seen_default){
            throw new Error("non-default argument follows default argument");
        }
        return comp(param, {index: i});
    });
};
