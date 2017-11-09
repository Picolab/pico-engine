var _ = require("lodash");
var ktypes = require("krl-stdlib/types");


var isBlank = function(str){
    return !ktypes.isString(str) || str.trim().length === 0;
};

var cleanEventRules = function(rules){
    if(ktypes.isNull(rules)){
        return [];
    }
    if( ! _.isArray(rules)){
        throw new Error("`policy.event.<allow|deny>` must be an Array of rules");
    }
    return _.map(rules, function(rule_orig){
        if( ! ktypes.isMap(rule_orig)){
            throw new Error("Policy rules must be Maps, not " + ktypes.typeOf(rule_orig));
        }
        var rule = {};
        if(!isBlank(rule_orig.domain)){
            rule.domain = rule_orig.domain.trim();
        }
        if(!isBlank(rule_orig.type)){
            rule.type = rule_orig.type.trim();
        }
        return rule;
    });
};


var cleanQueryRules = function(rules){
    if(ktypes.isNull(rules)){
        return [];
    }
    if( ! _.isArray(rules)){
        throw new Error("`policy.query.<allow|deny>` must be an Array of rules");
    }
    return _.map(rules, function(rule_orig){
        if( ! ktypes.isMap(rule_orig)){
            throw new Error("Policy rules must be Maps, not " + ktypes.typeOf(rule_orig));
        }
        var rule = {};
        if(!isBlank(rule_orig.rid)){
            rule.rid = rule_orig.rid.trim();
        }
        if(!isBlank(rule_orig.name)){
            rule.name = rule_orig.name.trim();
        }
        return rule;
    });
};


var clean = function(policy){

    if(isBlank(policy.name)){
        throw new Error("missing `policy.name`");
    }

    return {
        name: policy.name.trim(),
        event: {
            deny : cleanEventRules(policy.event && policy.event.deny),
            allow: cleanEventRules(policy.event && policy.event.allow),
        },
        query: {
            deny:  cleanQueryRules(policy.query && policy.query.deny),
            allow: cleanQueryRules(policy.query && policy.query.allow),
        },
    };
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


var doesMatchQuery = function(rules, query){
    return _.find(rules, function(rule){
        if(_.has(rule, "rid") && rule.rid !== query.rid){
            return false;
        }
        if(_.has(rule, "name") && rule.name !== query.name){
            return false;
        }
        return true;
    });
};


var checkQuery = function(policy, query){
    if( ! policy || ! policy.query){
        //TODO remove this
        return true;
    }
    if(doesMatchQuery(policy.query.deny, query)){
        return false;
    }
    return doesMatchQuery(policy.query.allow, query);
};


module.exports = {
    clean: clean,
    checkEvent: checkEvent,
    checkQuery: checkQuery,
};
