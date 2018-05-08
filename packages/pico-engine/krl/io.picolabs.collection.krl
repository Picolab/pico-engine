ruleset io.picolabs.collection {
  meta {
    use module io.picolabs.subscription alias Subs
    provides members
    shares __testing, members
  }
  global {
    __testing = { "queries": [ { "name": "__testing" },
                               { "name": "members" } ],
                  "events": [ {"domain": "wrangler", "type": "deletion_imminent"} ] }
    members = function(){
      Subs:established("Tx_role","member")
    }
  }
  rule auto_accept {
    select when wrangler inbound_pending_subscription_added
    pre {
      acceptable = event:attr("Rx_role")=="collection"
                && event:attr("Tx_role")=="member";
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
  rule delete_member_subscriptions {
    select when wrangler deletion_imminent
    foreach members() setting(subs)
    fired {
      raise wrangler event "subscription_cancellation"
        attributes { "Rx": subs{"Rx"}, "Tx": subs{"Tx"} };
      raise wrangler event "ready_for_deletion" on final;
    }
  }
}
