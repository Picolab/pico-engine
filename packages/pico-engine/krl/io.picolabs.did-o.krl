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

    shares create_peer_DID, create_peer_DIDDoc, my_peer_DIDs, get_explicit_invitation, assign_explicit_inviation

    use module io.picolabs.wrangler alias wrangler
  }

  global {   
    //we might get both methods combined 
    create_peer_DID = function() {
      peer_DID = ursa:generateDID(){"ariesPublicKey"};//we will create a DID in a different way
      peer_DID //we return the peer did we created
    }

    create_peer_DIDDoc = function(peer_DID) {
      peer_DIDDoc = peer_DID + "we will create or regerate did based on the DID passed in";//FIX ME
      peer_DIDDoc //we return the did doc we created
    }


    //map for the different peerDIDs we will receive?? 
    //or map of my dids -> their dids or map of their dids -> their diddocs
    //this might also be stored in the engine...
    my_peer_DIDs = function(){
      ent:my_peer_DIDs.defaultsTo({})
    }


    get_explicit_invitation = function(){
      ent:explicit_invitation || "Explicit invitation is not created"
    }


    //Is this how you assign a value to an entity or := in a fired part of a rule???
    assign_explicit_inviation = function(ex_inv) {
      explicit_invitation = ex_inv
      ent:explicit_invitation
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
    generate_request_message = function(invite, new_did, label) {
      {
        "@id": "5678876542345",
        "@type": "https://didcomm.org/didexchange/1.0/request",
        "~thread": { 
            "thid": "5678876542345",
            "pthid": invite{"@id"}
        },
        "label": label, // Suggested Label
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
    }

    /**
      If the routingKeys attribute was present and non-empty in the invitation, 
      each key must be used to wrap the message in a forward request, then 
      encoded in an Encryption Envelope. This processing is in order of the keys 
      in the list, with the last key in the list being the one for which the 
      serviceEndpoint possesses the private key.

      The message is then transmitted to the serviceEndpoint.
    */

    get_invite_end_point = function(invite) {
      invite{"services"}[0]{"serviceEndpoint"}
    }

    get_invite_keys = function(invite) {
      invite{"services"}[0]{"recipientKeys"}
    }

    // wrap_request = function(recipientKeys, request_message) {
    //   {
    //     "recipientKeys" : recipientKeys,
    //     "request_message" : request_message
    //   }
    // }
  }

  rule intialize {
    select when wrangler ruleset_installed where event:attrs{"rids"} >< meta:rid
    // Specify Endpoint
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
        "didcomm/aip1", // What do these mean?
        "didcomm/aip2;env=rfc19"
      ],
      "services": [
        {
          "id": "#inline",
          "type": "did-communication",
          "recipientKeys": [
            "did:key:z6MktEH5QA7bWpCe9eoa2DKaZ9JX2ZXJmxuGYR1sapQdmsCZ"
          ],
          "serviceEndpoint": "localhost:8000"
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
      invite = event:attrs{"invite"}
      label = event:attrs{"label"}

      // To send the request we need to generate a new did & doc
        // Side note the did needs to be stored on the pico, but the engine will store the doc
        // The did should resolve to the doc through the engine
      new_did = create_peer_DID()

      request_message = generate_request_message(invite, new_did, label)
      end_point = get_invite_end_point(invite)
      recipientKeys = get_invite_keys(invite)

      //wrapped_request = wrap_request(recipientKeys, request_message)
    }
    
    // SEND INVITE to end_point with the request_message which contains new_did
    // if no errors (test url, did, invite)
      // event sendß
    http:post(end_point, body = request_message)

    fired { // When condition is true
        // Store new_did_id for pico to use later?
      // Should this be a raise event 
        // Request sent
      raise dido event "request_sent"

    } else { // When condition is false from action
      // Error Message Event ?? Ent variables to hold messages // Log // 
    } // Finally runs after both or always
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

  rule request_sent {
    select when dido request_sent
  }

  // Receive response 
  rule receive_response {
    select when dido receive_response
    pre {
      error = false
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

    if not error then 
      noop()
    // else send error message
    
    fired {}
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
  }

  rule abandon {
    select when dido abandon
  }


  /** RESPONDERS STATES FOR DID EXCHANGE PROTOCOL
    start
    invitation-sent
    request-received
    response-sent
    abandoned
    completed
  */

  /////////////////////////////////////// RESPONDER (SENDER) ////////////////////////////////////////////////////////////////

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
  //print out invitation
  //invitation message using RFC 0434 Out of Band
  //https://github.com/hyperledger/aries-rfcs/blob/main/features/0434-outofband/README.md
  rule create_explicit_invite {
    select when dido new_explicit_invitation // if it is not engine-ui or wrangler that call this what would call it??

    pre {
      peer_DID = create_peer_DID()
      //peer_DIDDoc = create_peer_DIDDoc(peer_DID)
    }

    //create the json here 
    if true then //Is this the right way to check those two are not empty??
    noop()
    fired {
      raise dido event "send_invite" attributes event:attrs.put({ 

        //invitation
        "inviation" : {
          "@type": "https://didcomm.org/out-of-band/%VER/invitation",
          "@id": peer_DID,
          "label": "Printing Invitation",
          "goal_code": "issue-vc",
          "goal": "Testing if invitation is correct can be printed",
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
          "services": ["did:sov:" + peer_DID]
        },
      })
    } else {
      //we might not need to send peer_DID and peer_DIDDoc but we will have multiple did and did docs??
      // raise dido event "failed_to_createInvite" attributes event:attrs.put({
      //   "failed_peer_DID":peer_DID,
      //   "failed_peer_DIDDoc":peer_DIDDoc,
      // })
    }
  }
  

  rule create_implicit_invitation {
    select when dido new_implicit_invitation
  }



  rule send_invite {
    select when dido send_invite
    
    pre {
      invitation = event:attrs{"invitation"};
    }

    fired {
      ent:explicit_invitation := invitation
    }

  }
  //print invite 
  // rule send_invite {
  //   select when dido send_invite

  //   pre {
  //     peer_DID = event:attr("peer_DID");
  //     peer_DIDDoc = event:attr("peer_DIDDoc");
  //   }

  //   if !peer_DID.isnull() && !peer_DIDDoc.isnull() then //Is this the right way to check those two are not empty??
  //   noop()
  //   fired {
  //     event:send({
  //       "@type": "https://didcomm.org/out-of-band/%VER/invitation",
  //       "@id": "<id used for context as pthid>",
  //       "label": "Invitation",
  //       "goal_code": "",
  //       "goal": "To establish a peep connection",
  //       "accept": [
  //         "didcomm/aip2;env=rfc587",
  //         "didcomm/aip2;env=rfc19"
  //       ],
  //       "handshake_protocols": [
  //         "https://didcomm.org/didexchange/1.0",
  //         "https://didcomm.org/connections/1.0"
  //       ],
  //       "requests~attach": [
  //         {
  //           "@id": "request-0",
  //           "mime-type": "application/json",
  //           "data": {
  //             "json": "<json of protocol message>"
  //           }
  //         }
  //       ],
  //       "services": ["did:sov:LjgpST2rjsoxYegQDRm7EL"]
  //     })
  //   } else {
  //     raise did-o event "failed_to_createInvite" attributes event:attrs.put({
  //       "failed_peer_DID":peer_DID,
  //       "failed_peer_DIDDoc":peer_DIDDoc,
  //     })
  //   }
  // }

  rule failed_create_invite {
    select when dido failed_to_createInvite

    pre {
      peer_DID = event:attrs{"failed_peer_DID"};
      peer_DIDDoc = event:attrs{"failed_peer_DIDDoc"};
    }
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