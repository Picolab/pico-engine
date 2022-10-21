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
    Ruleset for DID, DIDComm, DIDDoc, ...
    >>
    author "Rembrand Paul Pardo, Kekoapoaono Montalbo, Josh Mann"

    
    provides create_peer_DID, create_peer_DIDDOc

    //shares DID, pico, testingDID
    //use module io.picolabs.wrangler alias wrangler
  }

  

  global {
    /* THESE ARE DUMMY FUCNTIONS, DATA, AND TESTS, */

    __testing = { 
      /*
      FIX ME: add tests for this ruleset
      */ 
    }

    //we might get both methods combined 
    create_peer_DID = function() {
      peer_DID = ursa:generateDID(){"ariesPublicKey"};//we might create a DID in a different way
      peer_DID //we return the peer did we created
    }
    create_peer_DIDDoc = function(peer_DID) {
      peer_DIDDoc = peer_DID + "we will create or regerate did based on the DID passed in";//FIX ME
      peer_DIDDoc //we return the did doc we created
    }


    //map for the different peerDIDs we will receive
    //my dids -> their dids or their dids -> their diddocs
    peerDIDs_dic = function(){
      ent:peerDIDs_dic.defaultsTo({})
    }

  }

  /** RESPONDERS STATES FOR DID EXCHANGE PROTOCOL
    start
    invitation-sent
    request-received
    response-sent
    abandoned
    completed
  */


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
          "serviceEndpoint": "localhost:8000"
        }
      ],
      "handshake_protocols": [
        "did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/didexchange/1.0"
      ]
    }
  */

  // IF WE ARE RECEIVING AN INVITE THEN WE ARE THE REQUESTER
  rule receiveInvite {
    select when dido receiveInvite
    pre {
      invite = event:attr("invite").klog("Invite passed in: ")
      newdid = GenerateNewDID("seed")
    }

    // We have the invite stored in INVITE now we send a request to the INVITER
    // Send Request
    // To send the request we need to generate a new did&doc
      // Side not the did needs to be stored on the pico, but the engine will store the doc
      // The did should resolve to the doc through the engine
    /**
      If the routingKeys attribute was present and non-empty in the invitation, 
      each key must be used to wrap the message in a forward request, then 
      encoded in an Encryption Envelope. This processing is in order of the keys 
      in the list, with the last key in the list being the one for which the 
      serviceEndpoint possesses the private key.

      The message is then transmitted to the serviceEndpoint.
    */
    /** SAMPLE REQUEST MESSAGE
      {
        "@id": "5678876542345",
        "@type": "https://didcomm.org/didexchange/1.0/request",
        "~thread": { 
            "thid": "5678876542345",
            "pthid": "<id of invitation>"
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
    */
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
  rule receiveResponse {
    select when dido receiveResponse
    pre {

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


  //print out invitation
  //invitation message using RFC 0434 Out of Band
  //https://github.com/hyperledger/aries-rfcs/blob/main/features/0434-outofband/README.md
  rule create_invite {
    select when dido new_invitation //if it is not engine-ui or wrangler that call this what would call it??

    pre {
      peer_DID = create_peer_DID()
      //peer_DIDDoc = create_peer_DIDDoc(peer_DID)
    }

    //create the json here 
    if true then //Is this the right way to check those two are not empty??
    noop()
    fired {
      raise dido event "send_invite" attributes event:attrs.put({//??

        //invitation
        "peer_DID":peer_DID,
        "peer_DIDDoc":peer_DIDDoc,
      })
    } else {
      //we might not need to send peer_DID and peer_DIDDoc but we will have multiple did and did docs??
      raise dido event "failed_to_createInvite" attributes event:attrs.put({
        "failed_peer_DID":peer_DID,
        "failed_peer_DIDDoc":peer_DIDDoc,
      })
    }
  }
  

  //print invite 
  rule send_invite {
    select when dido send_invite

    pre {
      peer_DID = event:attr("peer_DID");
      peer_DIDDoc = event:attr("peer_DIDDoc");
    }

    if !peer_DID.isnull() && !peer_DIDDoc.isnull() then //Is this the right way to check those two are not empty??
    noop()
    fired {
      event:send({
        "@type": "https://didcomm.org/out-of-band/%VER/invitation",
        "@id": "<id used for context as pthid>",
        "label": "Invitation",
        "goal_code": "",
        "goal": "To establish a peep connection",
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
      })
    } else {
      raise did-o event "failed_to_createInvite" attributes event:attrs.put({
        "failed_peer_DID":peer_DID,
        "failed_peer_DIDDoc":peer_DIDDoc,
      })
    }

    /*
    {
      "@type": "https://didcomm.org/out-of-band/%VER/invitation",
      "@id": "<id used for context as pthid>",
      "label": "Invitation",
      "goal_code": "",
      "goal": "To establish a peep connection",
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
  }

  rule failed_create_invite {
    select when did-o failed_to_createInvite

    pre {
      peer_DID = event:attr("failed_peer_DID");
      peer_DIDDoc = event:attr("failed_peer_DIDDoc");
    }

    select when dido failed_to_createInvite
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