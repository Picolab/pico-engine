# Pico Engine DIDCommV2 Message Types

> **Note:**
>
> The following message examples are not complete DIDCommV2 messages. See the [DIDCommV2 message specification](https://identity.foundation/didcomm-messaging/spec/#plaintext-message-structure) for more details.

## Events

Pico events sent by means of DIDCommV2 are expected to conform the following JSON message example:

```
{
    "type": "https://picolabs.io/event/1.0/event",
    "body": {
      "domain": "wrangler",                // Domain of event
      "name": "channel_deletion_request",  // Name of event
      "attrs": {
        "eci": "12345abcde"                // Attributes to pass to event
      }
    }
}
```

## Queries

Pico queries sent by means of DIDCommV2 are expected to conform the following JSON message example:

```
{
    "type": "https://picolabs.io/query/1.0/query",
    "body": {
      "rid": "io.picolabs.wrangler",  // Ruleset ID to query
      "name": "channels",             // Name of function to query
      "args": {
        "tags": "test"                // Arguments to pass to queried function
      }
    }
}
```

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/2421817349) (last edited there 2023-06-01).</small>
