/**
 * DIDO V 1.0.0
 * Authored by Rembrand Paul Pardo, Kekoapoaono Montalbo, Josh Mann
 */

import { krl } from "krl-stdlib";
import { Message, DIDDoc, DIDResolver, Secret, SecretsResolver, VerificationMethod, IMessage, PackEncryptedMetadata, UnpackMetadata, Attachment, IFromPrior, FromPrior } from "didcomm-node";
import * as cuid from "cuid";
const bs58 = require('bs58');
const sodium = require('libsodium-wrappers')
const crypto = require('crypto')
const didregex = /^did:peer:(([01](z)([1-9a-km-zA-HJ-NP-Z]{46,47}))|(2((\.[AEVID](z)([1-9a-km-zA-HJ-NP-Z]{46,47}))+(\.(S)[0-9a-zA-Z=]*)?)))$/
const QUERY_TIMEOUT = 10000;

// DID Functions
//#region DID Management

/**
 * Generates a new peer method 2 DID and returns the associated DIDDoc object that contains information about the DID, 
 * including its authentication keys, key agreements, and service endpoints.
 */
const generateDID = krl.Function(['isInvite'], async function (isInvite = false): Promise<DIDDoc> {
    // Create channel for new did
    const conf = {
        eventPolicy: {
            allow: [
                { domain: "dido", name: "didcommv2_message" },
                { domain: "dido", name: "dido_send_response" }
            ],
            deny: []
        },
        queryPolicy: {
            allow: [{ rid: this.rsCtx.ruleset.rid, name: "*" }],
            deny: []
        },
        tags: isInvite ? ["did_invite"] : []
    };
    const channel = await this.rsCtx.newChannel(conf);
    const endpoint = `${this.module("meta")!["host"](this)}/sky/event/${channel.id}/none/dido/didcommv2_message`;

    // Create keypairs for new did
    const encryptionKeyPair = await crypto.generateKeyPairSync("x25519", {
        publicKeyEncoding: {
            type: 'spki',
            format: 'jwk'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'jwk',
        }
    });
    const signingKeyPair = await crypto.generateKeyPairSync("ed25519", {
        publicKeyEncoding: {
            type: 'spki',
            format: 'jwk'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'jwk',
        }
    });
    const encryptionPublicKeyMultiCodec = new Uint8Array(Buffer.from(sodium.from_base64(encryptionKeyPair.publicKey.x)).length + 2);
    encryptionPublicKeyMultiCodec.set([0xec, 0x01]);
    encryptionPublicKeyMultiCodec.set(Buffer.from(sodium.from_base64(encryptionKeyPair.publicKey.x)), 2);
    const base58EncryptionPublicKey = bs58.encode(Buffer.from(encryptionPublicKeyMultiCodec));
    const signingPublicKeyMultiCodec = new Uint8Array(Buffer.from(sodium.from_base64(signingKeyPair.publicKey.x)).length + 2);
    signingPublicKeyMultiCodec.set([0xed, 0x01]);
    signingPublicKeyMultiCodec.set(Buffer.from(sodium.from_base64(signingKeyPair.publicKey.x)), 2);
    const base58SigningPublicKey = bs58.encode(Buffer.from(signingPublicKeyMultiCodec));

    // Create Peer Method 2 DID
    const service = ".S" + sodium.to_base64(JSON.stringify({
        "t": "dm",
        "s": endpoint,
        "a": ["didcomm/v2", "didcomm/aip2;env=rfc587"]
    }), sodium.base64_variants.URLSAFE).replace(/=/g, "");
    const encryption = ".Ez" + base58EncryptionPublicKey;
    const signing = ".Vz" + base58SigningPublicKey;
    const did = "did:peer:2" + encryption + signing + service;

    // Store DIDDoc
    const doc = await storeDidDoc(this, [did]);

    // Construct Secrets
    const id = did + "#" + base58EncryptionPublicKey;
    const authid = did + "#" + base58SigningPublicKey

    const secret: Secret =
    {
        id: id,
        type: "JsonWebKey2020",
        privateKeyJwk: encryptionKeyPair.privateKey
    };
    const authSecret: Secret =
    {
        id: authid,
        type: "JsonWebKey2020",
        privateKeyJwk: signingKeyPair.privateKey
    };

    // Store Secrets
    let secrets = await this.rsCtx.getEnt("didSecrets");
    if (!secrets) {
        secrets = {};
    }
    secrets[id] = secret;
    secrets[authid] = authSecret;
    await this.rsCtx.putEnt("didSecrets", secrets);

    // Add DID to channel label
    await addLabelsToChannel(this, [channel.id, did]);

    return doc;
});

