var _ = require("lodash");
var ktypes = require("krl-stdlib/types");


var isBlank = function(str){
    return !ktypes.isString(str) || str.trim().length === 0;
};


var clean = function(policy_orig){

    var policy = {};

    if(isBlank(policy_orig.name)){
        throw new Error("missing `policy.name`");
    }
    policy.name = policy_orig.name.trim();

    if( ! policy_orig.event){
        throw new Error("missing `policy.event`");
    }

    policy.event = {};
    if(policy_orig.event.type === "whitelist"){
        policy.event.type = "whitelist";
    }else if(policy_orig.event.type === "blacklist"){
        policy.event.type = "blacklist";
    }else{
        throw new Error("`policy.event.type` must be \"whitelist\" or \"blacklist\"");
    }
    if(policy_orig.event.events === "ALL"){
        policy.event.events = "ALL";
    }else{
        policy.event.events = _.map(policy_orig.event.events, function(e_orig){
            var e = {};
            if(_.has(e_orig, "domain")){
                e.domain = ktypes.toString(e_orig.domain).trim();
                if(e.domain.length === 0){
                    delete e.domain;
                }
            }
            if(_.has(e_orig, "type")){
                e.type = ktypes.toString(e_orig.type).trim();
                if(e.type.length === 0){
                    delete e.type;
                }
            }
            if(_.isEmpty(e)){
                throw new Error("`policy.event.events` must have `domain` and/or `type`");
            }
            return e;
        });
    }


    return policy;
};


var doesMatchEvent = function(events, event){

    if(events === "ALL"){
        return true;
    }

    return _.find(events, function(s){
        if(_.has(s, "domain") && s.domain !== event.domain){
            return false;
        }
        if(_.has(s, "type") && s.type !== event.type){
            return false;
        }
        return true;
    });
};


var checkEvent = function(policy, event){
    if( ! policy || ! policy.events){
        //TODO remove this
        return true;
    }
    if(policy.events.type === "whitelist"){
        return doesMatchEvent(policy.events.events, event);
    }
    return ! doesMatchEvent(policy.events.events, event);
};


module.exports = {
    clean: clean,
    checkEvent: checkEvent,
};
