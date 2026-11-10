# dido library

> **Note:**
>
> Typically, you should not call functions on this module directly. Instead, you should use the [dido ruleset](/krl/libraries/dido/dido-ruleset) to utilize DIDComm v2 features in your rulesets.

[The dido library](https://github.com/Picolab/pico-engine/blob/didcomm-interop/packages/pico-engine-core/src/modules/dido.ts) implements DID management and DIDComm v2 messaging in the Pico Engine.

## Functions

### DID Management

Functions to manage DIDs.

#### generateDID( isInvite: bool )

Generates a new [peer method 2 DID](https://identity.foundation/peer-did-method-spec/#generation-method) and returns the associated `DIDDoc` object that contains information about the DID, including its authentication keys, key agreements, and service endpoints.

#### deleteDID( did: string )

Deletes the `DIDDoc` object associated with the specified DID from the `didDocs` entity.

Example DID: `did:peer:2.Ez6LSqTq8LtCukq6qra3N3TWm8qMGpoCsjP2nfLJ7KVrKntiT.Vz6MkermL6DEK8k5xQU5Q3vzLwNmCc3xRu6FRgjdZRYe39pPM.SeyJ0IjoiZG0iLCJzIjoiaHR0cDovL2xvY2FsaG9zdDozMDAwL3NreS9ldmVudC9jbGhxcnRvNHcwMDI1dXVxazhhM3djdnA4L25vbmUvZGlkby9kaWRjb21tdjJfbWVzc2FnZSIsImEiOlsiZGlkY29tbS92MiIsImRpZGNvbW0vYWlwMjtlbnY9cmZjNTg3Il19`

#### updateDID( did: string, newDoc: DIDDoc )

Updates the `DIDDoc` object associated with the specified DID in the `didDocs` entity. The function takes two parameters: the DID to be updated and the new `DIDDoc` object.

Example DID: `did:peer:2.Ez6LSqTq8LtCukq6qra3N3TWm8qMGpoCsjP2nfLJ7KVrKntiT.Vz6MkermL6DEK8k5xQU5Q3vzLwNmCc3xRu6FRgjdZRYe39pPM.SeyJ0IjoiZG0iLCJzIjoiaHR0cDovL2xvY2FsaG9zdDozMDAwL3NreS9ldmVudC9jbGhxcnRvNHcwMDI1dXVxazhhM3djdnA4L25vbmUvZGlkby9kaWRjb21tdjJfbWVzc2FnZSIsImEiOlsiZGlkY29tbS92MiIsImRpZGNvbW0vYWlwMjtlbnY9cmZjNTg3Il19`

Example DIDDoc:

```
  {
    "id": "did:peer:2.Ez6LSqTq8LtCukq6qra3N3TWm8qMGpoCsjP2nfLJ7KVrKntiT.Vz6MkermL6DEK8k5xQU5Q3vzLwNmCc3xRu6FRgjdZRYe39pPM.SeyJ0IjoiZG0iLCJzIjoiaHR0cDovL2xvY2FsaG9zdDozMDAwL3NreS9ldmVudC9jbGhxcnRvNHcwMDI1dXVxazhhM3djdnA4L25vbmUvZGlkby9kaWRjb21tdjJfbWVzc2FnZSIsImEiOlsiZGlkY29tbS92MiIsImRpZGNvbW0vYWlwMjtlbnY9cmZjNTg3Il19",
    "keyAgreement": [
      "did:peer:2.Ez6LSqTq8LtCukq6qra3N3TWm8qMGpoCsjP2nfLJ7KVrKntiT.Vz6MkermL6DEK8k5xQU5Q3vzLwNmCc3xRu6FRgjdZRYe39pPM.SeyJ0IjoiZG0iLCJzIjoiaHR0cDovL2xvY2FsaG9zdDozMDAwL3NreS9ldmVudC9jbGhxcnRvNHcwMDI1dXVxazhhM3djdnA4L25vbmUvZGlkby9kaWRjb21tdjJfbWVzc2FnZSIsImEiOlsiZGlkY29tbS92MiIsImRpZGNvbW0vYWlwMjtlbnY9cmZjNTg3Il19#6LSqTq8LtCukq6qra3N3TWm8qMGpoCsjP2nfLJ7KVrKntiT"
    ],
    "authentication": [
      "did:peer:2.Ez6LSqTq8LtCukq6qra3N3TWm8qMGpoCsjP2nfLJ7KVrKntiT.Vz6MkermL6DEK8k5xQU5Q3vzLwNmCc3xRu6FRgjdZRYe39pPM.SeyJ0IjoiZG0iLCJzIjoiaHR0cDovL2xvY2FsaG9zdDozMDAwL3NreS9ldmVudC9jbGhxcnRvNHcwMDI1dXVxazhhM3djdnA4L25vbmUvZGlkby9kaWRjb21tdjJfbWVzc2FnZSIsImEiOlsiZGlkY29tbS92MiIsImRpZGNvbW0vYWlwMjtlbnY9cmZjNTg3Il19#6MkermL6DEK8k5xQU5Q3vzLwNmCc3xRu6FRgjdZRYe39pPM"
    ],
    "verificationMethod": [
      {
        "id": "did:peer:2.Ez6LSqTq8LtCukq6qra3N3TWm8qMGpoCsjP2nfLJ7KVrKntiT.Vz6MkermL6DEK8k5xQU5Q3vzLwNmCc3xRu6FRgjdZRYe39pPM.SeyJ0IjoiZG0iLCJzIjoiaHR0cDovL2xvY2FsaG9zdDozMDAwL3NreS9ldmVudC9jbGhxcnRvNHcwMDI1dXVxazhhM3djdnA4L25vbmUvZGlkby9kaWRjb21tdjJfbWVzc2FnZSIsImEiOlsiZGlkY29tbS92MiIsImRpZGNvbW0vYWlwMjtlbnY9cmZjNTg3Il19#6LSqTq8LtCukq6qra3N3TWm8qMGpoCsjP2nfLJ7KVrKntiT",
        "type": "JsonWebKey2020",
        "controller": "did:peer:2.Ez6LSqTq8LtCukq6qra3N3TWm8qMGpoCsjP2nfLJ7KVrKntiT.Vz6MkermL6DEK8k5xQU5Q3vzLwNmCc3xRu6FRgjdZRYe39pPM.SeyJ0IjoiZG0iLCJzIjoiaHR0cDovL2xvY2FsaG9zdDozMDAwL3NreS9ldmVudC9jbGhxcnRvNHcwMDI1dXVxazhhM3djdnA4L25vbmUvZGlkby9kaWRjb21tdjJfbWVzc2FnZSIsImEiOlsiZGlkY29tbS92MiIsImRpZGNvbW0vYWlwMjtlbnY9cmZjNTg3Il19",
        "publicKeyJwk": {
          "crv": "X25519",
          "x": "zNn9niXYeCo9HL-R44eUCJp7nATHFvJC9stb-iZlJ1g",
          "kty": "OKP"
        }
      },
      {
        "id": "did:peer:2.Ez6LSqTq8LtCukq6qra3N3TWm8qMGpoCsjP2nfLJ7KVrKntiT.Vz6MkermL6DEK8k5xQU5Q3vzLwNmCc3xRu6FRgjdZRYe39pPM.SeyJ0IjoiZG0iLCJzIjoiaHR0cDovL2xvY2FsaG9zdDozMDAwL3NreS9ldmVudC9jbGhxcnRvNHcwMDI1dXVxazhhM3djdnA4L25vbmUvZGlkby9kaWRjb21tdjJfbWVzc2FnZSIsImEiOlsiZGlkY29tbS92MiIsImRpZGNvbW0vYWlwMjtlbnY9cmZjNTg3Il19#6MkermL6DEK8k5xQU5Q3vzLwNmCc3xRu6FRgjdZRYe39pPM",
        "type": "JsonWebKey2020",
        "controller": "did:peer:2.Ez6LSqTq8LtCukq6qra3N3TWm8qMGpoCsjP2nfLJ7KVrKntiT.Vz6MkermL6DEK8k5xQU5Q3vzLwNmCc3xRu6FRgjdZRYe39pPM.SeyJ0IjoiZG0iLCJzIjoiaHR0cDovL2xvY2FsaG9zdDozMDAwL3NreS9ldmVudC9jbGhxcnRvNHcwMDI1dXVxazhhM3djdnA4L25vbmUvZGlkby9kaWRjb21tdjJfbWVzc2FnZSIsImEiOlsiZGlkY29tbS92MiIsImRpZGNvbW0vYWlwMjtlbnY9cmZjNTg3Il19",
        "publicKeyJwk": {
          "crv": "Ed25519",
          "x": "BgV4faX5gxAR58a_R6rYF79uyMUZVen2TNg4KzH5v-w",
          "kty": "OKP"
        }
      }
    ],
    "service": [
      {
        "id": "did:peer:2.Ez6LSqTq8LtCukq6qra3N3TWm8qMGpoCsjP2nfLJ7KVrKntiT.Vz6MkermL6DEK8k5xQU5Q3vzLwNmCc3xRu6FRgjdZRYe39pPM.SeyJ0IjoiZG0iLCJzIjoiaHR0cDovL2xvY2FsaG9zdDozMDAwL3NreS9ldmVudC9jbGhxcnRvNHcwMDI1dXVxazhhM3djdnA4L25vbmUvZGlkby9kaWRjb21tdjJfbWVzc2FnZSIsImEiOlsiZGlkY29tbS92MiIsImRpZGNvbW0vYWlwMjtlbnY9cmZjNTg3Il19#didcommmessaging-0",
        "type": "DIDCommMessaging",
        "serviceEndpoint": {
          "uri": "http://localhost:3000/sky/event/clhqrto4w0025uuqk8a3wcvp8/none/dido/didcommv2_message",
          "accept": [
            "didcomm/v2",
            "didcomm/aip2;env=rfc587"
          ]
        }
      }
    ]
  }
```

#### rotateDID( old_did: string )

Creates a new DID to be rotated into use in place of `old_did` according to the [DIDComm v2 spec](https://identity.foundation/didcomm-messaging/spec/#did-rotation). Pending rotations in the `pendingRotations` entity are removed when a message is received using the new DID.

#### rotateInviteDID( my_did: string, their_did: string )

Manages DID rotation and storage for accepting invitations via the [Trust Ping Protocol](https://identity.foundation/didcomm-messaging/spec/#trust-ping-protocol-20) and [from_prior DID Rotation](https://identity.foundation/didcomm-messaging/spec/#did-rotation).

#### clearPendingRotations()

Deletes all entries from the `pendingRotations` entity. Pending rotations are created by [rotating a DID](https://picolabs.atlassian.net/wiki/spaces/docs/pages/2409824291/dido+library#dido%3ArotateDID(-old_did%3A-string-)).

#### mapDid( their_did: string, my_did: string )

Adds an entry to the `didMap` entity in the following form:

```
{ their_did: my_did }
```

#### updateDidMap( old_did: string, new_did: string )

Replaces all occurrences of `old_did` with `new_did` in the `didMap` entity.

> **Note:**
>
> **updateDidMap** is not exported from the module and is only a helper function for other functions. This means that you **cannot** call this function outside of the dido typescript module.

#### clearDidMap()

Deletes all entries from the `didMap` entity.

#### clearDidDocs()

Deletes all entries from the `didDocs` entity.

#### JWKFromMultibase( multibase: string, crv: string )

Returns a JSON Web Key (JWK) from the given [multibase encoded string](https://github.com/multiformats/multibase/blob/master/README.md) and curve.

> **Note:**
>
> **JWKFromMultibase** is not exported from the module and is only a helper function for other functions. This means that you **cannot** call this function outside of the dido typescript module.

#### storeDidDoc( input: any )

If `input` is of type `DIDDoc` it is stored in the `didDocs` entity variable, else the input is attempted to be parsed as a [peer method 2 DID](https://identity.foundation/peer-did-method-spec/#generation-method) into a `DIDDoc` and is stored the same way. If parsing fails, an error is logged. On successful storage, the stored `DIDDoc` is returned.

#### resolvePeer2Did( did: string )

Attempts to resolve a [peer method 2 DID](https://identity.foundation/peer-did-method-spec/#generation-method) into a `DIDDoc` object and returns that object.

> **Note:**
>
> **resolvePeer2Did** is not exported from the module and is only a helper function for other functions. This means that you **cannot** call this function outside of the dido typescript module.

### DIDComm

Functions to manage DIDComm operations.

#### unpack( message: any )

Attempts to unpack (decrypt) an encrypted JSON Web Message (JWM) using the stored secrets. Returns a tuple of the unpacked message and metadata (`[Message, UnpackMetadata]`). Refer to [didcomm-node package](https://github.com/sicpa-dlab/didcomm-rust/tree/main/wasm) for details.

#### pack( message: IMessage, from: string, to: string )

Attempts to pack (encrypt) a `message` `from` the sender’s DID `to` the receiver's DID and returns the encrypted message.

#### addRoute( type: string, domain: string, rule: string )

Add a route to the `routes` entity that is used for routing incoming DIDComm v2 messages. `type` is the [type of the DIDComm v2 message](https://identity.foundation/didcomm-messaging/spec/#message-type-uri). `domain` is the domain of the event that is raised when a message of type `type` is received. `rule` is the rule name of the event that is raised when a message of type `type` is received.

#### route( message: string )

Unpacks the incoming message and raises the corresponding event according to the `type` of the message as defined in the `routes` entity variable.

#### send( did: string, message: any )

Packs the given `message` and sends it to the endpoint of the given `did`. This function utilizes the [autosend](/krl/libraries/http) feature of the http library. To subscribe to these responses, create a rule that selects on `dido dido_send_response`.

#### prepareQuery( did: string, query: any )

This function is used by the `wrangler:picoQuery` function to send a `query` using a `did`.

#### sendQuery( did: string, message: any )

Very similar to [dido:send](https://picolabs.atlassian.net/wiki/spaces/docs/pages/2409824291/dido+library#send(-did%3A-string%2C-message%3A-any-)), except that it waits for and returns the http response.

#### generateMessage( messageOptions )

Generates and returns a DIDComm v2 message with the given `messageOptions`. `messageOptions` is formatted as follows:

```
{
  type: string,
  body: any,
  from?: string,
  to?: Array<string>,
  thid?: string,
  pthid?: string,
  expires_time?: number,
  attachments?: Array<Attachment>
}
```

> **Note:**
>
> The question mark after a field name signifies that it is an optional parameter.

Refer to [didcomm-node package for Attachment object specifics](https://github.com/sicpa-dlab/didcomm-rust/blob/main/wasm/src/message/mod.rs#L146).

#### createInviteUrl( base64: string )

Creates and returns the invitation URL for the given `base64` invite.

### Channels

Functions for managing channels associated with DIDs.

#### addLabelsToChannel( eci: string, labels: any )

Concatenates `lables` to the labels of the channel with the given `eci`.

#### deleteDIDChannel( did: string )

Deletes any channel associated with the given `did`.

> **Note:**
>
> **deleteDIDChannel** is not exported from the module and is only a helper function for other functions. This means that you **cannot** call this function outside of the dido typescript module.

#### normalizeDID( did: string )

Returns a channel label friendly version of the given `did`. (Replaces `:` and `.` with `-`)

> **Note:**
>
> **normalizeDID** is not exported from the module and is only a helper function for other functions. This means that you **cannot** call this function outside of the dido typescript module.

## Classes

#### PicoDIDResolver

This class implements the `DIDResolver` interface, provided by the [didcomm-node package](https://github.com/sicpa-dlab/didcomm-rust/blob/main/wasm/demo/src/main.ts#L17), used for resolving DIDs for packing and unpacking messages.

#### PicoSecretsResolver

This class implements the `SecretsResolver` interface, provided by the [didcomm-node package](https://github.com/sicpa-dlab/didcomm-rust/blob/main/wasm/demo/src/main.ts#L29), used for retrieving secrets for packing and unpacking messages.

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/2409824291) (last edited there 2023-05-17).</small>
