# engine

> **not present in 1.0:**
>
> This library is not a part of version 1.0 of the pico-engine

## Functions

### getPicoIDByECI

Given an eci, get the pico_id that owns that channel.

| Parameter | Datatype | Required |
| --- | --- | --- |
| &lt;eci> | &lt;string> | YES |

```
pico_id = engine:getPicoIDByECI(eci)
/*
    "some_pico_id"
*/
```

### getParent

Get the parent's pico_id for the current or given pico_id.

| Parameter | Datatype | Required | Default |
| --- | --- | --- | --- |
| &lt;pico_id> | &lt;string> | NO | the running pico_id |

```
parent_id = engine:getParent(pico_id)
/*
	"the parent's pico_id"
*/
```

### listChildren

List the pico's children pico_ids.

| Parameter | Datatype | Required | Default |
| --- | --- | --- | --- |
| &lt;pico_id> | &lt;string> | NO | the running pico_id |

```
children = engine:listChildren(pico_id)
/*
  [
    "child 0 pico_id",
    "child 1 pico_id",
    ...
  ]
*/
```

### listPolicies

List all the engine policies.

```
policies = engine:listPolicies()
/*
  [
    {id: "1234", name: "policy 1", event: {allow: [...]} query: ...},
    {id: "4321", name: "policy 2", event: {allow: [...]} query: ...},
    {id: "5555", name: "policy 3", event: {allow: [...]} query: ...},
  ]
*/
```

### listChannels

List the pico's channels.

| Parameter | Datatype | Required | Default |
| --- | --- | --- | --- |
| &lt;pico_id> | &lt;string> | NO | the running pico_id |

```
channels = engine:listChannels(pico_id)
/*
	[
      {
        "id" : "eci-0...",
        "pico_id": <pico_id>,
        "name": "name 0",
        "type": "type 0"
      },
      {
        "id" : "eci-1...",
        "pico_id": <pico_id>,
        "name": "name 1",
        "type": "type 1"
      }
    ]
*/
```

### listInstalledRIDs

List the rid's installed on the pico.

| Parameter | Datatype | Required | Default |
| --- | --- | --- | --- |
| &lt;pico_id> | &lt;string> | NO | the running pico_id |

```
rids = engine:listInstalledRIDs(pico_id)
/*
  ["io.picolabs.pico", ...]

*/
```

### listAllEnabledRIDs

List all enabled ruleset ids. No parameters are given.

```
rids = engine:listAllEnabledRIDs();
/*
	["io.picolabs.pico", "io.picolabs.logging"]
*/
```

### describeRuleset

Given a ruleset id, get more information about it.

| Parameter | Datatype | Required |
| --- | --- | --- |
| &lt;rid> | &lt;string> | YES |

```
desc = engine:describeRuleset("io.picolabs.hello_world");
/*
    {
        "rid": "io.picolabs.hello_world",
        "src": "ruleset io.picolabs.hello_world{ ...<cut for brevity> ... }",
        "hash": "a096f2f3bfbd63e54bf4f39081814dbc895f3f003ae9918dbe24aec8acc097b9",
        "url": "https://raw.githubusercontent.com/Picolab/node-pico-engine-core/master/test-rulesets/hello-world.krl",
        "timestamp_stored": "2017-05-17T21:31:21.663Z",
        "timestamp_enable": "2017-05-17T21:31:21.663Z",
        "meta": {
            "name": "Hello World",
            "description": "\nA first ruleset for the Quickstart\n    ",
            "author": "Phil Windley"
        }
    }
*/
```

### encryptChannelMessage

Encrypt a message sent over a channel

| Parameter | Datatype | Required |
| --- | --- | --- |
| &lt;eci> | &lt;string> | YES |
| &lt;encryptedMessage> | &lt;string> | YES |
| &lt;nonce> | &lt;string> | YES |
| &lt;otherPublicKey> | &lt;string> | YES |

```
 encrypted_message = engine:encryptChannelMessage(eci, message, subscription.other_encryption_public_key)
/*
	{
		"encryptedMessage" : <base 58 encrypted message>,
        "nonce" : <base 58 nonce used to encrypt message>,
	}
*/
```

### decryptChannelMessage

Encrypt a message sent over a channel

| Parameter | Datatype | Required |
| --- | --- | --- |
| &lt;eci> | &lt;string> | YES |
| &lt;message> | &lt;string> | YES |
| &lt;otherPublicKey> | &lt;string> | YES |

```
decrypted_message = engine:decryptChannelMessage(eci, encrypted_message, nonce, other_encryption_public_key)

/*
	// The decrypted message if successfully decrypted, false otherwise
*/
```

### signChannelMessage

SIgn a message sent over a channel

| Parameter | Datatype | Required |
| --- | --- | --- |
| &lt;eci> | &lt;string> | YES |
| &lt;message> | &lt;string> | YES |

```
signed_message = engine:signChannelMessage(eci, message)
/*
	// Base 58 encoded string that is the signed message
*/
```

### verifySignedMessage

Verify a message sent over a channel

| Parameter | Datatype | Required |
| --- | --- | --- |
| &lt;verifyKey> | &lt;string> | YES |
| &lt;message> | &lt;string> | YES |

```
verifiedMessage = engine:verifySignedMessage(verify_key, signedMessage)
/*
	// The original message if verified, false otherwise
*/
```

## Actions

### `newPico`

Creates a new pico.

| Parameter | Datatype | Required | Default |
| --- | --- | --- | --- |
| &lt;parent_id> | &lt;string> | NO | the running pico_id |

```
engine:newPico() setting(resp)
/*
	{
		"id" : <new_pico_id>,
        "parent_id" : <current pico_id>,
	}
*/
```

