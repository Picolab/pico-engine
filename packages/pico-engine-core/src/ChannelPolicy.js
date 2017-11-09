var _ = require("lodash");
var ktypes = require("krl-stdlib/types");


var isBlank = function(str){
    return !ktypes.isString(str) || str.trim().length === 0;
};

var cleanEvent = function(e_orig){
    if( ! ktypes.isMap(e_orig)){
        throw new Error("`policy.event.<deny|allow>` must be maps with `domain` and/or `type`");
    }
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
    return e;
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
    policy.event.deny = _.map(policy_orig.event.deny, cleanEvent);
    policy.event.allow = _.map(policy_orig.event.allow, cleanEvent);

    return policy;
};


var doesMatchEvent = function(events, event){
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
    if( ! policy || ! policy.event){
        //TODO remove this
        return true;
    }
    if(doesMatchEvent(policy.event.deny, event)){
        return false;
    }
    return doesMatchEvent(policy.event.allow, event);
};


module.exports = {
    clean: clean,
    checkEvent: checkEvent,
};
