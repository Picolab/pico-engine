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
    getHoneypotEci = function(){
      subs:established("Tx_role","honeypot").head(){"Tx"} || "No user found"
    }
    check_roles = function(){
      event:attr("Rx_role")=="root" && event:attr("Tx_role")=="honeypot"
    }
  }
  rule eci_from_owner_name{
    select when owner login_attempt_failed
    pre {
      eci = getHoneypotEci();
      pico_id = eci != "No user found"
        => engine:getPicoIDByECI(eci.klog("eci"))
         | null;
      channel_name = "authenticate_"+time:now();
    }
    if pico_id then every{
      engine:newChannel(pico_id,channel_name,"temporary")
        setting(new_channel);
      send_directive("Returning eci from owner name", {"eci": new_channel{"id"}});
    }
    fired{
      schedule owner event "authenticate_channel_expired"
        at time:add(time:now(), {"minutes": 5})
        attributes {"eci": new_channel{"id"}};
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
      acceptable = check_roles();
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
