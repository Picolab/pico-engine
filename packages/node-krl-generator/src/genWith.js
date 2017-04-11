var _ = require("lodash");

module.exports = function(with_arr, ind, gen, newline_style){
    var arg_ind = newline_style ? 2 : 1;
    var src = "";
    if(!_.isEmpty(with_arr)){
        if(newline_style){
            src += "\n" + ind(1);
        }else{
            src += " ";
        }
        src += "with\n";
        src += _.map(with_arr, function(w){
            return gen(w, arg_ind);
        }).join("\n" + ind(arg_ind) + "and\n");
    }
    return src;
};