/**
 * Deletes the DIDDoc object associated with the specified DID from the didDocs entity.
 */
const deleteDID = krl.Function(["did"], async function (did: string) {
    const docs = await this.rsCtx.getEnt("didDocs");
    if (docs) {
        delete docs[did];
        await this.rsCtx.putEnt("didDocs", docs);
        return true;
    }
    return false;
});

/**
 * Updates the DIDDoc object associated with the specified DID in the didDocs entity. 
 * The function takes two parameters: the DID to be updated and the new DIDDoc object.
 */
const updateDID = krl.Function(["did", "newDoc"], async function (did: string, newDoc: DIDDoc) {
    const docs = await this.rsCtx.getEnt("didDocs");
    if (docs) {
        docs[did] = newDoc;
        return true;
    }
    return false;
});

/**
 * Creates a new DID to be rotated into use in place of old_did according to the DIDComm v2 spec. 
 * Pending rotations in the pendingRotations entity are removed when a message is received using the new DID. 
 */
const rotateDID = krl.Function(['old_did'], async function (old_did: string): Promise<DIDDoc> {
    const new_doc: DIDDoc = await generateDID(this, []);
    await updateDidMap(this, [old_did, new_doc["id"]]);
    let pendingRotations = await this.rsCtx.getEnt("pendingRotations");
    if (!pendingRotations) {
        pendingRotations = {};
    }
    pendingRotations[new_doc["id"]] = {
        iss: old_did,
        sub: new_doc["id"],
        iat: Math.floor(Date.now() / 1000)
    };
    await this.rsCtx.putEnt("pendingRotations", pendingRotations);
    return new_doc;
});

/**
 * Manages DID rotation and storage for accepting invitations via the Trust Ping Protocol and from_prior DID Rotation.
 */
const rotateInviteDID = krl.Function(['my_did', 'their_did'], async function (my_did: string, their_did: string) {
    if (this.getEvent() && this.getEvent()?.eci) {
        const channels = this.rsCtx.pico().channels.filter(c => c.id === this.getEvent()?.eci);
        if (channels.length > 0) {
            const channel = channels[0];
            if (channel.tags.includes("did_invite")) {
                const pendingRotations = await this.rsCtx.getEnt("pendingRotations");
                let rotationExists = false;
                for (const r in pendingRotations) {
                    if (pendingRotations[r]["iss"] === my_did) rotationExists = true;
                }
                if (!rotationExists) {
                    await storeDidDoc(this, [their_did]);
                    await mapDid(this, [their_did, my_did]);
                    await rotateDID(this, [my_did]);
                }
            }
        }
    }
});

/**
 * Deletes all entries from the pendingRotations entity. Pending rotations are created by rotating a DID.
 */
const clearPendingRotations = krl.Function([], function () {
    this.rsCtx.putEnt("pendingRotations", {});
});

/**
 * Adds an entry to the didMap entity in the following form:
 * { their_did: my_did } 
 */
const mapDid = krl.Function(['their_did', 'my_did'], async function (their_did: string, my_did: string) {
    let didMap = await this.rsCtx.getEnt("didMap");
    if (!didMap) {
        didMap = {};
    }
    didMap[their_did] = my_did;
    await this.rsCtx.putEnt("didMap", didMap);
});

/**
 * Replaces all occurrences of old_did with new_did in the didMap entity.
 */
const updateDidMap = krl.Function(['old_did', 'new_did'], async function (old_did: string, new_did: string) {
    const map = await this.rsCtx.getEnt("didMap");
    for (const key in map) {
        if (key === old_did) {
            map[new_did] = map[old_did];
            delete map[old_did];
        }
        else if (map[key] === old_did) {
            map[key] = new_did;
        }
    }
    await this.rsCtx.putEnt("didMap", map);
});

