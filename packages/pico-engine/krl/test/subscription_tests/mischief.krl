ruleset mischief {
  meta {
    name "mischief"
    description <<
      A bit of whimsy,
      inspired by Dr. Seuss's
      "The Cat in the Hat"
    >>
    author "Picolabs"
    use module io.picolabs.pico alias wrangler
    use module io.picolabs.subscription alias Subscriptions
    shares __testing
  }
  global {
    __testing = { "queries": [ { "name": "__testing" } ],
                  "events": [ { "domain": "mischief", "type": "identity"},
                              { "domain": "mischief", "type": "hat_lifted"},
                              { "domain": "mischief", "type": "encrypted"} ] }
  }

  rule mischief_identity {
    select when mischief identity
    event:send(
      { "eci": wrangler:parent_eci(){"parent"}.klog("Parent eci cleo"), "eid": "mischief-identity",
        "domain": "mischief", "type": "who",
        "attrs": { "eci": wrangler:myself().eci } } )
  }

  rule mischief_encrypted {
    select when mischief encrypted
    foreach Subscriptions:getSubscriptions() setting (subscription)
      pre {
        thing_subs = subscription.klog("subs")
        subs_attrs = thing_subs{"attributes"}.klog("TEST1")
        map = {"encryption": 1}
        message = map.encode()
        eci = subscription.eci.klog("ECI1")
        encrypted_message = engine:encryptChannelMessage(subscription.eci, message, subscription.other_encryption_public_key)
      }
      if true then
      event:send({
         "eci": subs_attrs{"outbound_eci"},
         "eid": "hat-lifted",
         "domain": "mischief",
         "type": "encrypted",
         "attrs": {"encryptedMessage": encrypted_message{"encryptedMessage"}, "sub_name" : subscription.name, "nonce": encrypted_message{"nonce"}}
        })
  }

  rule mischief_hat_lifted {
    select when mischief hat_lifted
    foreach Subscriptions:getSubscriptions() setting (subscription)
      pre {
        thing_subs = subscription.klog("subs")
        subs_attrs = thing_subs{"attributes"}
        map = {"test": 1}
        message = map.encode()
        signed_message = engine:signChannelMessage(subscription.eci, message)
      }
      if true then
      event:send({
         "eci": subs_attrs{"outbound_eci"},
         "eid": "hat-lifted",
         "domain": "mischief",
         "type": "hat_lifted",
         "attrs": {"signed_message": signed_message, "sub_name" : subscription.name}
        })
  }
}