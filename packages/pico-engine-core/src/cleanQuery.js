var _ = require("lodash");
var ktypes = require("krl-stdlib/types");

var isBlank = function(str){
    if(!_.isString(str)){
        return true;
    }
    return str.trim().length === 0;
};

/**
 * Given a query json (i.e. from the web, or somewhere untrusted)
 *   + assert the required pieces are there
 *   + normalize the shape/naming conventions
 *   + make a full copy (clone) as to not mutate the original
 */
module.exports = function(query_orig){

    if(isBlank(query_orig && query_orig.eci)){
        throw new Error("missing query.eci");
    }
    if(isBlank(query_orig.rid)){
        throw new Error("missing query.rid");
    }
    if(isBlank(query_orig.name)){
        throw new Error("missing query.name");
    }

    var args = {};
    if(_.has(query_orig, "args")){
        //we want to make sure only json-able values are in the args
        //also want to clone it as to not mutate the original copy
        var attrs_json = ktypes.encode(query_orig.args);
        //only if it's a map or array do we consider it valid
        if(attrs_json[0] === "{" || attrs_json[0] === "["){
            args = ktypes.decode(attrs_json);
        }
    }

    return {
        eci: query_orig.eci.trim(),

        rid: query_orig.rid.trim(),

        name: query_orig.name.trim(),

        args: args,
    };
};
