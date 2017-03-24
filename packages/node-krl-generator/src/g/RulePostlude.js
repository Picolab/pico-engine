var _ = require("lodash");

var postBlock = function(ast, ind, gen){
    return "{\n" + _.map(ast, function(ast){
        return gen(ast, 1);
    }).join(";\n") + "\n" + ind() + "}";
};
module.exports = function(ast, ind, gen){
    var src = "";
    if(ast.fired){
        src += ind() + "fired " + postBlock(ast.fired, ind, gen);
        if(ast.notfired){
            src += " else " + postBlock(ast.notfired, ind, gen);
        }
        if(ast.always){
            src += " finally " + postBlock(ast.always, ind, gen);
        }
    }else if(ast.always){
        src += ind() + "always " + postBlock(ast.always, ind, gen);
    }else if(ast.notfired){
        //
    }
    return src;
};
