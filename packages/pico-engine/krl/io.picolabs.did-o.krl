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

    provides create_DID, create_DID_Doc, get_explicit_invite

    shares create_DID, create_DID_Doc, get_explicit_invite
    
    use module io.picolabs.wrangler alias wrangler
  }


  global {   
    //function creates a DID using ursa 
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
    create_end_point = function(eci) {
      end_point = "http://172.17.0.2:3000/sky/event/" + eci + "/none/dido/receive_request"
      end_point
    }
    
    create_explicit_invitation = function(new_id, public_key, end_point) {
      //http://localhost:3000/sky/event/eci/did_o_invite/receive_request
      invitation = {
        "@type": "did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/out-of-band/1.1/invitation",
        "@id": new_id,
        "label": "Explicit Invitation",
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

    //function to retrieve DID from DID_to_invitation
    retrieve_DID = function(invitation) {
      myDID = ent:DID_to_invitation.filter(function(v) {v == invitation}).keys().head()
      myDID
    }

    //function to check DID_to_invitation map for a specific key. (key, value) = (DID, explicit invitation)
    invitation_exists = function(DID) {
      ent:DID_to_invitation.defaultsTo({}) >< DID
    }

    create_response_message = function(thid, myDID, myDoc) {
      //random:uuid()
      id = generate_id()
      response_message = {
        "@type": "https://didcomm.org/didexchange/1.0/response",
        "@id": id,
        "~thread": {
          //The Thread ID is the Message ID (@id) of the first message in the thread
          "thid": thid
        },
        "did": myDID,
        "did_doc~attach": myDoc
      }
      response_message
    }
    //FIX ME: This is probably not the best way to create our did and we might not need
    //this methid if our DIDs are resolvable
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

    //FIX ME: This might need to be removed to the engine but we need to figure out how to uncpack/pack messages
    unpack = function(message, channel) {
      unpacked_msg = ursa:unpack(message, channel)
      unpacked_msg
    }

    get_explicit_invite = function() {
      msg = ent:explicit_invite
      msg
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
        "@id": new_did{"did"},
        "@type": "https://didcomm.org/didexchange/1.0/request",
        "~thread": { 
            "thid": new_did{"did"},
            "pthid": invite_id
        },
        "label": label, // Suggested Label
        "goal_code": "aries.rel.build", // Telling the receiver what to use to process this
        "goal": "To establish a peer did connection",
        "did": new_did{"did"},
        "did_doc~attach": new_did
      }

      request
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
    request-sent (This starts the exchange protocol)(Don't think so pretty sure the start is the start)
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
      // We have the invite stored in INVITE now we send a request to the INVITER
      label = event:attrs{"label"}
      invite_id = event:attrs{"inviteID"}
      end_point = event:attrs{"End point"}
      recipientKeys = event:attrs{"Keys"}
      // To send the request we need to generate a new did & doc
        // Side note the did needs to be stored on the pico, but the engine will store the doc
        // The did should resolve to the doc through the engine
      new_did = create_DID()

      request_message = generate_request_message(invite_id, new_did, label)
        .klog("End point: " + end_point)
        .klog("Keys: " + recipientKeys)
        .klog("Request_message")
      
      //wrapped_request = wrap_request(recipientKeys, request_message)
    }
    
    // SEND INVITE to end_point with the request_message which contains new_did
    // if no errors (test url, did, invite)
      // TODO: The request message needs to be packed
    //send_directive("say", {"end_point" : end_point})
    http:post(url = end_point, json = request_message) setting(http_response)

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
    } else {

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
      response = event:attrs{"response"}
      //end_point = 
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
    // else send error message
    
    fired {
      raise event "complete"
    } else {
      raise event "send_error"
      raise event "abandon"
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

  rule complete {
    select when dido complete
    send_directive("say", {"Completed" : "Completed"})
  }

  rule abandon {
    select when dido abandon
    send_directive("say", {"Abandoned" : "Abondoned"})
  }


  

  /////////////////////////////////////////////////// RESPONDER (SENDER) /////////////////////////////////////////////////////////////

  /** RESPONDERS STATES FOR DID EXCHANGE PROTOCOL
    start
    invitation-sent
    request-received
    response-sent
    abandoned
    completed
  */

  /**
  There are two types of invitation:
    Implicit: invitation in a DID the responder publishes
    Explicit: invitation message from out-of-band protocol
    FIX ME: We should create the out of band and find out how to "publish" the DID
      For now we can forget about Implicit invites and focus on our Explicit invite - Kekoa

    EXPLICIT:
        *Example:
            {
            "@id": "a46cdd0f-a2ca-4d12-afbf-2e78a6f1f3ef",
            "@type": "https://didcomm.org/didexchange/1.0/request",
            "~thread": { 
                "thid": "a46cdd0f-a2ca-4d12-afbf-2e78a6f1f3ef",
                "pthid": "032fbd19-f6fd-48c5-9197-ba9a47040470" 
            },
            "label": "Bob",
            "goal_code": "aries.rel.build",
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


        *Example out-of-band invitation https://didcomm.org/out-of-band/%VER/invitation:
            {
              "@type": "https://didcomm.org/out-of-band/%VER/invitation",
              "@id": "<id used for context as pthid>",
              "label": "Faber College",
              "goal_code": "issue-vc",
              "goal": "To issue a Faber College Graduate credential",
              "accept": [
                "didcomm/aip2;env=rfc587",
                "didcomm/aip2;env=rfc19"
              ],
              "handshake_protocols": [
                "https://didcomm.org/didexchange/1.0",
                "https://didcomm.org/connections/1.0"
              ],
              "requests~attach": [
                {
                  "@id": "request-0",
                  "mime-type": "application/json",
                  "data": {
                    "json": "<json of protocol message>"
                  }
                }
              ],
              "services": ["did:sov:LjgpST2rjsoxYegQDRm7EL"]
            }
  */

  //FIX ME: this might not be necessary since we might not implement implicit invitations
  rule create_implicit_invitation {
    select when dido new_implicit_invitation
  }

  //invitation message using RFC 0434 Out of Band: https://github.com/hyperledger/aries-rfcs/blob/main/features/0434-outofband/README.md
  rule create_explicit_invite {
    select when dido new_explicit_invitation

    pre {
      
      tag = ["did_o_invite"]
      eventPolicy = {"allow": [{"domain":"dido", "name":"*"}], "deny" : []}
      queryPolicy = {"allow": [{"rid" : meta:rid, "name": "*"}], "deny" :[]}
    }

    wrangler:createChannel(tag, eventPolicy, queryPolicy)
    fired {
      end_point = create_end_point(getECI(tag[0]))
      DID = create_DID("key", end_point)
      public_key = DID{"did"}
      new_id = DID{"did"}
      //ent:test := ent:test.defaultsTo({}).put("test", "test")
      explicit_invitation = create_explicit_invitation(new_id, public_key, end_point)
      
      raise dido event "send_invite" attributes event:attrs.put("invitation", explicit_invitation)
      //we store a new value in the map DID_to_invitation which contains an 
      //entry keyed by DID with explicit invitation as value
      ent:DID_to_invitation{DID} := explicit_invitation
      
      ent:explicit_invite := explicit_invitation
    }
  }

  rule send_invite {
    select when dido send_invite
    
    pre {
      invitation = event:attrs{"invitation"}
      DID = retrieve_DID(invitation)
    }
    if invitation_exists(DID) then noop()
    fired {
      invitation = event:attrs{"message"}.klog("invitation sent")
    }
    else {
      raise dido event "failed_to_createInvite" attributes event:attrs.put("invitation", invitation, "error_message", "DID used for invitation not found in system")
    }
  }


  rule failed_invite {
    select when dido failed_to_createInvite

    pre {
      invitation = event:attrs{"invitation"}
      DID = retrieve_DID(invitation)
      error_message = event:attrs{"error_message"}.klog("Failed to create invitation. This DID was not created by us. " + DID)
    }

  }


  rule receive_request {
    select when dido receive_request

    pre {
      //request_message = event:attrs{"message"}.klog("request message received!")
      //????
      protected = event:attrs{"protected"}.klog("protected: ")
      recipients = event:attrs{"recipients"}.klog("recipients: ")
      iv = event:attrs{"iv"}.klog("iv: ")
      ciphertext = event:attrs{"ciphertext"}.klog("ciphertext: ")
      tag = event:attrs{"tag"}.klog("tag: ")
      eci = event:eci.klog("eci: ")
      request_message = dido:unpack(protected, recipients, iv, ciphertext, tag, eci).klog("Unpacked: ")

      explicit_invitation = get_explicit_invite()
      DID = explicit_invitation{"@id"}
      end_point = getECI("did_o_invite")

      //FIX ME: no unpacking yet???
      thid = request_message{"@id"}
      theirDID = request_message{"did"}
      theirDoc = request_message{"did_doc~attach"}
  
      //end_point = theirDoc{"end_point"}//this is not right
      myDID = create_DID() //if our did is resolvable the did_doc~attach attribute should not be included

      myDoc = create_DID_Doc()

      response_message = create_response_message(thid, myDID, myDoc)
    }
    http:post(end_point, body = response_message) setting(http_reponse)
    fired { 
      raise dido event "response_sent" attributes event:attrs.put("response_message", response_message, "http_reponse", http_reponse)
    }
  }
  rule response_sent {
    select when dido response_sent

    pre {
      response_message = evet:attrs{"response_message"}.klog("response message sent")
      http_reponse = evet:attrs{"http_response"}

      myDID = response_message{"did"}

      theirDID = response_message{"~thread"}{"thid"}
    }

    if (http_reponse{"status_code"} == 200) then 
      send_directive("say", {"HTTP Response Code" : http_reponse{"status_code"}})
    fired {
      //we store DID we created for reponse message and the DID we received from request message 
      ent:myDID_to_theirDID{myDID} := theirDID
      //we store DID we received from request message to the DID we created for response message
      ent:theirDID_to_myDID{theirDID} := myDID
    }
    else {
      //FIX ME: we simply raise the event and send the message or we have to handle problem get the error and send that??? 
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