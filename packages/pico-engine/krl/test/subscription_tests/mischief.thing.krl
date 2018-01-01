ruleset mischief.thing {
  meta {
    name "mischief.thing"
    description <<
      A bit of whimsy,
      inspired by Dr. Seuss's
      "The Cat in the Hat"
    >>
    author "Picolabs"
    use module io.picolabs.subscription alias Subscriptions
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

rule bad_decrypt {
    select when mischief encrypted
    pre {
        subscriptions = Subscriptions:getSubscriptions()
        subscription = subscriptions{event:attr("sub_name")}
        nonce = event:attr("nonce")
        encrypted_message = event:attr("encryptedMessage")

        decrypted_message = engine:decryptChannelMessage(subscription.eci, encrypted_message, nonce, "bad key")
    }
    if decrypted_message != false then
      noop()
    fired {
        ent:shouldNotHaveDecrypted := true;
    }
    else {
      raise wrangler event "decryption_failed"
    }
   }

   rule bad_signature {
    select when mischief hat_lifted
    pre {
        verified_message = engine:verifySignedMessage("Bad Key", event:attr("signed_message"))
    }
    if verified_message != false then
      noop()
    fired {
      ent:status := "active";
      ent:serial := (ent:serial.defaultsTo(0) + 1).klog("HAT LIFTED")
    }
    else {
      raise wrangler event "signature_verification_failed"
    }
   }

 rule mischief_hat_lifted_encrypted {
    select when mischief encrypted
    pre {
        subscriptions = Subscriptions:getSubscriptions()
        subscription = subscriptions{event:attr("sub_name")}
        nonce = event:attr("nonce")
        encrypted_message = event:attr("encryptedMessage")

        decrypted_message = engine:decryptChannelMessage(subscription.eci, encrypted_message, nonce, subscription{"other_encryption_public_key"})
    }
    if decrypted_message != false then
      noop()
    fired {
      ent:decrypted_message := decrypted_message.decode()
    } else {
      raise wrangler event "decryption_failure"
    }

  }

   rule decryption_failed {
      select when wrangler signature_verification_failed
      always {
        ent:decryption_failure := (ent:decryption_failed.defaultsTo(0) + 1)
      }

    }

  rule mischief_hat_lifted {
    select when mischief hat_lifted
    pre {
        subscriptions = Subscriptions:getSubscriptions()
        subscription = subscriptions{event:attr("sub_name")}
        verified_message = engine:verifySignedMessage(subscription{"other_verify_key"}, event:attr("signed_message"))
    }
    if verified_message != false then
      noop()
    fired {
      ent:message := verified_message.decode()
    } else {
      raise wrangler event "signature_verification_failed"
    }

  }
  rule signature_failed {
    select when wrangler signature_verification_failed
    always {
      ent:failed := (ent:failed.defaultsTo(0) + 1).klog("SIGNATURE FAILED")
    }
  }
}