Note: newPico does not provide an eci. This action is used in conjunction with engine:createChannel to create a pico with both an id and eci. See wranglerNPE.krl for an example of how to fully create a pico according to a given prototype.

### removePico

| Parameter | Datatype | Required | Default |
| --- | --- | --- | --- |
| &lt;pico_id> | &lt;string> | NO | the running pico_id |

```
engine:removePico(id)
```

### newPolicy

Creates a new policy.

| Parameter | Datatype | Required |
| --- | --- | --- |
| &lt;policy> | &lt;map> | YES |

```
engine:newPolicy({
    name: "only allow foo/bar events",
    event: {
        allow: [
            {domain: "foo", type: "bar"}
        ]
    }
}) setting(resp)
/*
	{
        id: "1234",
    	name: "only allow foo/bar events",
        event: {
            allow: [{domain: "foo", type: "bar"}],
            deny: [],
        },
        query: {allow: [], deny: []}
	}
*/
```

For more description on how these policies work see: <https://github.com/Picolab/pico-engine/pull/350#issue-160657235>

### removePolicy

Removes a policy. It will error if any channels are still using it.

| Parameter | Datatype | Required |
| --- | --- | --- |
| &lt;policy_id> | &lt;string> | YES |

```
engine:removePolicy("1234")
```

### newChannel

Creates a new channel for a pico.

| Parameter | Datatype | Required | Default |
| --- | --- | --- | --- |
| &lt;pico_id> | &lt;string> | NO | the running pico_id |
| &lt;name> | &lt;string> | YES |  |
| &lt;type> | &lt;string> | YES |  |
| &lt;policy_id> | &lt;string> | YES |  |

```
engine:newChannel(name = "channel_name", type = "channel_type", policy_id = "1234") setting(resp)
/*
	{
		"id" : <new_eci>,
        "pico_id": <pico_id>,
		"name": "channel_name",
		"type": "channel_type",
		"policy_id": "1234"
 	}
*/
```

Note: "id" in the resp body is the given pico's new channel eci, not the original id passed into the function.

### removeChannel

Removes a channel whose eci matches the provided eci.

| Parameter | Datatype | Required |
| --- | --- | --- |
| &lt;eci> | &lt;string> | YES |

```
engine:removeChannel("eci123...")
```

### registerRuleset

| Parameter | Datatype | Required |
| --- | --- | --- |
| &lt;url> | &lt;string> | YES |
| &lt;base> | &lt;string> | NO |

Fetch the ruleset krl code given by the `url` and register in the engine.

If you provide `base` then it will be resolved with the url. For example, `base` is  "http://raw.githubusercontent.com/" and `url` is "/username/repository1/file.txt" then the engine will register `http://raw.githubusercontent.com/username/repository1/file.txt`

Attempting to register a ruleset with the same rid as a rule that is already registered will pull the ruleset from the given base/url and act as an update action, overwriting the current file with the one from the remote repository.

If you register a ruleset sharing a rid with a system ruleset, the system ruleset will be restored when the engine is restarted.

```
engine:registerRuleset("some.cool.ruleset.krl", base = "http://example.com/krl-files/") setting(resp)
/*
    "some.cool.ruleset.id"
*/
```

### unregisterRuleset

Unregisters the ruleset given by the rid, or list of rids. It will throw an error if the ruleset is installed on any picos, or depended on by another ruleset.

| Parameter | Datatype | Required |
| --- | --- | --- |
| &lt;rid> | string | array | YES |

```
engine:unregisterRuleset("myRuleset")

engine:unregisterRuleset(["rid.1", "rid.2"])
```

### installRuleset

Installs ruleset(s) into a pico.

| Parameter | Datatype | Required | Default |
| --- | --- | --- | --- |
| &lt;pico_id> | &lt;string> | NO | the running pico_id |
| &lt;rid> | string | array | NO |  |
| &lt;url> | &lt;string> | NO |  |
| &lt;base> | &lt;string> | NO |  |

The "base" key will have a value that contains the domain name where your krl file is located. ex:  "<http://raw.githubusercontent.com>"

The "url" key will complete the path appended to the base. ex: "/repository1/file.txt"

There are three options provided for a successful install with these parameters:
1) You may provide the "rid" (excluding the "base" and "url" keys) if you know that the ruleset is *already* registered with the engine.
2) Provide the base and url in their respective parts as described above.
3) Just provide the full url (in the "url" key) where your ruleset is located, leaving the "base" undefined or as an empty string.

Do *not* provide the "rid" key if you want to retrieve the krl file from a remote repository (just provide the "base" and "url" keys). If you provide the "rid" key at all, this function will assume the ruleset is already registered with the engine and will simply throw an error if it is not found, ignoring the "base" and "url" as if they were not submitted. If the "base" and "url" are provided, then the krl file will be registered to the engine (if not already) and then installed on the pico with the given "pico_id".

```
engine:installRuleset( ent:id, "wrangler" ) setting(resp)
/*
    "wrangler"
*/

engine:installRuleset( ent:id, ["wrangler","Pds"] ) setting(resp)
/*
    ["wrangler","Pds"]
*/

engine:installRuleset( ent:id, base = <base>, url = <url> ) setting(resp)
/*
    "the.rid.at.that.url"
*/
```

### uninstallRuleset

uninstall a ruleset from a pico.

| Parameter | Datatype | Required | Default |
| --- | --- | --- | --- |
| &lt;pico_id> | &lt;string> | NO | the running pico_id |
| &lt;rid> | string | array | YES |  |

This does not return anything

```
engine:uninstallRuleset( rid = "myRuleset")

engine:uninstallRuleset( meta:picoId, ["rid.1", "rid.2"])
```

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/32947818) (last edited there 2021-01-12).</small>
