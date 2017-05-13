var _ = require("lodash");

module.exports = function(ast, ind, gen){
    var src = "";
    src += gen(ast.event_domain) + " " + gen(ast.event_type);

    var pairs = _.map(ast.event_attrs, function(a){
        return gen(a, 1);
    });
    if(_.size(pairs) > 1){
        src += "\n" + ind(2);
        src += pairs.join("\n" + ind(2));
    }else if(_.size(pairs) === 1){
        src += " " + pairs.join(" ");
    }
    if(ast.where){
        src += " where " + gen(ast.where);
    }
    if(!_.isEmpty(ast.setting)){
        if(_.size(pairs) > 1){
            src += "\n" + ind(2);
        }else{
            src += " ";
        }
        src += "setting(" + _.map(ast.setting, function(a){
            return gen(a, 1);
        }).join(", ") + ")";
    }
    return src;
};
