ruleset io.picolabs.use_honeypot {
  meta {
    use module io.picolabs.subscription alias subs
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

  rule provide_eci_for_null_owner{
    select when owner no_such_owner_id
    pre {
      eci = subs:established("Tx_role","honeypot").head(){"Tx"};
    }
    fired{
      raise owner event "eci_found" attributes event:attrs.put({"eci":eci});
    }
  }

  rule intialization {
    select when wrangler ruleset_added where event:attr("rids") >< meta:rid
    pre {
      rids = [ //"io.picolabs.logging",
        "io.picolabs.subscription","io.picolabs.null_owner"];
      name = "io.picolabs.null_owner";
    }
    fired {
      raise wrangler event "new_child_request"
        attributes {"rids":rids,"name":name,"color":"#CCCCCC"};
    }
  }

  rule auto_accept {
    select when wrangler inbound_pending_subscription_added
    pre {
      acceptable = event:attr("Rx_role")=="root" && event:attr("Tx_role")=="honeypot";
    }
    if acceptable then noop();
    fired {
      raise wrangler event "pending_subscription_approval"
        attributes event:attrs
    } else {
      raise wrangler event "inbound_rejection"
        attributes { "Rx": event:attr("Rx") }
    }
  }
}
