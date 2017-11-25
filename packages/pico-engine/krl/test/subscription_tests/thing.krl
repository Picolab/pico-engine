ruleset mischief.thing {
  meta {
    name "mischief.thing"
    description <<
      A bit of whimsy,
      inspired by Dr. Seuss's
      "The Cat in the Hat"
    >>
    author "Picolabs"
    shares __testing
  }
  global {
    __testing = { "queries": [ { "name": "__testing" } ] }
  }
  rule auto_accept {
    select when wrangler inbound_pending_subscription_added
    pre {
      attributes = event:attrs().klog("subscription:")
    }
    always {
      raise wrangler event "pending_subscription_approval"
        attributes attributes
    }
  }
  rule mischief_hat_lifted {
    select when mischief hat_lifted
    always {
      ent:status := "active";
      ent:serial := (ent:serial.defaultsTo(0) + 1).klog("HAT LIFTED")
    }
  }
}
