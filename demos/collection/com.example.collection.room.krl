/**
 * Room: a member pico. It has a temperature, joins a collection through the
 * collection's well-known channel, and can leave and rejoin.
 */
ruleset com.example.collection.room {
  meta {
    name "Room"
    description "A pico with a temperature that joins a collection as a member."
    author "PICOLABS"

    use module io.picolabs.wrangler alias wrangler
    use module io.picolabs.subscription alias subscription

    shares reading, membership
  }

  global {
    /**
     * This room's name and temperature.
     * @returns Map
     */
    reading = function() {
      result = {"name": wrangler:name(), "temperature": ent:temperature}
      result
    }

    /**
     * The relationship with the collection, or null when this room isn't in one.
     * @returns Map
     */
    membership = function() {
      subscription:established("Tx_role", "collection").head()
    }
  }

  rule installed {
    select when wrangler ruleset_installed where event:attr("rids") >< meta:rid
    if event:attr("temperature") then noop()
    fired {
      ent:temperature := event:attr("temperature").as("Number")
    }
  }

  /**
   * Set this room's temperature.
   * @attr temperature Number "degrees F"
   * @example "70" { "temperature": "70" }
   */
  rule new_temperature {
    select when room new_temperature
      temperature re#^(-?\d+(?:[.]\d+)?)$#
      setting(temperature)
    always {
      ent:temperature := temperature.as("Number")
    }
  }

  /**
   * Ask to join a collection.
   * @attr wellKnown_Tx String "the collection's well-known channel id"
   * @attr as String optional "the role to ask for: member, unless you want to see a request turned away"
   */
  rule join {
    select when collection join_requested
      wellKnown_Tx re#(.+)#
      setting(well_known)
    always {
      ent:collection_wellKnown := well_known
      raise wrangler event "subscription" attributes {
        "wellKnown_Tx": well_known,
        "name": wrangler:name(),
        "Rx_role": event:attr("as") || "member",
        "Tx_role": "collection"
      }
    }
  }

  /**
   * Leave the collection.
   */
  rule leave {
    select when collection leave_requested
    pre {
      bus = membership()
    }
    if bus then noop()
    fired {
      raise wrangler event "subscription_cancellation" attributes {"Id": bus{"Id"}}
    }
  }

  /**
   * Join the last collection this room asked to join, again.
   */
  rule rejoin {
    select when collection rejoin_requested where ent:collection_wellKnown
    always {
      raise collection event "join_requested" attributes {"wellKnown_Tx": ent:collection_wellKnown}
    }
  }
}
