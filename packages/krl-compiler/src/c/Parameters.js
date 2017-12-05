var _ = require("lodash");

module.exports = function(ast, comp, e){
    var paramNames = _.map(ast.params, function(param){
        return param.id.value;
    });
    if(_.uniq(paramNames).length < paramNames.length){
        throw new Error("two arguments are defined with the same name");
    }

    var has_seen_default = false;
    return _.map(ast.params, function(param){
        if(param["default"]){
            has_seen_default = true;
        }else if(has_seen_default){
            throw new Error("non-default argument follows default argument");
        }
        return comp(param);
    });
};
