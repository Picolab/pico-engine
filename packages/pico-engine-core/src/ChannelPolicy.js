var _ = require("lodash");
var ktypes = require("krl-stdlib/types");


var isBlank = function(str){
    return !ktypes.isString(str) || str.trim().length === 0;
};

var assertOnlyAllowedProperties = function(name, obj, allowed){
    var extra_props = _.difference(_.keys(obj), allowed);
    if(extra_props.length > 0){
        throw new Error(name + " does not support properties: " + extra_props.join(", "));
    }
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
        assertOnlyAllowedProperties("Policy.event rule", rule_orig, ["domain", "type"]);

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
        assertOnlyAllowedProperties("Policy.query rule", rule_orig, ["rid", "name"]);

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
    if( ! ktypes.isMap(policy)){
        throw new TypeError("Policy definition should be a Map, but was " + ktypes.typeOf(policy));
    }

    if(isBlank(policy.name)){
        throw new Error("missing `policy.name`");
    }

    assertOnlyAllowedProperties("Policy", policy, ["name", "event", "query"]);

    if(policy.event){
        assertOnlyAllowedProperties("Policy.event", policy.event, ["deny", "allow"]);
    }
    if(policy.query){
        assertOnlyAllowedProperties("Policy.query", policy.query, ["deny", "allow"]);
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


module.exports = {
    clean: clean,
    assert: function(policy, type, data){
        if(type !== "event" && type !== "query"){
            throw new Error("Channel can only assert type's \"event\" and \"query\"");
        }

        var matcher = function(rule){
            return _.every(rule, function(val, key){
                return val === data[key];
            });
        };

        if(_.find(policy[type].deny, matcher)){
            throw new Error("Denied by channel policy");
        }
        if( ! _.find(policy[type].allow, matcher)){
            throw new Error("Not allowed by channel policy");
        }
        //allowed
    },
};
