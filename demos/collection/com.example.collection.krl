/**
 * Collection: keeps a collection of other picos. Each member is a relationship
 * in which this pico plays the role "collection" and the other pico plays
 * "member". This ruleset only manages the collection: it accepts members,
 * turns away requests in any other role, removes members, and raises
 * collection:member_added and collection:member_removed. Other rulesets on this
 * pico use the members; com.example.collection.report is one.
 */
ruleset com.example.collection {
  meta {
    name "Collection"
    description "Accepts member picos by relationship role and provides them to other rulesets."
    author "PICOLABS"

    use module io.picolabs.subscription alias subscription

    provides members, rejections
    shares members, rejections
  }

  global {
    /**
     * Every member: the relationships in which the other pico is a member.
     * @returns Array of relationships (Id, Tx, Rx, Tx_role, Rx_role, ...)
     */
    members = function() {
      subscription:established("Tx_role", "member")
    }

    /**
     * Requests this collection turned away, oldest first.
     * @returns Array of { name, role, time }
     */
    rejections = function() {
      ent:rejections.defaultsTo([])
    }
  }

  /**
   * Accept a request to join as a member. Reject a request in any other role,
   * and remember it.
   */
  rule accept_member {
    select when wrangler inbound_pending_subscription_added
    pre {
      acceptable = event:attr("Rx_role") == "collection" && event:attr("Tx_role") == "member"
    }
    if acceptable then noop()
    fired {
      raise wrangler event "pending_subscription_approval" attributes event:attrs
    }
    else {
      ent:rejections := rejections().append({
        "name": event:attr("name"),
        "role": event:attr("Tx_role"),
        "time": time:now()
      })
      raise wrangler event "inbound_rejection" attributes event:attrs
      raise collection event "member_rejected" attributes event:attrs
    }
  }

  /**
   * Remove a member. Only relationships with members can be removed this way.
   * @attr Id String "the member's relationship id"
   */
  rule remove_member {
    select when collection member_removal_requested
      Id re#(.+)#
      setting(id)
    pre {
      member = members().filter(function(bus) { bus{"Id"} == id }).head()
    }
    if member then noop()
    fired {
      raise wrangler event "subscription_cancellation" attributes {"Id": id}
    }
  }

  rule member_added {
    select when wrangler subscription_added
      where event:attr("bus"){"Tx_role"} == "member"
    always {
      raise collection event "member_added" attributes event:attrs
    }
  }

  rule member_removed {
    select when wrangler subscription_removed
      where event:attr("bus"){"Tx_role"} == "member"
    always {
      raise collection event "member_removed" attributes event:attrs
    }
  }
}
