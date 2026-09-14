ruleset io.picolabs.relationship_lifecycle_test {
  meta {
    name "Relationship lifecycle probe"
    author "pico-engine tests"
    use module io.picolabs.wrangler alias wrangler
    provides lifecycleSeen
    shares lifecycleSeen
  }

  global {
    lifecycleSeen = function() {
      ent:lifecycleSeen.defaultsTo({})
    }
  }

  rule note_subscription_added {
    select when wrangler subscription_added
    always {
      ent:lifecycleSeen := lifecycleSeen().put("subscription_added", true)
    }
  }

  rule note_relationship_added {
    select when wrangler relationship_added
    always {
      ent:lifecycleSeen := lifecycleSeen().put("relationship_added", true)
    }
  }

  rule note_inbound_pending_subscription {
    select when wrangler inbound_pending_subscription_added
    always {
      ent:lifecycleSeen := lifecycleSeen().put("inbound_pending_subscription_added", true)
    }
  }

  rule note_inbound_pending_relationship {
    select when wrangler inbound_pending_relationship_added
    always {
      ent:lifecycleSeen := lifecycleSeen().put("inbound_pending_relationship_added", true)
    }
  }

  rule note_relationship_removed {
    select when wrangler relationship_removed
    always {
      ent:lifecycleSeen := lifecycleSeen().put("relationship_removed", true)
    }
  }
}