/**
 * Deletes all entries from the didMap entity.
 */
const clearDidMap = krl.Function([], async function () {
    await this.rsCtx.putEnt("didMap", {});
})

/**
 * Deletes all entries from the didDocs entity.
 */
const clearDidDocs = krl.Function([], async function () {
    await this.rsCtx.putEnt("didDocs", {});
})

/**
 * Returns a JSON Web Key (JWK) from the given multibase encoded string and curve.
 * @param multibase encoded string
 * @param crv curve of encoded string
 * @returns JWK of given multibase and curve
 */
const JWKFromMultibase = function (multibase: string, crv: string) {
    const multi_decoded = bs58.decode(multibase);
    const key = sodium.to_base64(Buffer.from(multi_decoded.slice(2)), sodium.base64_variants.URLSAFE).replace("=", "");
    return { crv: crv, x: key, kty: "OKP" }
}

/**
 * If input is of type DIDDoc it is stored in the didDocs entity variable, 
 * else the input is attempted to be parsed as a peer method 2 DID into a 
 * DIDDoc and is stored the same way. If parsing fails, an error is logged. 
 * On successful storage, the stored DIDDoc is returned.
 */
const storeDidDoc = krl.Function(['input'], async function (input: any) {
    let diddoc: DIDDoc;
    if (typeof input === 'object' && typeof input !== 'string') {
        diddoc = input;
    } else {
        try {
            diddoc = resolvePeer2Did(input);
        } catch (e: any) {
            this.log.error(e, input);
            return;
        }
    }
    let docs = await this.rsCtx.getEnt("didDocs");

    if (docs) {
        docs[diddoc["id"]] = diddoc;
    } else {
        docs = {};
        docs[diddoc["id"]] = diddoc;
    }

    await this.rsCtx.putEnt("didDocs", docs);
    return diddoc;
});

/**
 * Attempts to resolve a peer method 2 DID into a DIDDoc object and returns that object.
 * @param did peer method 2 did
 * @returns DIDDoc representing provided did
 */
const resolvePeer2Did = function (did: string): DIDDoc {
    if (didregex.test(did)) {
        const parts = (did as string).split('.');
        const keyAgs: string[] = [];
        const auths: string[] = [];
        const verMeths: VerificationMethod[] = [];
        const services: any[] = [];
        parts.forEach(part => {
            if (part[0] === 'E') {
                keyAgs.push(did + "#" + part.substring(2));
                verMeths.push({
                    id: did + "#" + part.substring(2),
                    type: "JsonWebKey2020",
                    controller: did,
                    publicKeyJwk: JWKFromMultibase(part.substring(2), "X25519")
                });
            } else if (part[0] === 'V') {
                auths.push(did + "#" + part.substring(2));
                verMeths.push({
                    id: did + "#" + part.substring(2),
                    type: "JsonWebKey2020",
                    controller: did,
                    publicKeyJwk: JWKFromMultibase(part.substring(2), "Ed25519")
                });
            } else if (part[0] === 'S') {
                const service = JSON.parse(Buffer.from(part.substring(1), "base64").toString("utf8"));
                services.push({
                    id: did + "#didcommmessaging-0",
                    type: "DIDCommMessaging",
                    serviceEndpoint: {
                        uri: service["s"],
                        routingKeys: service["r"],
                        accept: service["a"]
                    }
                });
            }
        });

        return {
            id: did,
            keyAgreement: keyAgs,
            authentication: auths,
            verificationMethod: verMeths,
            service: services
        }
    } else {
        throw "Unable to parse DIDDoc";
    }
};
//#endregion DID Management

// DIDComm Functions
//#region DIDComm

/**
 * This class implements the DIDResolver interface, provided by the didcomm-node package, used for resolving DIDs for packing and unpacking messages.
 */
class PicoDIDResolver implements DIDResolver {
    knownDids: any
    constructor(knownDids: any) {
        this.knownDids = knownDids;
    }
    async resolve(did: string): Promise<DIDDoc | null> {
        const doc = this.knownDids[did] || null;
        if (doc === null) {
            try {
                return resolvePeer2Did(did);
            } catch (e: any) {
                return null;
            }
        } else {
            return doc;
        }
    }
}

