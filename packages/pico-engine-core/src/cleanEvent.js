var _ = require("lodash");
var ktypes = require("krl-stdlib/types");
var krl_stdlib = require("krl-stdlib");

var isBlank = function(str){
    if(!_.isString(str)){
        return true;
    }
    return str.trim().length === 0;
};

/**
 * Given an event json (i.e. from the web, or somewhere untrusted)
 *   + assert the required pieces are there
 *   + normalize the shape/naming conventions
 *   + make a full copy (clone) as to not mutate the original
 */
module.exports = function(event_orig){

    if(isBlank(event_orig && event_orig.eci)){
        throw new Error("missing event.eci");
    }
    if(isBlank(event_orig.domain)){
        throw new Error("missing event.domain");
    }
    if(isBlank(event_orig.type)){
        throw new Error("missing event.type");
    }

    var attrs = {};
    if(_.has(event_orig, "attrs")){
        //we want to make sure only json-able values are in the attrs
        //also want to clone it as to not mutate the original copy
        var attrs_json = krl_stdlib.encode({}, event_orig.attrs);
        //only if it's a map or array do we consider it valid
        if(attrs_json[0] === "{" || attrs_json[0] === "["){
            attrs = krl_stdlib.decode({}, attrs_json);
        }
    }

    var eid = ktypes.toString(event_orig.eid).trim();
    if(eid.length === 0 || eid === "null"){
        eid = "none";
    }

    return {

        eci: event_orig.eci.trim(),

        eid: eid,

        domain: event_orig.domain.trim(),
        type: event_orig.type.trim(),

        attrs: attrs,

    };
};
