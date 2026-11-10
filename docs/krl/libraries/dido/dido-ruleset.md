# dido ruleset

[This ruleset](https://github.com/Picolab/pico-engine/blob/didcomm-interop/packages/pico-engine/krl/io.picolabs.did-o.krl) has been designed to facilitate the implementation of [DIDComm v2 protocols](https://identity.foundation/didcomm-messaging/spec/). As it stands currently, it only supports [out-of-band invitations](https://identity.foundation/didcomm-messaging/spec/#invitation), the [trust ping protocol](https://identity.foundation/didcomm-messaging/spec/#trust-ping-protocol-20), and [did rotation using the from_prior field](https://identity.foundation/didcomm-messaging/spec/#did-rotation). It serves as a comprehensive illustration of the [dido.ts library](/krl/libraries/dido/dido-library) and can be immensely beneficial for integrating additional protocols. The following is an explanation of the different rules and methods in the dido ruleset, `io.picolabs.did-o.krl`, to aid with further comprehension.

## How To Use

A developer might follow these instructions to use the `io.picolabs.did-o.krl` ruleset.

1. Call the `dido:generate_invitation()` function to create an invitation for the pico.
2. Send the invitation to another pico via a secure channel.
3. Once the other pico receives the invitation, it can start the connection by raising the `dido:receive_invite` event with `event:attrs{"invite"}` set to the invite URL.
4. At this point, the connection is complete, and the picos can use DIDComm to communicate securely. To raise events via DIDComm, call `event:send()` specifying a `did` instead of an `eci`.

## Functions

### addRoute(type, domain, name)

Add a route to the routes stored in the [dido.ts](/krl/libraries/dido/dido-library) library. The `type` should be a [valid Protocol URI](https://identity.foundation/didcomm-messaging/spec/#protocols). The `domain` and `name` are the domain and name of the event that will be raised when a message of the specified type is received.

```
// The io.picolabs.did-o ruleset was imported in this example with an alias of didx
route0 = didx:addRoute("did:sov:SLfEi9esrjzybysFxQZbfq;spec/tictactoe/1.0/move", "tictactoe", "receive_move") // Example from TicTacToe ruleset
```

Routes are used to extend the DIDComm protocol and guide didcomm_v2 messages to their proper rules in a ruleset.

### routes()

Queries the existing routes.

```
routes = dido:routes()
```

### send(did, message)

Send a message to the specified DID. `did` is the recipient DID and `message` is a [valid DIDComm v2 message](https://identity.foundation/didcomm-messaging/spec/#plaintext-message-structure).

```
// The io.picolabs.did-o ruleset was imported in this example with an alias of didx
didx:send(game{"did"}, message) // Example from TicTacToe ruleset
```

### sendEvent(did, event)

Send an event to the specified DID. `did` is the recipient DID and the `event` is formatted as follows:

```
event = {
  "domain": domain: string,
  "name": name: string,
  "attrs": attrs: {[name: string]: any}
}
dido:sendEvent(did, event)
```

### sendQuery(did, query)

Send a query to the specified DID. `did` is the recipient DID and the `query` is formatted as follows:

```
query = {
  "rid": rid: string,
  "name": name: string,
  "args": args: {[name: string]: any}
}
response = dido:sendQuery(did, query)
```

### didMap()

Return the map of DID relationships stored in the pattern `[ thier_did : your_did ]`.

```
map = dido:didMap()
```

### clearDidMap()

Clear the map of DID relationships.

```
// the map of DID relationships is empty after the call to the function
dido:clearDidMap()
```

### didDocs()

Return all the DIDs and DIDDocs stored in the pattern `[ did : diddoc ]`.

```
docs = dido:didDocs()
```

### clearDidDocs()

Clear all the DIDs and DIDDocs.

```
// the map of DIDDocs is empty after the call to the function
dido:clearDidDocs()
```

### pendingRotations()

Return all the pending rotations stored in the pattern `[ new_did : from_prior ]`.

```
pendingRotations = dido:pendingRotations()
```

### clearPendingRotations()

Clear all the pending rotations.

```
// the map of pending rotations is empty after the call to the function
dido:clearPendingRotations()
```

### generate_invitation()

Creates an invitation OOB URL that can be used to establish DID based relationships. This automates the DID, channel, and message creation and encodes it into a base64 Out-of-Band URL.

```
invitation = generate_invitation()
```

### generate_trust_ping_message(to)

Creates a trust ping message according to the [DIDComm v2 protocol](https://identity.foundation/didcomm-messaging/spec/#trust-ping-protocol-20) and returns it. The `to` parameter is the DID of the recipient.

```
ping = generate_trust_ping_message(their_did)
```

### generate_trust_ping_response(thid, to)

Creates a trust ping response message according to the [DIDComm v2 protocol](https://identity.foundation/didcomm-messaging/spec/#trust-ping-protocol-20) and returns it. The `thid` parameter is the id of the ping that you are responding to, and the `to` parameter is the DID of the recipient.

```
response = generate_trust_ping_response(ping{"id"}, their_did)
```

## Rules

### initialize

The initialize rule subscribes to the `wrangler:ruleset_installed` event and is called when the ruleset is installed and initializes the routes.

### pico_root_created

The pico_root_created rule subscribes to the `engine_ui:setup` event and is called when the engine starts and initializes the routes. This is used in addition to the initialize rule to verify routes exist when a new engine is started.

### route_message

The route_message rule subscribes to the `dido:didcommv2_message` event. It calls the dido library, unpacks the message, and looks for the proper route based on the message type. It then raises the appropriate event and passes along the unpacked message.

### receive_invite

The receive_invite rule subscribes to the `dido:receive_invite` event and receives an invite URL (`example.com/invite?_oob=abc...123`) from `event:attrs{"invite"}`. The invite URL is a base 64 encoded invite. The rule then creates a new DID and channel. After that, it raises the `dido:send_trust_ping` event.

### send_trust_ping

The send_trust_ping rule subscribes to the `dido:send_trust_ping` event and requires the DID of the recipient from `event:attrs{"did"}`. It then sends a generated trust ping message to the provided DID.

### receive_trust_ping

The receive_trust_ping rule subscibes to the `did:receive_trust_ping` event and requires the ping message from `event:attrs{"message"}`. It then checks if the message was received from an invite. If it was, it rotates the invite DID. Then it generates the response and sends it back.

## Example Using The Testing Tab To Establish DID Relationships

To create a DID relationship you first need to create an invite. You can do this in the testing tab by querying `generate_invitation`.

![](/krl/_media/2408808458-image-20230504-180227.png)

The results will contain your invite URL.

`"https://example.com/invite?_oob=eyJAdHlwZSI6ImRpZDpzb3Y...FuZ2UvMS4wIl19"`

The invite URL can be passed on to another pico where they will paste in the invite and raise the `dido:receive_invite` event.

![](/krl/_media/2408808458-image-20230504-181012.png)

### DID it work?

If the exchange is completed properly the logs should contain no errors and your new DIDs should be seen in the `didDocs` and `didMap`.

![](/krl/_media/2408808458-image-20230504-180402.png)![](/krl/_media/2408808458-image-20230504-180434.png)

You should find your DID and the requester's DID

Try a trust ping with `dido:sent_trust_ping` using their DID

![](/krl/_media/2408808458-image-20230327-012708.png)

If you receive a `trust_ping_response` you've got a connection and it's working! You can see this in the logs

![](/krl/_media/2408808458-image-20230504-180745.png)

## Adding More DIDComm Protocols

Refer to the [tic tac toe ruleset](/krl/libraries/dido/tic-tac-toe-ruleset) for an example of adding additional DIDComm protocols.

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/2408808458) (last edited there 2023-05-16).</small>
