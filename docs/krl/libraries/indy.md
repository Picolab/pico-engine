# indy

The indy library provides functions needed to use the HyperLedger Indy wire protocol. Messages in this protocol (whose mime type is "`application/ssi-agent-wire`") are sent in a "packed" format, which includes specified encryption and signing. Since it is not possible to produce and consume these formats directly from KRL, the `indy` library fills in the missing functionality.

# Packing and Unpacking wire messages

#### **pack**

Requires a message, the public key of the intended recipient, and our ECI ([event channel identifier](https://picolabs.atlassian.net/wiki/display/docs/Event+Channels)), and returns a map which is suitable for an `http:post` to another Indy Agent. Shown here are a sample Indy message, a call to `indy:pack` to produce the packed format of that message, and what the packed format looks like:

```
    message = {
      "@type":"did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/basicmessage/1.0/message",
      "~l10n":{"locale":"en"},
      "sent_time":"2019-03-16T17:22:23.331Z",
      "content":"cupcake"
    }
    pm = indy:pack(message,[publicKey],meta:eci)
    // { "protected": "eyJlbmMiOiJ4Y2hhY2hhMjBwb2x5MTMwNV9pZXRmIiwidHlwIjoiSldNLzEuMCIsImFsZyI6IkF1d...ZTUlfYVAifX1dfQ==",
    //   "iv": "C3KCoNmLCJ35z0K-",
    //   "ciphertext": "1Nj2jTTzT_ztIAPUgD7hqkupb2t3_FEjIVbepL0jK-ohGOuOY7lT6oJA1QyItAjusk5XLgIrqRI0...28e9OafW7iph2Fm8Ij-FieU=",
    //   "tag": "lwblT6uFSRwEJz3odAwYmQ=="
    // }
```

The original message is signed and encrypted using the private key associated with the ECI (aka [DID (Distributed IDentifier)](https://identity.foundation/)).

In practice, once a message has been packed, it will be sent to the service endpoint of the other Indy Agent:

```
    http:post(
      service_endpoint,
      body=pm,
      headers={"content-type":"application/ssi-agent-wire"}
    ) setting(http_response)
```

The content-type should be "application/ssi-agent-wire".

#### **unpack**

Requires a packed message, and our ECI. A packed message, when received by an event, includes `"protected"`, `"iv"`, `"ciphertext"`, and `"tag"` as [event attributes](/krl/rulesets/rules/prelude/event-attributes), and the attributes are suitable for direct use in calling the `unpack` function. Again, our ECI is a distributed identifier, which includes its private key, used to decrypt the incoming message.

```
      all = indy:unpack(event:attrs,meta:eci)
      their_key = all{"sender_key"}
      my_key = all{"recipient_key"}
      msg = all{"message"}.decode()
```

An unpacked message might look like this:

```
    all == {
      "message":"{\"@type\": \"did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/basicmessage/1.0/message\", ...\"content\": \"Reply with: cupcake\"}",
      "sender_key":"6VNjQc2JDG1S8vQK4fn8A16WXbUDPzk436MumpQfdEsd",
      "recipient_key":"GLtgnUci67EVb834ErDRWyx8ub3S7aMLs7At5TqPQCZH"
    }
```

Notice the use of the [String operator](/krl/krl-expression-language/operators/string-operators) `decode()` to produce the original message as a map:

```
{
  "@type": "did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/basicmessage/1.0/message",
  "~l10n": {"locale": "en"},
  "sent_time": "2019-03-16 17:22:23.285831+00:00",
  "content": "Reply with: cupcake"
}
```

# Signing and verifying message fields

Indy Agent messages can be produced and verified using the `org.sovrin.agent_message` ruleset. It is available [here](https://github.com/Picolab/G2S/blob/master/krl/org.sovrin.agent_message.krl) on GitHub, and excerpts from its code are included below to show how the remaining functions in the `indy` library are used.

## Verifying a signed message field

#### **verify_signed_field**

Some incoming messages have signed fields. These need to be verified and reconstituted. A message with a signed field looks like this:

```
message = {
  "@type":"did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/connections/1.0/response",
  "@id":"ec605c32-cdb4-4996-8e9f-62e729a42511",
  "~thread":{"thid":"cjtbre54y0028xophca46882p"},
  "connection~sig":{
    "@type":"did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/signature/1.0/ed25519Sha512_single",
    "signer":"B2gZj1vuTPSK1gNsvMT2w2SsTypLKMzamS6Jx9gvt9tD",
    "sig_data":"AAAAAFyNMM97IkRJRCI6ICJCNTh4cTNjeW5rRnRtM2NGckY4R3VBIiwgIkRJRERvYyI6...DozMDAwL2luZHkifV19fQ==",
    "signature":"SxGV0ZP9g8mzH9_otdxj2VXwjzvH3rhwd9oZI_Cs8wuasFbqyInKMeJm6PplBqHlOGiFrqMxYz64jEw5n0hGCw=="
  }
}
```

The ruleset `org.sovrin.agent_message` uses the `indy:verify_signed_field` function to replace the signed field with a verified field of (nearly) the same name:

```
    verify_signed_field = function(signed_field){
      answer = indy:verify_signed_field(signed_field).klog("answer");
      timestamp = answer{"timestamp"}
        .values()
        .reduce(function(a,dig){a*256+dig});
      answer{"sig_verified"}
        => answer{"field"}.decode().put("timestamp",time:new(timestamp))
        | null
    }
    verify_signatures = function(map){
      map >< "connection~sig"
        => map.put("connection",verify_signed_field(map{"connection~sig"}))
         | map
    }
```

The `indy:verify_signed_field` function takes in the signed field, and returns a map like the following one:

```
{
  "sig_verified":true,
  "field":"{\"DID\": \"B58xq3cynkFtm3cFrF8GuA\", \"DIDDoc\": {\"@context\": \"https://w3id.org/did/v1\", ...}}",
  "timestamp":[0,0,0,0,92,141,48,207]
}
```

It is recommended to use the `org.sovrin.agent_message` ruleset rather than using this function directly. The [ruleset can be used as a module](/krl/user-defined-modules), and `provides` the `verify_signatures` function, which can be used on incoming messages.

## Signing a message field

Producing a signed field is also done in the `org.sovrin.agent_message` ruleset, by this function:

```
    sign_field = function(my_did,my_vk,field){
      timestamp_bytes = toByteArray(time:now().time:strftime("%s"));
      sig_data_bytes = timestamp_bytes
        .append(field.encode().split("").map(function(x){ord(x)}));
      {
        "@type": t_sign_single,
        "signature": indy:crypto_sign(sig_data_bytes,my_did),
        "signer": my_vk,
        "sig_data": indy:sig_data(sig_data_bytes)
      }
    }
```

#### **sig_data**

This `indy` library function is used in line 9 of the `sign_field` function, to convert the KRL byte array (produced in lines 4-5) into a Base64 encoded string, as required by the wire protocol. It is recommended to use the `org.sovrin.agent_message` ruleset rather than using this function directly.

#### **crypto_sign**

This `indy` library function requires a byte array and our ECI. It produces the `signature` required in a signed field, based on the data to be signed and our private key (associated with our DID (aka ECI)). This signature is incorporated into the signed field in line 7 of the `sign_field` function. It is recommended to use the `org.sovrin.agent_message` ruleset rather than using this function directly.

### Producing the data byte array

The first eight bytes of the data are reserved for a timestamp. We produce this as an eight byte (big-endian) number of seconds since the start of the current epoch.

These bytes are produced by line 2 of the `sign_field` function. The `toByteArray` function this line uses is described in more detail in the page [Looping using the reduce operator](https://picolabs.atlassian.net/wiki/display/docs/Looping+using+the+reduce+operator).

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/720961537) (last edited there 2019-03-16).</small>
