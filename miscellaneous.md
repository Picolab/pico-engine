command to delete log file of pico engine
`rm -rf ~/.pico-engine/`

command to start pico 
`npm run start`


when there has been a change in the typescrip engine code we need to do this before we do npm run start
`npm run build`




________________________________________________________________________________________________________________________________________________

Old Comments:
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

  //invitation message using RFC 0434 Out of Band: https://github.com/hyperledger/aries-rfcs/blob/main/features/0434-outofband/README.md