var _ = require("lodash");

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

    return {

        eci: event_orig.eci.trim(),

        eid: _.isString(event_orig.eid)
            ? event_orig.eid.trim()
            : "none",

        domain: event_orig.domain.trim(),
        type: event_orig.type.trim(),

        attrs: _.has(event_orig, "attrs")
            ? _.cloneDeep(event_orig.attrs)//don't mutate their copy
            : {},

    };
};
