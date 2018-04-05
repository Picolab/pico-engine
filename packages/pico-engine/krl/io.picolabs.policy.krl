ruleset io.picolabs.policy {
  meta {
    shares __testing, policies, policy, event_policy, query_policy
    , channels_using_policy, channels_using_policy_count, ui
  }
  global {
    __testing = {
      "queries": [ { "name": "__testing" }
                 , { "name": "policies" }
                 , { "name": "policy", "args": [ "id" ] }
                 , { "name": "event_policy", "args": [ "id" ] }
                 , { "name": "query_policy", "args": [ "id" ] }
                 , { "name": "channels_using_policy", "args": [ "id" ] }
                 , { "name": "channels_using_policy_count", "args": [ "id" ] }
                 ]
      ,
      "events": [ { "domain": "policy", "type": "wish_to_deny", "attrs": [ "domain", "type" ] } 
                ]
    }
    policies = engine:listPolicies().map(function(p){p{"id"}}).values()
    policy = function(id) {
      engine:listPolicies().filter(function(p){p{"id"}==id}).head()
    }
    event_policy = function(id) {
      policy(id){"event"}
    }
    query_policy = function(id) {
      policy(id){"query"}
    }
    channels_using_policy = function(id) {
      engine:listChannels().filter(function(c){c{"policy_id"}==id})
    }
    channels_using_policy_count = function(id) {
      channels_using_policy(id).length()
    }
    ui = function() {
      all = engine:listPolicies()
              .collect(function(v){v{"id"}})
              .map(function(v){v.head()})
              .map(function(v){v.put("event",v{"event"}.encode())})
              .map(function(v){v.put("query",v{"query"}.encode())});
      {"used":all.filter(function(v,k){channels_using_policy_count(k)}),
       "unused":all.filter(function(v,k){channels_using_policy_count(k)==0})}
    }
  }
  rule make_deny_policy {
    select when policy wish_to_deny
    pre {
      domain = event:attr("domain").klog("domain");
      type = event:attr("type").klog("type");
    }
    engine:newPolicy({
      "name": <<blacklist #{domain}:#{type}>>,
      "event": {
        "allow": [{}], //allow any
        "deny": [{ "domain": domain, "type": type }]
      }
    }) setting(policy)
    fired {
      ent:policies{policy{"id"}} := policy.klog("policy")
    }
  }
}
