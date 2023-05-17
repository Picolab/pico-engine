/* 
DID-O V 2.0.0
  ⠀⠀⠀⢠⡜⠛⠛⠿⣤⠀⠀⣤⡼⠿⠿⢧⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
  ⠀⣀⡶⠎⠁⠀⠀⠀⠉⠶⠶⠉⠁⠀⠀⠈⠹⢆⣀⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
  ⣀⡿⠇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠉⠶⠶⠶⠶⣆⡀⠀⠀⠀⠀
  ⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⢣⡄⠀⠀⠀
  ⠛⣧⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⡇⠀⠀
    ⠀⠛⣧⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠿⠀⠀⠀⠀⢠⡼⠃⠀⠀
    ⠀⠀⠿⢇⡀⠀⠀⠀⠀⠀⠀⠀⠰⠶⠶⢆⣀⣀⣀⠀⠀⠀⠀⠀⠀⢸⡇⠀⠀⠀
    ⠀⠀⠀⢸⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠉⠉⠀⠀⠀⠀⠀⠀⢸⡇⠀⠀⠀
    ⠀⠀⠀⢸⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⡇⠀⠀
    ⠀⠀⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⢣⣤
    ⠀⣶⡏⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿
    ⠀⠿⣇⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣀⣀⣀⣀⣀⣀⠀⠀⠀⠀⢀⣀⣸⠿
    ⠀⠀⠙⢳⣶⣶⣶⣶⣶⣶⣶⣶⣶⣶⣶⡞⠛⠛⠛⠛⠛⠛⣶⣶⣶⣶⡞⠛⠃⠀
*/
  
  ruleset io.picolabs.did-o {
    meta {
      name "did-o"
    description 
    <<
    Ruleset for DIDComm v2 Communication Using Picos
    >>
    author "Rembrand Paul Pardo, Kekoapoaono Montalbo, Josh Mann"
    
    provides addRoute, routes, send, sendEvent, sendQuery, didMap, clearDidMap, didDocs, clearDidDocs, pendingRotations, clearPendingRotations, generate_invitation
    
    shares routes, addRoute, didDocs, clearDidDocs, didMap, clearDidMap, pendingRotations, clearPendingRotations, generate_invitation
    
    use module io.picolabs.wrangler alias wrangler
  }
  
  
  global {
    ///////////////////////////////////////////// ROUTING //////////////////////////////////////////////

    /**
    * Adds a route to the routes stored in the dido.ts library. The type should be a valid Protocol URI. 
    * The domain and name are the domain and name of the event that will be raised when a message of the specified type is received.
    */
    addRoute = function(type, _domain, name) {
      dido:addRoute(type, _domain, name)
    }
    
    /**
    * Queries the existing routes.
    */
    routes = function() {
      ent:routes
    }
    
    /**
    * Send a message to the specified DID. did is the recipient DID and message is a valid DIDComm v2 message.
    */
    send = function(did, message) {
      dido:send(did, message)
    }

    /**
    * Send an event to the specified DID. did is the recipient DID and the event is formatted as follows:
    * event = {
    *   "domain": domain: string,
    *   "name": name: string,
    *   "attrs": attrs: {[name: string]: any}
    * }
    */
    sendEvent = function(did, event) {
      message = dido:generateMessage({
        "type": "https://picolabs.io/event/1.0/event",
        "from": ent:didMap{did},
        "to": [did],
        "body": event
      })
      dido:send(did, message)
    }

    /**
    * Send a query to the specified DID. did is the recipient DID and the query is formatted as follows:
    * query = {
    *   "rid": rid: string,
    *   "name": name: string,
    *   "args": args: {[name: string]: any}
    * }
    */
    sendQuery = function(did, _query) {
      message = dido:generateMessage({
        "type": "https://picolabs.io/query/1.0/query",
        "from": ent:didMap{did},
        "to": [did],
        "body": _query
      })
      dido:sendQuery(did, message)
    }
    
    ///////////////////////////////////////////// DID MANAGEMENT //////////////////////////////////////////////

    /**
    * Return the map of DID relationships stored in the pattern [ thier_did : your_did ].
    */
    didMap = function() {
      ent:didMap
    }
    
    /**
    * Clear the map of DID relationships.
    */
    clearDidMap = function() {
      dido:clearDidMap()
    }
    
    /**
    * Return all the DIDs and DIDDocs stored in the pattern [ did : diddoc ].
    */
    didDocs = function() {
      ent:didDocs
    }
    
    /**
    * Clear all the DIDs and DIDDocs.
    */
    clearDidDocs = function() {
      dido:clearDidDocs()
    }
    
    /**
    * Return all the pending rotations stored in the pattern [ new_did : from_prior ].
    */
    pendingRotations = function() {
      ent:pendingRotations
    }
    
    /**
    * Clear all the pending rotations.
    */
    clearPendingRotations = function() {
      dido:clearPendingRotations()
    }

    ///////////////////////////////////////////// MESSAGE CREATORS //////////////////////////////////////////////

    /**
    * Creates an invitation OOB URL that can be used to establish DID based relationships. 
    * This automates the DID, channel, and message creation and encodes it into a base64 Out-of-Band URL.
    */
    generate_invitation = function() {
      DIDdoc = dido:generateDID(true)
      new_did = DIDdoc{"id"}
      invitation = dido:generateMessage({
        "type": "https://didcomm.org/out-of-band/2.0/invitation",
        "from": new_did,
        "body": {
          "goal_code": "exchange-did",
          "goal": "ExchangeDid",
          "label": "PicoInvite",
          "accept": [
            "didcomm/v2"
          ]
        }
      })
      base64 = math:base64encode(invitation.encode())
      dido:createInviteUrl(base64)
    }

    /**
    * Creates a trust ping message according to the DIDComm v2 protocol and returns it. The to parameter is the DID of the recipient.
    */
    generate_trust_ping_message = function(to) {
      dido:generateMessage({
        "type": "https://didcomm.org/trust_ping/2.0/ping",
        "from": ent:didMap{to},
        "to": [to],
        "body": {
          "response_requested": true
        }
      })
    }

    /**
    * Creates a trust ping response message according to the DIDComm v2 protocol and returns it. 
    * The thid parameter is the id of the ping that you are responding to, and the to parameter is the DID of the recipient. 
    */
    generate_trust_ping_response = function(thid, to) {
      dido:generateMessage({
        "type": "https://didcomm.org/trust_ping/2.0/ping_response",
        "thid": thid,
        "from": ent:didMap{to},
        "to": [to],
        "body": {}
      })
    }
  }
  
  ///////////////////////////////////////////// INITIAILIZATION //////////////////////////////////////////////

  /**
  * The initialize rule subscribes to the wrangler:ruleset_installed event and is called when the ruleset is installed and initializes the routes.
  */
  rule intialize {
    select when wrangler ruleset_installed where event:attrs{"rids"} >< meta:rid
    pre {
      ping = dido:addRoute("https://didcomm.org/trust_ping/2.0/ping", "dido", "receive_trust_ping")
      ping_response = dido:addRoute("https://didcomm.org/trust_ping/2.0/ping_response", "dido", "receive_trust_ping_response")
    }
  }

  /**
  * The pico_root_created rule subscribes to the engine_ui:setup event and is called when the engine starts and initializes the routes. 
  * This is used in addition to the initialize rule to verify routes exist when a new engine is started.
  */
  rule pico_root_created {
    select when engine_ui setup
    if ent:routes.isnull() then noop()
    fired {
      ping = dido:addRoute("https://didcomm.org/trust_ping/2.0/ping", "dido", "receive_trust_ping")
      ping_response = dido:addRoute("https://didcomm.org/trust_ping/2.0/ping_response", "dido", "receive_trust_ping_response")
    }
  }

  ///////////////////////////////////////////// ROUTING //////////////////////////////////////////////

  /**
  * The route_message rule subscribes to the dido:didcommv2_message event. It calls the dido library, 
  * unpacks the message, and looks for the proper route based on the message type. It then raises the 
  * appropriate event and passes along the unpacked message.
  */
  rule route_message {
    select when dido didcommv2_message
    pre {
      response = dido:route(event:attrs.delete("_headers"))
    }
    if response then send_directive("response", {}.put(response))
  }

  ///////////////////////////////////////////// INVITATIONS //////////////////////////////////////////////  

  /**
  * The receive_invite rule subscribes to the dido:receive_invite event and receives an invite URL (example.com/invite?_oob=abc...123) 
  * from event:attrs{"invite"}. The invite URL is a base 64 encoded invite. The rule then creates a new DID and channel. 
  * After that, it raises the dido:send_trust_ping event. 
  */
  rule receive_invite {
    select when dido receive_invite
    pre {
      url = event:attrs{"invite"}
      base64 = url.split("_oob=")[1]
      invite = math:base64decode(base64).decode()
      new_did = dido:generateDID()
      didMap = dido:mapDid(invite{"from"}, new_did{"id"})
      stored_doc = dido:storeDidDoc(invite{"from"})
    }
    fired {
      raise dido event "send_trust_ping" attributes event:attrs.put("did", invite{"from"})
    }
  }

  ///////////////////////////////////////////// TRUST PING //////////////////////////////////////////////

  /**
  * The send_trust_ping rule subscribes to the dido:send_trust_ping event and requires the DID of the recipient 
  * from event:attrs{"did"}. It then sends a generated trust ping message to the provided DID. 
  */
  rule send_trust_ping {
    select when dido send_trust_ping
    pre {
      their_did = event:attrs{"did"}
      message = generate_trust_ping_message(their_did)
      send = dido:send(their_did, message)
    }
  }

  /**
  * The receive_trust_ping rule subscibes to the did:receive_trust_ping event and requires the ping message from 
  * event:attrs{"message"}. It then checks if the message was received from an invite. If it was, it rotates the 
  * invite DID. Then it generates the response and sends it back. 
  */
  rule receive_trust_ping {
    select when dido receive_trust_ping
    pre {
      message = event:attrs{"message"}
      their_did = message{"from"}
      needsRotation = dido:rotateInviteDID(message{"to"}[0], message{"from"})
      response = generate_trust_ping_response(message{"id"}, their_did)
      send = dido:send(their_did, response)
    }
  }
}


/*
DID-O - V 2.0.0
                                        ,--._
                                       |     `...
                              ,.-------"          `.
                             /                 "    `-.__
                            .         "        _,        `._
                            |            __..-"             `.
                            |        ''"'                     `._
                            |                                    `"-.
                            '                                        `.
                           .                                          |
                          /                                           |
                       _,'                                           ,'
                     ,"                                             /
                    .                                              /
                    |                                             /
                    |                                            .
                    '                                            |
                     `.                                          |
                       `.                                        |
                         `.                                      '
                           .                                      .
                           |                                       `.
                           '                                        |
                         ,'                                         |
                       ,'                                           '
                      /                                _...._      /
                     .                              ,-'      `"'--'
                     |                            ,'
                    .'                          ,'
                   /             _,....__     _,'
                  |           ,.'        `---'
                   '_     ,--`
                     `---'
*/