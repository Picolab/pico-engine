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
    addRoute = function(type, _domain, name) {
      dido:addRoute(type, _domain, name)
    }
    
    routes = function() {
      ent:routes
    }
    
    send = function(did, message) {
      dido:send(did, message)
    }

    sendEvent = function(did, event) {
      message = dido:generateMessage({
        "type": "https://picolabs.io/event/1.0/event",
        "from": ent:didMap{did},
        "to": [did],
        "body": event
      })
      dido:send(did, message)
    }

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
    didMap = function() {
      ent:didMap
    }
    
    clearDidMap = function() {
      dido:clearDidMap()
    }
    
    didDocs = function() {
      ent:didDocs
    }
    
    clearDidDocs = function() {
      dido:clearDidDocs()
    }
    
    pendingRotations = function() {
      ent:pendingRotations
    }
    
    clearPendingRotations = function() {
      dido:clearPendingRotations()
    }

    ///////////////////////////////////////////// MESSAGE CREATORS //////////////////////////////////////////////
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
  rule intialize {
    select when wrangler ruleset_installed where event:attrs{"rids"} >< meta:rid
    pre {
      ping = dido:addRoute("https://didcomm.org/trust_ping/2.0/ping", "dido", "receive_trust_ping")
      ping_response = dido:addRoute("https://didcomm.org/trust_ping/2.0/ping_response", "dido", "receive_trust_ping_response")
    }
  }

  rule pico_root_created {
    select when engine_ui setup
    if ent:routes.isnull() then noop()
    fired {
      ping = dido:addRoute("https://didcomm.org/trust_ping/2.0/ping", "dido", "receive_trust_ping")
      ping_response = dido:addRoute("https://didcomm.org/trust_ping/2.0/ping_response", "dido", "receive_trust_ping_response")
    }
  }

  ///////////////////////////////////////////// ROUTING //////////////////////////////////////////////
  rule route_message {
    select when dido didcommv2_message
    pre {
      response = dido:route(event:attrs.delete("_headers"))
    }
    if response then send_directive("response", {}.put(response))
  }

  ///////////////////////////////////////////// INVITATIONS //////////////////////////////////////////////  
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
  rule send_trust_ping {
    select when dido send_trust_ping
    pre {
      their_did = event:attrs{"did"}
      message = generate_trust_ping_message(their_did)
      send = dido:send(their_did, message)
    }
  }

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