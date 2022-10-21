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