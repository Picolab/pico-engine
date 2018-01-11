ruleset mischief {
  meta {
    name "mischief"
    description <<
      A bit of whimsy,
      inspired by Dr. Seuss's
      "The Cat in the Hat"
    >>
    author "Picolabs"
    use module io.picolabs.wrangler alias wrangler
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
      { "eci": wrangler:parent_eci().klog("Parent eci cleo"), "eid": "mischief-identity",
        "domain": "mischief", "type": "who",
        "attrs": { "eci": wrangler:myself(){"eci"} } } )
  }

  rule mischief_encrypted {
    select when mischief encrypted
    foreach Subscriptions:established() setting (subscription)
      pre {
        //thing_subs = subscription.klog("subs")
        message = {"encryption": 1}.encode()
        encrypted_message = engine:encryptChannelMessage(subscription{"Rx"}, message, subscription{"Tx_public_key"})
      }
      if true then
      event:send({
         "eci": subscription{"Tx"},
         "eid": "hat-lifted",
         "domain": "mischief",
         "type": "encrypted",
         "attrs": {"encryptedMessage": encrypted_message{"encryptedMessage"}, "nonce": encrypted_message{"nonce"}}
        })
  }

  rule mischief_hat_lifted {
    select when mischief hat_lifted
    foreach Subscriptions:established() setting (subscription)
      pre {
        //thing_subs = subscription.klog("subs")
        message = {"test": 1}.encode()
        signed_message = engine:signChannelMessage(subscription{"Rx"}, message)
      }
      if true then
      event:send({
         "eci": subscription{"Tx"},
         "eid": "hat-lifted",
         "domain": "mischief",
         "type": "hat_lifted",
         "attrs": {"signed_message": signed_message }
        },subscription{"Tx_host"})
  }
}