/**
 * This class implements the SecretsResolver interface, provided by the didcomm-node package, used for retrieving secrets for packing and unpacking messages.
 */
class PicoSecretsResolver implements SecretsResolver {
    knownSecrets: any
    constructor(secrets: any) {
        this.knownSecrets = secrets;
    }
    async get_secret(secret_id: string): Promise<Secret | null> {
        return this.knownSecrets[secret_id] || null;
    }
    async find_secrets(secret_ids: string[]): Promise<string[]> {
        return secret_ids.filter((id => this.knownSecrets[id]));
    }

}

/**
 * Attempts to unpack (decrypt) an encrypted JSON Web Message (JWM) using the stored secrets. 
 * Returns a tuple of the unpacked message and metadata ([Message, UnpackMetadata]). Refer to didcomm-node package for details.
 */
const unpack = krl.Function(['message'], async function (message: any) {
    try {
        const result: [Message, UnpackMetadata] = await Message.unpack(JSON.stringify(message), new PicoDIDResolver(await this.rsCtx.getEnt("didDocs")), new PicoSecretsResolver(await this.rsCtx.getEnt("didSecrets")), {}) as [Message, UnpackMetadata];
        return result;
    } catch (error) {
        this.log.error("There was an error unpacking a message: ", { message: message, error: error });
        return null;
    }
});

/**
 * Attempts to pack (encrypt) a message from the sender’s DID to the receiver's DID and returns the encrypted message.
 */
const pack = krl.Function(['message', '_from', 'to'], async function (message: IMessage, _from: string, to: string) {
    try {
        const _message: Message = new Message(message)
        const [enc_msg, packed_meta]: [string, PackEncryptedMetadata] = await _message.pack_encrypted(to, _from, _from, new PicoDIDResolver(await this.rsCtx.getEnt("didDocs")), new PicoSecretsResolver(await this.rsCtx.getEnt("didSecrets")), { forward: false }) as [string, PackEncryptedMetadata];
        return JSON.parse(enc_msg);
    } catch (error) {
        this.log.error("There was an error packing a message: ", { message: message, from: _from, to: to, error: error });
        return null;
    }
});

/**
 * Add a route to the routes entity that is used for routing incoming DIDComm v2 messages. 
 * type is the type of the DIDComm v2 message. domain is the domain of the event that is 
 * raised when a message of type type is received. rule is the rule name of the event that 
 * is raised when a message of type type is received.
 */
const addRoute = krl.Function(['type', 'domain', 'rule'], async function (type: string, domain: string, rule: string) {
    let routes = await this.rsCtx.getEnt("routes");
    if (!routes) {
        routes = {};
    }
    routes[type] = { domain: domain, name: rule };
    await this.rsCtx.putEnt("routes", routes);
    return true;
});

/**
 * Unpacks the incoming message and raises the corresponding event according to the type of 
 * the message as defined in the routes entity variable.
 */
