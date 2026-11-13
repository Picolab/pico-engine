/**
 * Welcome: layered on com.example.invitations. It reacts to the event the base
 * ruleset raises when it makes a connection, which the base ruleset raises
 * whether or not anything listens.
 */
ruleset com.example.invitations.welcome {
  meta {
    name "Invitation welcome"
    description "Welcomes each new connection the base ruleset makes."
    author "PICOLABS"

    shares welcomed
  }

  global {
    /**
     * Everyone welcomed so far.
     * @returns Array of String
     */
    welcomed = function() {
      ent:welcomed.defaultsTo([])
    }
  }

  /**
   * Welcome a new connection.
   * @attr label String "who the connection is with"
   */
  rule send_welcome {
    select when invite connection_made
    pre {
      label = event:attr("label") || "friend"
    }
    send_directive("welcome", {"message": "Welcome, " + label + "!"})
    fired {
      ent:welcomed := welcomed().append(label)
    }
  }
}
