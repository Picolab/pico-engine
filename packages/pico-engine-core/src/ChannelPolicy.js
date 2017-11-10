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
        if(rule_orig.internal === true || rule_orig.internal === false){
            rule.internal = rule_orig.internal;
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
        if(rule_orig.internal === true || rule_orig.internal === false){
            rule.internal = rule_orig.internal;
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


var eventRuleMatcher = function(event){
    return function(rule){
        if(_.has(rule, "domain") && rule.domain !== event.domain){
            return false;
        }
        if(_.has(rule, "type") && rule.type !== event.type){
            return false;
        }
        if(_.has(rule, "internal") && rule.internal !== event.internal){
            return false;
        }
        return true;
    };
};


var queryRuleMatcher = function(query){
    return function(rule){
        if(_.has(rule, "rid") && rule.rid !== query.rid){
            return false;
        }
        if(_.has(rule, "name") && rule.name !== query.name){
            return false;
        }
        if(_.has(rule, "internal") && rule.internal !== query.internal){
            return false;
        }
        return true;
    };
};

var defaultPolicy = clean({
    name: "System default Policy",
    event: {allow: [{internal: true}]},
    query: {allow: [{internal: true}]},
});


module.exports = {
    clean: clean,
    assert: function(policy, type, data){
        if(!policy){
            policy = defaultPolicy;
        }

        var matcher;
        if(type === "event"){
            matcher = eventRuleMatcher(data);
        }else if(type === "query"){
            matcher = queryRuleMatcher(data);
        }else{
            throw new Error("Channel can only assert type's \"event\" and \"query\"");
        }

        if(_.find(policy[type].deny, matcher)){
            throw new Error("denied by policy");
        }
        if( ! _.find(policy[type].allow, matcher)){
            throw new Error("denied by policy");
        }
        //allowed
    },
};
