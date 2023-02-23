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

    shares create_DID, create_DID_Doc, get_explicit_invite, get_invitation_did_doc, didDocs, clearDidDocs
    
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
      //http://localhost:3000/sky/event/eci/did_o_invite/receive_request
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

    generate_response_message = function(my_did_doc, my_did, thread) {
      response = {
        "id": "did:peer:0z6MkknrVttotXYfACGmosAKqTxEaw3pSh87Lm5vx16wKPCUv",//my new did
        "typ": "application/didcomm-plain+json",//same as request message
        "type": "https://didcomm.org/didexchange/1.0/response",
        "body": {
          "@type": "https://didcomm.org/didexchange/1.0/response",//same as the above
          "@id": my_did,
          "~thread": thread,
          "did": my_did,
          "did_doc~attach": my_did_doc
        }
      }
      response
    }

    generate_request_message = function(invite_id, new_did, label) {
      request = {
        "id": new_did{"did"},
        "type": "https://didcomm.org/didexchange/1.0/request",
        "typ": "application/didcomm-plain+json",
        "~thread": { 
            "thid": new_did{"did"},
            "pthid": invite_id
        },
        "body": {
          "label": label, // Suggested Label
          //"goal_code": "aries.rel.build", // Telling the receiver what to use to process this
          "goal": "To establish a peer did connection",
          "did": new_did{"did"},
          "did_doc~attach": new_did
        }
      }

      request
    }

    generate_complete_message = function(thid, pthid) {
      complete = {
        "type": "https://didcomm.org/didexchange/1.0/complete",
        "typ": "application/didcomm-plain+json",
        "id": random:uuid(),
        "~thread": {
          "thid": thid,
          "pthid": pthid
        }
      }
      
      complete
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

      //base64 = invite_url.extract(re#ssi?oob=(\w+)#).klog("after oob?")
      
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
      
      packed_message = dido:pack(request_message, new_did["did"], invite_id)
    }

    http:post(url = end_point, json = packed_message, autosend = {"eci": meta:eci, "domain": "dido", "type": "post_response", "name": "post_response"}) setting(http_response)

    fired {
      raise dido event "request_sent" attributes event:attrs.put("http_response", http_response)
    }
  }

  rule request_sent {
    select when dido request_sent 

    if(event:attrs{"http_response"}{"status_code"} != 200) then
      send_directive("say", {"HTTP Response Code" : event:attrs{"http_response"}{"status_code"}})
    
    fired {
      raise dido event "abandon"
    }
  }

  rule receive_response {
    select when dido receive_response
    pre {
      message = event:attrs{"message"}
      //unpacked_response = dido:unpack(response)
      did_doc = message{"did_doc~attach"}.klog("Attached DidDoc??")
      stored_doc = dido:storeDidDoc(did_doc)
      thread = message{"body"}{"~thread"}

      my_did = thread{"thid"}
      their_did = did_doc{"did"}
      their_end_point = dido:getDIDDoc(my_did){"services"}[0]{"kind"}{"Other"}{"serviceEndpoint"}
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

      packed_message = dido:pack(complete_message, my_did, their_did)
    }

    http:post(url = endpoint, json = packed_message, autosend = {"eci": meta:eci, "domain": "dido", "type": "post_response", "name": "post_response"}) setting(http_response)

    fired {
      raise dido event "complete"
    } else {
      raise dido event "abandon"
    }
  }

  rule complete {
    select when dido complete
    send_directive("say", {"Completed" : "Completed"})
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
      packed_message = event:attrs.delete("_headers").klog("request message received!")
      
      request_message = dido:unpack(packed_message).klog("Unpacked: ")

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

      response_message = generate_response_message(DID_doc, my_did, thread).klog("Response messaage: ")

      doc = dido:storeDidDoc(request_message{"body"}{"did_doc~attach"})
      packed_response = dido:pack(response_message, my_did, their_did).klog("Packed response: ")
    }
    http:post(url = end_point, json = packed_response, autosend = {"eci": meta:eci, "domain": "dido", "type": "post_response", "name": "post_response"}) setting(http_response)
    fired { 
      raise dido event "response_sent" attributes event:attrs.put("response_message", response_message).put("http_reponse", http_response)
    }
  }
  rule response_sent {
    select when dido response_sent

    pre {
      response_message = event:attrs{"response_message"}.klog("response message sent")
      http_response = event:attrs{"http_response"}
    }

    if (http_response{"status_code"} == 200) then 
      send_directive("say", {"HTTP Response Code" : http_response{"status_code"}})
    fired {
    }
    else {
      raise dido event "received_error" attributes event:attrs.put("error", response_message)
    }
  }

  rule received_error {
    select when dido received_error
    pre {
      error_message = event:attrs{"error"}.klog("Error establishing did connection: ")
    }
    send_directive("say", {"error_message" : error_message})
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