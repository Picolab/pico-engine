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
    getEciFromOwnerName = function(){
      subs:established("Tx_role","honeypot").head(){"Tx"} || "No user found"
    }
  }
  rule eci_from_owner_name{
    select when owner login_attempt_failed
    pre {
      eci = getEciFromOwnerName();
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
}