const route = krl.Function(['message'], async function (message: string) {
    const unpack_result: IMessage = await unpack(this, [message]);
    const unpacked = unpack_result[0].as_value();
    const unpack_meta = unpack_result[1];
    // Rotate incoming DID if from_prior included
    if (unpack_meta.from_prior) {
        const from_prior = unpack_meta.from_prior as IFromPrior;
        await deleteDID(this, [from_prior.iss]);
        await storeDidDoc(this, [from_prior.sub]);
        await updateDidMap(this, [from_prior.iss, from_prior.sub]);
    }
    // Delete pending rotation if message received using new DID
    if (unpacked.to) {
        const pendingRotations = await this.rsCtx.getEnt("pendingRotations");
        if (pendingRotations && Object.keys(pendingRotations).length > 0) {
            let hasChanged = false;
            unpacked.to.forEach((to: string) => {
                if (pendingRotations[to]) {
                    deleteDID(this, [pendingRotations[to]["iss"]]);
                    deleteDIDChannel(this, [pendingRotations[to]["iss"]]);
                    delete pendingRotations[to];
                    hasChanged = true;
                }
            });
            if (hasChanged) {
                await this.rsCtx.putEnt("pendingRotations", pendingRotations);
            }
        }
    }
    const routes = await this.rsCtx.getEnt("routes");
    try {
        if (unpacked.type != null) {
            // Route Events and Queries
            if (unpacked["type"] === "https://picolabs.io/event/1.0/event") {
                this.rsCtx.raiseEvent(unpacked["body"]["domain"], unpacked["body"]["name"], unpacked["body"]["attrs"]);
            } else if (unpacked["type"] === "https://picolabs.io/query/1.0/query") {
                try {
                    await this.useModule(unpacked["body"]["rid"]);
                    return await this.krl.assertFunction(this.module(unpacked["body"]["rid"])![unpacked["body"]["name"]])(this, unpacked["body"]["args"]);
                } catch (error) {
                    return "Unable to query: " + error;
                }
                // Route DIDComm messages
            } else {
                this.rsCtx.raiseEvent(routes[unpacked.type]["domain"], routes[unpacked.type]["name"], { "message": unpacked, "metadata": unpack_meta })
            }
        } else {
            this.log.error("Unknown route for message: ", { message: unpacked, metadata: unpack_meta })
        }
    } catch (error) {
        this.log.error("Error handling route for message: ", { message: unpacked, metadata: unpack_meta, error: error })
    }
});

/**
 * Packs the given message and sends it to the endpoint of the given did. 
 * This function utilizes the autosend feature of the http library. To subscribe 
 * to these responses, create a rule that selects on dido dido_send_response.
 */
const send = krl.Function(['did', 'message'], async function (did: string, message: any) {
    try {
        const docs = await this.rsCtx.getEnt("didDocs");
        const endpoint = docs[did]["service"][0]["serviceEndpoint"]["uri"];
        const _from: string = message["from"];
        this.log.debug("MESSAGE: ", message);
        const packed_message = await pack(this, [message, _from, did]);
        const eci = this.rsCtx.pico().channels.filter(c => c.tags.indexOf(normalizeDID(_from)) >= 0)[0]["id"];
        await this.krl.assertAction(this.module("http")!["post"])(this, {
            "url": endpoint,
            "json": packed_message,
            "autosend": {
                "eci": eci,
                "domain": "dido",
                "type": "dido_send_response",
                "name": "dido_send_response"
            }
        });
    } catch (error) {
        this.log.error("Error sending did message: ", { error: error, did: did, message: message })
    }
});

/**
 * This function is used by the wrangler:picoQuery function to send a query using a did.
 */
const prepareQuery = krl.Function(['did', 'query'], async function (did: string, query: any) {
    await this.useModule("io.picolabs.did-o", "didx");
    return await this.krl.assertFunction(this.module("didx")!["sendQuery"])(this, [did, query]);
})

/**
 * Very similar to dido:send, except that it waits for and returns the http response.
 */
const sendQuery = krl.Function(['did', 'message'], async function (did: string, message: any) {
    try {
        const docs: any = await this.rsCtx.getEnt("didDocs");
        const endpoint: string = docs[did]["service"][0]["serviceEndpoint"]["uri"];
        const _from: string = message["from"];
        const packed_message = await pack(this, [message, _from, did]);
        const response = await Promise.race([this.krl.assertAction(this.module("http")!["post"])(this, {
            "url": endpoint,
            "json": packed_message,
        }), new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), QUERY_TIMEOUT))
        ]).catch(function (err) {
            return "Query timed out";
        });
        if (response.status_code === 200) {
            return JSON.parse(response.content).directives[0].options
        }
        return response;
    } catch (error) {
        this.log.error("Error sending did query: ", { error: error, did: did, message: message })
    }

});

/**
 * Generates and returns a DIDComm v2 message with the given messageOptions.
 * messageOptions is formatted as follows:
 * {
 *  type: string,
 *  body: any,
 *  from?: string,
 *  to?: Array\<string\>,
 *  thid?: string,
 *  pthid?: string,
 *  expires_time?: number,
 *  attachments?: Array\<Attachment\>
 * }
 * 
 * Refer to didcomm-node package for Attachment object specifics.
 */
