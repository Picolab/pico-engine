/*
DID-O V 0.1.0
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
    Ruleset for DID Exchange Protocol
    https://github.com/hyperledger/aries-rfcs/blob/main/features/0023-did-exchange/README.md
    >>
    author "Rembrand Paul Pardo, Kekoapoaono Montalbo, Josh Mann"


    provides create_DID, create_DID_Doc, get_explicit_invite, get_invitation_did_doc

    shares create_DID, create_DID_Doc, get_explicit_invite, get_invitation_did_doc, didDocs, clearDidDocs, getHost, getRoutes, getDidMap, clearDidMap
    
    use module io.picolabs.wrangler alias wrangler
  }


  global {   
    create_DID = function(type, endpoint) {
      DID = dido:generateDID(type, endpoint)
      DID
    }

    generate_id = function(){
      id = random:uuid()
      id
    }
    
    getECI = function(tag){
      wrangler:channels(tag)
        .reverse() //most recently created channel
        .head()
        .get("id")
    }

    getHost = function() {
      ent:host
    }

    getRoutes = function() {
      ent:routes
    }

    getDidMap = function() {
      ent:didMap
    }

    clearDidMap = function() {
      dido:clearDidMap()
    }

    //create channel
    create_end_point = function(eci) {
      end_point = getHost() + "/sky/event/" + eci + "/none/dido/" + "didcommv2_message"
      end_point
    }
    
    //
    create_DID_Doc = function() {
      //random:uuid()
      id = generate_id()
      DID_Doc = {
        "@id": id,
        "mime-type": "application/json",
        "data": {
          "base64": "eyJ0eXAiOiJKV1Qi... (bytes omitted)",
          "jws": {
            "header": {
              "kid": "did:key:z6MkmjY8GnV5i9YTDtPETC2uUAW6ejw3nk5mXF5yci5ab7th"
            },
            "protected": "eyJhbGciOiJFZERTQSIsImlhdCI6MTU4Mzg4... (bytes omitted)",
            "signature": "3dZWsuru7QAVFUCtTd0s7uc1peYEijx4eyt5... (bytes omitted)"
          }
        }
      }
      DID_Doc
    }

    didDocs = function() {
      docs = ent:didDocs
      docs
    }

    clearDidDocs = function() {
      dido:clearDidDocs()
    }

    get_explicit_invite = function() {
      msg = ent:explicit_invite
      msg
    }

    get_invitation_did_doc = function() {
      did_doc = ent:invitation_DID
      did_doc
    }

    create_explicit_invitation = function(new_id, public_key, end_point) {
      invitation = {
        "@type": "did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/out-of-band/1.1/invitation",
        "@id": new_id,
        "label": "explicitinvitation",
        "accept": [
          "didcomm/v2",
          "didcomm/aip2;env=rfc587"
        ],
        "services": [
          {
            "id": "#inline",
            "type": "did-communication",
            "recipientKeys": [
              public_key
            ],
            "serviceEndpoint": end_point
          }
        ],
        "handshake_protocols": [
          "did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/didexchange/1.0"
        ]
      }

      invitation
    }

    generate_response_message = function(my_did_doc, invite_id, their_did) {
      response = {
        "id": my_did_doc{"did"},
        "typ": "application/didcomm-plain+json",
        "type": "https://didcomm.org/didexchange/1.0/response",
        "thid": their_did,
        "pthid": invite_id,
        "body": {
          "did": my_did_doc{"did"},
          "did_doc~attach": my_did_doc
        }
      }
      response
    }

    generate_request_message = function(invite_id, my_did_doc, label) {
      request = {
        "id": my_did_doc{"did"},
        "type": "https://didcomm.org/didexchange/1.0/request",
        "typ": "application/didcomm-plain+json",
        "thid": invite_id,
        "pthid": invite_id,
        "body": {
          "label": label,
          "goal": "To establish a peer did connection",
          "did": my_did_doc{"did"},
          "did_doc~attach": my_did_doc
        }
      }

      request
    }

    generate_complete_message = function(thid, pthid) {
      complete = {
        "type": "https://didcomm.org/didexchange/1.0/complete",
        "typ": "application/didcomm-plain+json",
        "id": random:uuid(),
        "thid": thid,
        "pthid": pthid,
        "body": {}
      }
      
      complete
    }

    generate_trust_ping_message = function() {
      message = {
        "type": "https://didcomm.org/trust_ping/1.0/ping",
        "typ": "application/didcomm-plain+json",
        "id": random:uuid(),
        "body": {
          "response_requested": true
        }
      }
      message
    }

    generate_trust_ping_response = function(thid) {
      response = {
        "type": "https://didcomm.org/trust_ping/1.0/ping_response",
        "typ": "application/didcomm-plain+json",
        "id": random:uuid(),
        "thid": thid,
        "body": {}
      }
      response
    }

    create_new_endpoint = defaction(label) {
      tag = [label]
      eventPolicy = {"allow": [{"domain":"dido", "name":"*"}], "deny" : []}
      queryPolicy = {"allow": [{"rid" : meta:rid, "name": "*"}], "deny" :[]}
      wrangler:createChannel(tag, eventPolicy, queryPolicy) setting(channel)
      return create_end_point(channel.get("id"))
    }
  }

  rule intialize {
    select when wrangler ruleset_installed where event:attrs{"rids"} >< meta:rid
    pre {
      route0 = dido:addRoute("https://didcomm.org/didexchange/1.0/complete", "dido", "receive_complete")
      route1 = dido:addRoute("https://didcomm.org/didexchange/1.0/request", "dido", "receive_request")
      route2 = dido:addRoute("https://didcomm.org/didexchange/1.0/response", "dido", "receive_response")
      route3 = dido:addRoute("https://didcomm.org/trust_ping/1.0/ping", "dido", "receive_trust_ping")
      route4 = dido:addRoute("https://didcomm.org/trust_ping/1.0/ping_response", "dido", "receive_trust_ping_response")
    }
    
    if ent:host.isnull() then noop()
    
    fired {
      ent:host := "http://172.17.0.2:3000"
    }
  }

  rule set_host {
    select when dido set_host
    fired {
      new_host = event:attrs{"new_host"}
      ent:host := new_host
    }
  }

  rule route_message {
    select when dido didcommv2_message
    pre {
      route = dido:route(event:attrs.delete("_headers"))
    }
  }

  rule receive_invite {
    select when dido receive_invite
    pre {
      //invite_url = event:attrs{"Invite_URL"}
      base64 = event:attrs{"Invite_Code"}
      
      invite = math:base64decode(base64).decode()

      label = invite{"label"}
      invite_id = invite{"@id"}
      end_point = invite{"services"}[0]{"serviceEndpoint"}.klog("Endpoint ??")
      recipientKeys = invite{"services"}[0]{"recipientKeys"}[0]
    }
    
    create_new_endpoint(label) setting(my_end_point)

    fired {
      something = dido:storeDidNoDoc(invite_id, recipientKeys, end_point)
      raise dido event "send_request" attributes event:attrs.put("my_end_point", my_end_point).put("decoded_invite", invite)
    } else {
      raise dido event "abandon"
    }
  }

  rule send_request {
    select when dido send_request
    pre {
      my_end_point = event:attrs{"my_end_point"}

      invite = event:attrs{"decoded_invite"}

      label = invite{"label"}
      invite_id = invite{"@id"}
      end_point = invite{"services"}[0]{"serviceEndpoint"}
      recipientKeys = invite{"services"}[0]{"recipientKeys"}[0]

      new_did = create_DID("peer", my_end_point)

      request_message = generate_request_message(invite_id, new_did, label)
      
      packed_message = dido:pack(request_message, null, invite_id)
    }

    http:post(url = end_point, json = packed_message, autosend = {"eci": meta:eci, "domain": "dido", "type": "exchange_post_response", "name": "exchange_post_response"}) //setting(http_response)

    fired {
      //raise dido event "request_sent" attributes event:attrs.put("http_response", http_response)
    }
  }

  rule receive_response {
    select when dido receive_response
    pre {
      message = event:attrs{"message"}
      did_doc = message{"body"}{"did_doc~attach"}.klog("Attatched DidDoc??")
      stored_doc = dido:storeDidDoc(did_doc)
      
      their_did = did_doc{"did"}
      my_did = message{"thid"}
      didMap = dido:mapDid(their_did, my_did)
      their_end_point = did_doc{"services"}[0]{"kind"}{"Other"}{"serviceEndpoint"}
    }
    
    fired {
      raise dido event "send_complete" attributes event:attrs.put("their_end_point", their_end_point)
        .put("my_did", my_did)
        .put("their_did", their_did)
    } else {
      raise dido event "send_error"
      raise dido event "abandon"
    }
  }

  rule send_complete {
    select when dido send_complete
    pre {
      thid = event:attrs{"thid"}
      pthid = event:attrs{"pthid"}
      complete_message = generate_complete_message(thid, pthid)

      endpoint = event:attrs{"their_end_point"}

      my_did = event:attrs{"my_did"}
      their_did = event:attrs{"their_did"}

      packed_message = dido:pack(complete_message, my_did, their_did).klog("Packed complete message: ")
    }

    http:post(url = endpoint, json = packed_message, autosend = {"eci": meta:eci, "domain": "dido", "type": "exchange_post_response", "name": "exchange_post_response"})

    fired {
      raise dido event "complete"
    } else {
      raise dido event "abandon"
    }
  }

  rule complete {
    select when dido complete
    // send_directive("say", {"Completed" : "Completed"})
  }

  rule abandon {
    select when dido abandon
    send_directive("say", {"Abandoned" : "Abondoned"})
  }

  /////////////////////////////////////////////////// RESPONDER (SENDER) /////////////////////////////////////////////////////////////

  rule create_explicit_invite {
    select when dido create_explicit_invitation

    pre {
      tag = ["did_o_invite"]
      eventPolicy = {"allow": [{"domain":"dido", "name":"*"}], "deny" : []}
      queryPolicy = {"allow": [{"rid" : meta:rid, "name": "*"}], "deny" :[]}
    }
    wrangler:createChannel(tag, eventPolicy, queryPolicy)
    fired {
      end_point = create_end_point(getECI(tag[0]))
      DIDdoc = create_DID("key", end_point)
      new_id = DIDdoc{"did"}
      public_key = DIDdoc{"did"}
      explicit_invitation = create_explicit_invitation(new_id, public_key, end_point)
      
      ent:invitation_DID := DIDdoc["did"]

      ent:explicit_invite := explicit_invitation

      raise dido event "send_invite" attributes event:attrs.put("invitation", explicit_invitation, "end_point", end_point)
    }
  }

  rule send_invite {
    select when dido send_invite
    
    pre {
      invitation = event:attrs{"invitation"}.klog("Invite: ")
      base64 = math:base64encode(invitation.encode()).klog("Base 64 Encoded: ")
      decoded = math:base64decode(base64).decode().klog("Invite Decoded: ")
    }

    if invitation != null then send_directive("say", {"Invite: ": base64})
  }


  rule failed_invite {
    select when dido failed_to_createInvite

    pre {
      invitation = event:attrs{"invitation"}
      error_message = event:attrs{"error_message"}.klog("Failed to create invitation.")
    }
  }


  rule receive_request {
    select when dido receive_request

    pre {
      request_message = event:attrs{"message"}

      their_did = request_message{"id"}.klog("Their did: ")
    }
    create_new_endpoint(their_did) setting(my_end_point)
    fired {
      raise dido event "send_response" attributes event:attrs.put("my_end_point", my_end_point).put("request_message", request_message)
    } else {
      raise dido event "abandon"
    }
  }
  
  rule send_response {
    select when dido send_response 
    pre {
      my_end_point = event:attrs{"my_end_point"}
      request_message = event:attrs{"request_message"}.klog("request message in send_response")
      type = request_message{"type"}.klog("type: ")
      thread = request_message{"~thread"}
      end_point = request_message{"body"}{"did_doc~attach"}{"services"}[0]{"kind"}{"Other"}{"serviceEndpoint"}.klog("The end Point: ")
      their_did = request_message{"id"}.klog("Their did: ")
      DID_doc = create_DID("peer", my_end_point).klog("new_doc: ")

      my_did = DID_doc{"did"}.klog("My did: ")
      didMap = dido:mapDid(their_did, my_did)
      response_message = generate_response_message(DID_doc, thread{"pthid"}, their_did).klog("Response messaage: ")

      doc = dido:storeDidDoc(request_message{"body"}{"did_doc~attach"})
      packed_response = dido:pack(response_message, null, their_did).klog("Packed response: ")
    }
    http:post(url = end_point, json = packed_response, autosend = {"eci": meta:eci, "domain": "dido", "type": "exchange_post_response", "name": "exchange_post_response"}) //setting(http_response)
  }
  
  
  rule receive_complete {
    select when dido receive_complete
    always {
      raise dido event "complete"
    }
  }
  
  rule exchange_post_response {
    select when dido exchange_post_response
    pre {
      status_code = event:attrs{"status_code"}
    }
    if(status_code != 200) then noop()
    fired {
      raise dido event "abandon"
    }
  }

  rule received_error {
    select when dido received_error
    pre {
      error_message = event:attrs{"error"}.klog("Error establishing did connection: ")
    }
    send_directive("say", {"error_message" : error_message})
  }



  ///////////////////////////////////////////// TRUST PING //////////////////////////////////////////////
  rule send_trust_ping {
    select when dido send_trust_ping
    pre {
      their_did = event:attrs{"did"}.klog("Their did: ")
      message = generate_trust_ping_message()
    }
    dido:send(their_did, message)
  }

  rule receive_trust_ping {
    select when dido receive_trust_ping
    pre {
      message = event:attrs{"message"}.klog("Trust ping message: ")
      metadata = event:attrs{"metadata"}.klog("Unpack metadata: ")
      their_did = metadata{"encrypted_from_kid"}.split("#")[0].klog("Their did: ")
      response = generate_trust_ping_response(message{"id"})
    }
    dido:send(their_did, response)
  }

  rule receive_trust_ping_response {
    select when dido receive_trust_ping_response

  }
}




/*
DID-O - V 1.0.0
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