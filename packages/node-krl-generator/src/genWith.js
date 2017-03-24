var _ = require("lodash");

module.exports = function(with_arr, ind, gen){
    var src = "";
    if(!_.isEmpty(with_arr)){
        src += " with\n";
        src += _.map(with_arr, function(w){
            return gen(w, 1);
        }).join("\n" + ind(1) + "and\n");
    }
    return src;
};
