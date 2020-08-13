ruleset io.picolabs.null_owner {
  meta {
    use module io.picolabs.wrangler alias wrangler
    shares __testing
  }
  global {
    __testing = { "queries":
      [ { "name": "__testing" }
      //, { "name": "entry", "args": [ "key" ] }
      ] , "events":
      [ //{ "domain": "d1", "type": "t1" }
      //, { "domain": "d2", "type": "t2", "attrs": [ "a1", "a2" ] }
      ]
    }
  }

  rule limit_ruleset_use {
    select when wrangler ruleset_added where event:attr("rids") >< meta:rid
    pre {
      ok = wrangler:myself(){"name"} == meta:rid
    }
    if not ok then wrangler:uninstallRulesets(meta:rid)
  }

  rule propose_subscription {
    select when wrangler ruleset_added where event:attr("rids") >< meta:rid
    fired {
      raise wrangler event "subscription"
        attributes { "wellKnown_Tx": wrangler:parent_eci(),
          "Rx_role": "honeypot", "Tx_role": "root", 
          "name": "null_owner", "channel_type": "subscription" };
    }
  }

  rule authenticate{
    select when owner authenticate
    if false then noop()
    notfired {
      raise owner event "authentication_failed" attributes event:attrs;
    }
    finally {
      raise owner event "authenticate_channel_used"
        attributes {"eci":meta:eci}
    }
  }

  rule remove_used_authenticate_channel {
    select when owner authenticate_channel_used eci re#(.+)# setting(eci)
    pre {
      channel = engine:listChannels()
        .filter(function(c){c{"id"}==eci})
        .head();
      ok = channel
        && channel{"type"} == "temporary"
        && channel{"name"} like re#^authenticate_.*Z$#
    }
    if ok then
      engine:removeChannel(eci);
  }
}
