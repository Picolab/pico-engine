var _ = require("lodash");

var doesMatchEvent = function(events, event){

    if(events === "ALL"){
        return true;
    }

    if(_.find(events, function(s){
        return (s.domain === event.domain) && (s.type === event.type);
    })){
        return true;
    }

    return false;
};

module.exports = function(policy, event){
    if( ! policy){
        policy = {"default": "ALLOW"};
    }
    if(policy["default"] === "DENY"){
        return doesMatchEvent(policy.events, event);
    }
    return ! doesMatchEvent(policy.events, event);
};
