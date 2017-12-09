var _ = require("lodash");

module.exports = function(ast, comp, e){
    var has_seen_default = false;
    return _.map(ast.params, function(param){
        if(param["default"]){
            has_seen_default = true;
        }else if(has_seen_default){
            throw comp.error(param.loc, "non-default argument follows default argument");
        }
        return comp(param);
    });
};
