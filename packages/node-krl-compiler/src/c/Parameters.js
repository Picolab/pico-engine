var _ = require("lodash");

module.exports = function(ast, comp, e){
    return _.map(ast.params, function(param, i){
        return comp(param, {index: i});
    });
};
