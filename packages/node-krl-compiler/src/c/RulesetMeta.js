var _ = require("lodash");

module.exports = function(ast, comp, e){
    var meta = {};
    _.each(comp(ast.properties), function(pair){
        if(_.isArray(pair[1])){
            if(!_.has(meta, pair[0])){
                meta[pair[0]] = [];
            }
            meta[pair[0]].push(pair[1]);
            return;
        }
        meta[pair[0]] = pair[1];
    });
    return e("obj", _.mapValues(meta, function(v){
        return _.isArray(v) ? e("arr", _.flattenDeep(v)) : v;
    }));
};
