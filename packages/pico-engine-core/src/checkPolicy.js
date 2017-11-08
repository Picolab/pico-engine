var _ = require("lodash");

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

module.exports = function(policy, event){
    if( ! policy || ! policy.events){
        //TODO remove this
        return true;
    }
    if(policy.events.type === "whitelist"){
        return doesMatchEvent(policy.events.events, event);
    }
    return ! doesMatchEvent(policy.events.events, event);
};