const generateMessage = krl.Function(['messageOptions'], async function (messageOptions: { type: string, body: any, from?: string, to?: Array<string>, thid?: string, pthid?: string, expires_time?: number, attachments?: Array<Attachment> }): Promise<IMessage> {
    const message: IMessage = {
        id: cuid(),
        typ: "application/didcomm-plain+json",
        type: messageOptions.type,
        body: messageOptions.body,
        from: messageOptions.from,
        to: messageOptions.to,
        thid: messageOptions.thid,
        pthid: messageOptions.pthid,
        created_time: Math.floor(Date.now() / 1000),
        attachments: messageOptions.attachments
    }
    if (messageOptions.expires_time) {
        message.expires_time = Math.floor(Date.now() / 1000) + messageOptions.expires_time;
    }
    if (messageOptions.from) {
        try {
            message.from_prior = (await new FromPrior((await this.rsCtx.getEnt("pendingRotations"))[messageOptions.from] as IFromPrior).pack(null, new PicoDIDResolver(await this.rsCtx.getEnt("didDocs")), new PicoSecretsResolver(await this.rsCtx.getEnt("didSecrets"))))[0] ?? undefined;
        } catch (e) {
            // Drop if there is no pending rotation
        }
    }
    return message;
});

/**
 * Creates and returns the invitation URL for the given base64 invite.
 */
const createInviteUrl = krl.Function(['base64'], function (base64: string) {
    const host: string = this.module("meta")!["host"](this)
    if (host.indexOf("localhost") >= 0) {
        return "http://example.com/invite?_oob=" + base64;
    }
    return host + "/invite?_oob=" + base64;
});
//#endregion DIDComm

// Misc Functions for managing channels for DIDComm
//#region Misc Functions

/**
 * Concatenates lables to the labels of the channel with the given eci.
 */
const addLabelsToChannel = krl.Function(['eci', 'labels'], async function (eci: string, labels: any) {
    const channel = this.rsCtx.pico().channels.filter(c => c.id == eci);
    const tags = channel[0].tags.concat(labels);
    const eventPolicy = channel[0]["eventPolicy"]
    const queryPolicy = channel[0]["queryPolicy"]
    const conf = { tags, eventPolicy, queryPolicy };
    await this.rsCtx.putChannel(eci, conf);
});

/**
 * Deletes any channel associated with the given did.
 */
const deleteDIDChannel = krl.Function(['did'], async function (did: string) {
    await this.rsCtx.pico().channels.filter(c => c.tags.indexOf(normalizeDID(did)) >= 0).forEach(async c => await this.rsCtx.delChannel(c.id));
});

/**
 * Returns a channel label friendly version of the given did. (Replaces : and . with -)
 * @param did did to normalize
 * @returns normalized did
 */
const normalizeDID = function (did: string) {
    return did.replace(/[:.]/g, "-").toLowerCase();
}
//#endregion Misc Functions

const dido: krl.Module = {
    generateDID: generateDID,
    deleteDID: deleteDID,
    updateDID: updateDID,
    rotateDID: rotateDID,
    rotateInviteDID: rotateInviteDID,
    clearPendingRotations: clearPendingRotations,
    mapDid: mapDid,
    // updateDidMap: updateDidMap, // Does not need to be exported
    clearDidMap: clearDidMap,
    clearDidDocs: clearDidDocs,
    // JWKFromMultibase: JWKFromMultibase, // Private non-KRL function. Cannot be exported
    storeDidDoc: storeDidDoc,
    // resolvePeer2Did: resolvePeer2Did, // Private non-KRL function. Cannot be exported
    unpack: unpack,
    pack: pack,
    addRoute: addRoute,
    route: route,
    send: send,
    prepareQuery: prepareQuery,
    sendQuery: sendQuery,
    generateMessage: generateMessage,
    createInviteUrl: createInviteUrl,
    addLabelsToChannel: addLabelsToChannel,
    // deleteDIDChannel: deleteDIDChannel, // Does not need to be exported
    // nomalizeDID: normalizeDID, // Private non-KRL function. Cannot be exported
}

export default dido;

/**
 * DIDO V 1.0.0
 */