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

    //create channel
    create_end_point = function(eci, name) {
      end_point = "http://172.17.0.2:3000/sky/event/" + eci + "/none/dido/" + name
      end_point
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

    /** SAMPLE REQUEST MESSAGE
      {
        "@id": "5678876542345",
        "@type": "https://didcomm.org/didexchange/1.0/request",
        "~thread": { 
            "thid": "5678876542345",
            "pthid": "<id of invitation>"
        },
        "label": "Bob", // Suggested Label
        "goal_code": "aries.rel.build", // Telling the receiver what to use to process this
        "goal": "To create a relationship",
        "did": "B.did@B:A",
        "did_doc~attach": {
            "@id": "d2ab6f2b-5646-4de3-8c02-762f553ab804",
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
      }
    */
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




    create_new_endpoint = defaction(label) {
      tag = [label]
      eventPolicy = {"allow": [{"domain":"dido", "name":"*"}], "deny" : []}
      queryPolicy = {"allow": [{"rid" : meta:rid, "name": "*"}], "deny" :[]}
      wrangler:createChannel(tag, eventPolicy, queryPolicy) setting(channel)
      return create_end_point(channel.get("id"), "didExchange")
    }

    /**
      If the routingKeys attribute was present and non-empty in the invitation, 
      each key must be used to wrap the message in a forward request, then 
      encoded in an Encryption Envelope. This processing is in order of the keys 
      in the list, with the last key in the list being the one for which the 
      serviceEndpoint possesses the private key.

      The message is then transmitted to the serviceEndpoint.
    */
  }

  rule intialize {
    select when wrangler ruleset_installed where event:attrs{"rids"} >< meta:rid
    
    if ent:DID_to_invitation.isnull() && ent:myDID_to_theirDID.isnull() && ent:theirDID_to_myDID.isnull() then noop()
    
    fired {
      ent:DID_to_invitation := {}
      ent:invitationID_to_DID := {}
      ent:myDID_to_theirDID := {}
      ent:theirDID_to_myDID := {}
    }
  }



  /** REQUESTERS STATES FOR DID EXCHANGE PROTOCOL
    start
    invitation-received
    request-sent 
    response-received
    abandoned
    completed
  */

  /** SAMPLE DID INVITE
    {
      "@type": "did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/out-of-band/1.1/invitation",
      "@id": "30801fd7-ad0e-4a67-8d96-514d9154ae02",
      "label": "Invitation to Barry",
      "accept": [
        "didcomm/aip1",
        "didcomm/aip2;env=rfc19"
      ],
      "services": [
        {
          "id": "#inline",
          "type": "did-communication",
          "recipientKeys": [
            "did:key:z6MktEH5QA7bWpCe9eoa2DKaZ9JX2ZXJmxuGYR1sapQdmsCZ"
          ],
          "serviceEndpoint": "http://www.example.com"
        }
      ],
      "handshake_protocols": [
        "did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/didexchange/1.0"
      ]
    }
  */

  // IF WE ARE RECEIVING AN INVITE THEN WE ARE THE REQUESTER
  // Send Request
  rule receive_invite {
    select when dido receive_invite
    pre {

      //packed_msg = event:attrs{"packed_msg"}.klog("This is the packed invitation: " + packed_msg)



      // We have the invite stored in INVITE now we send a request to the INVITER
      //event:attrs{""}
      //invite_url = event:attrs{"Invite_URL"}
      base64 = event:attrs{"Invite_Code"}

      //base64 = invite_url.extract(re#oob=#).klog("after oob?")
      
      invite = math:base64decode(base64).decode().klog("Invite decoded")

      label = invite{"label"}.klog("Label?")
      invite_id = invite{"@id"}.klog("ID?")
      end_point = invite{"services"}[0]{"serviceEndpoint"}.klog("End Point?")
      recipientKeys = invite{"services"}[0]{"recipientKeys"}[0].klog("Keys?s")
      
      tag = [label]
      eventPolicy = {"allow": [{"domain":"dido", "name":"*"}], "deny" : []}
      queryPolicy = {"allow": [{"rid" : meta:rid, "name": "*"}], "deny" :[]}
    }
    
    wrangler:createChannel(tag, eventPolicy, queryPolicy)
    fired {
      // tag2 = tag[0].lc().klog("lowercase: ")
      // tag3 = tag2.replace(re#\u0020#g, "-").klog("no space: ")
      my_end_point = create_end_point(getECI(tag[0]), "receive_response")
      something = dido:storeDidNoDoc(invite_id, recipientKeys, end_point)
      raise dido event "send_request" attributes event:attrs.put("my_end_point", my_end_point)
    } else {
      raise dido event "abandon"
    }
  }

  rule send_request {
    select when dido send_request
    pre {
      my_end_point = event:attrs{"my_end_point"}.klog("Endpoint: ")
      base64 = event:attrs{"Invite_Code"}

      //base64 = invite_url.extract(re#oob=#).klog("after oob?")
      
      invite = math:base64decode(base64).decode().klog("Invite decoded")

      label = invite{"label"}.klog("Label?")
      invite_id = invite{"@id"}.klog("ID?")
      end_point = invite{"services"}[0]{"serviceEndpoint"}.klog("End Point?")
      recipientKeys = invite{"services"}[0]{"recipientKeys"}[0].klog("Keys?s")
      // end_point = event:attrs{"End point"}
      // invite_id = event:attrs{"inviteID"}.klog("Invite ID: ")
      // label = event:attrs{"label"}.klog("Label: ")
      // To send the request we need to generate a new did & doc
        // Side note the did needs to be stored on the pico, but the engine will store the doc
        // The did should resolve to the doc through the engine
      new_did = create_DID("peer", my_end_point)
        .klog("new_did: ")
      request_message = generate_request_message(invite_id, new_did, label)
        //.klog("End point: " + end_point)
        //.klog("Keys: " + recipientKeys)
        .klog("Request_message: ")
      
      packed_message = dido:pack(request_message, new_did["did"], invite_id).klog("Packed message: ")
      //wrapped_request = wrap_request(recipientKeys, request_message)
    }
    // SEND INVITE to end_point with the request_message which contains new_did
    // if no errors (test url, did, invite)
      // TODO: The request message needs to be packed
    //send_directive("say", {"end_point" : end_point})
    http:post(url = end_point, json = packed_message, autosend = {"eci": meta:eci, "domain": "dido", "type": "post_response", "name": "post_response"}) setting(http_response)

    fired { // When condition is true
      // Store new_did_id for pico to use later?
      // Should this be a raise event 
      // Request sent
      raise dido event "request_sent" attributes event:attrs.put("http_response", http_response)

    } else { // When condition is false from action
      // Error Message Event ?? Ent variables to hold messages // Log //
    } // Finally runs after both or always
  }

  rule request_sent {
    select when dido request_sent 

    if(event:attrs{"http_response"}{"status_code"} != 200) then
      send_directive("say", {"HTTP Response Code" : event:attrs{"http_response"}{"status_code"}})
    
    fired {
      // Create error message || Just go to the abandoned state
      raise dido event "abandon"
    }
  }

  // Receive response
    // OR Receive Problem Report
  /** SAMPLE RESPONSE
    {
      "@type": "https://didcomm.org/didexchange/1.0/response",
      "@id": "12345678900987654321",
      "~thread": {
        "thid": "<The Thread ID is the Message ID (@id) of the first message in the thread>"
      },
      "did": "B.did@B:A",
      "did_doc~attach": {
          "@id": "d2ab6f2b-5646-4de3-8c02-762f553ab804",
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
    }
  */

  // Receive response 
  rule receive_response {
    select when dido receive_response
    pre {
      // response = event:attrs{"response"}
      // unpack response
      // unpacked_response = dido:unpack(response)
      // store did_doc
      // did_doc = unpacked_response{"did_doc~attach"}
      // stored_doc = dido:storeDidDoc(did_doc)
    }

    // Send Complete
    /** SAMPLE COMPLETE MESSAGE
      {
        "@type": "https://didcomm.org/didexchange/1.0/complete",
        "@id": "12345678900987654321",
        "~thread": {
          "thid": "<The Thread ID is the Message ID (@id) of the first message in the thread>",
          "pthid": "<pthid used in request message>"
        }
      }
     */

    //http:post(end_point, body = request_message)
    
    fired {
      raise dido event "send_complete" //attributes event:attrs//.put("my_end_point", my_end_point)
    } else {
      raise dido event "send_error"
      raise dido event "abandon"
    }
    // OR Send Problem-Report
    /** SAMPLE ERROR MESSAGE
      {
        "@type": "https://didcomm.org/didexchange/1.0/problem_report",
        "@id": "5678876542345",
        "~thread": { "thid": "<@id of message related to problem>" },
        "~l10n": { "locale": "en"},
        "problem-code": "request_not_accepted", // matches codes listed above
        "explain": "Unsupported DID method for provided DID."
      }
    */
  }

  // Send complete
  rule send_complete {
    select when dido send_complete
    pre {
      // Construct message
    }

  }
  // // create complete message 
  // complete_message = generate_complete(thid, pthid)
  // thid (invite id), pthid (myDid)
  // packed_message = dido:pack()

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
      end_point = create_end_point(getECI(tag[0]), "receive_request")
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
      
      // tag = [their_did]
      // eventPolicy = {"allow": [{"domain":"dido", "name":"*"}], "deny" : []}
      // queryPolicy = {"allow": [{"rid" : meta:rid, "name": "*"}], "deny" :[]}
    }
    // wrangler:createChannel(tag, eventPolicy, queryPolicy)
    create_new_endpoint(their_did) setting(my_end_point)
    fired {
      // my_end_point = create_end_point(getECI(tag[0]), "didExchange")
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