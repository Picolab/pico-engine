import { KrlCtx, krl } from "krl-stdlib";
import { Message, DIDDoc, DIDResolver, Secret, SecretsResolver, VerificationMethod, IMessage, PackEncryptedMetadata, UnpackMetadata, Attachment, IFromPrior, FromPrior } from "didcomm-node";
import * as cuid from "cuid";
import internal = require("stream");
const bs58 = require('bs58');
const sodium = require('libsodium-wrappers')
const crypto = require('crypto')
const didregex = /^did:peer:(([01](z)([1-9a-km-zA-HJ-NP-Z]{46,47}))|(2((\.[AEVID](z)([1-9a-km-zA-HJ-NP-Z]{46,47}))+(\.(S)[0-9a-zA-Z=]*)?)))$/

// DID Functions
//#region DID Management
const generateDID = krl.Function(['isInvite'], async function (isInvite: boolean = false): Promise<any> {
    // Create channel for new did
    var channel = await this.rsCtx.newChannel({
        eventPolicy: {
            allow: [{ domain: "dido", name: "didcommv2_message" }, { domain: "dido", name: "dido_send_response" }],
            deny: []
        },
        queryPolicy: {
            allow: [{ rid: this.rsCtx.ruleset.rid, name: "*" }],
            deny: []
        },
        tags: isInvite ? ["did_invite"] : []
    });
    var endpoint = `${this.module("meta")!["host"](this)}/sky/event/${channel.id}/none/dido/didcommv2_message`;

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

    var doc = await storeDidDoc(this, [did]);

    // Construct DIDDoc
    const id = did + "#" + base58EncryptionPublicKey;
    // const verification_method: VerificationMethod =
    // {
    //     id: id,
    //     type: "JsonWebKey2020",
    //     controller: did,
    //     verification_material: {
    //         format: "JWK",
    //         value: encryptionKeyPair.publicKey
    //     },
    // };
    const authid = did + "#" + base58SigningPublicKey
    // const auth_ver_method: VerificationMethod =
    // {
    //     id: authid,
    //     type: "JsonWebKey2020",
    //     controller: did,
    //     verification_material: {
    //         format: "JWK",
    //         value: signingKeyPair.publicKey
    //     },
    // };

    const secret: Secret =
    {
        id: id,
        type: "JsonWebKey2020",
        secret_material: {
            format: "JWK",
            value: encryptionKeyPair.privateKey
        },
    };
    const authSecret: Secret =
    {
        id: authid,
        type: "JsonWebKey2020",
        secret_material: {
            format: "JWK",
            value: signingKeyPair.privateKey
        },
    };

    let secrets = await this.rsCtx.getEnt("didSecrets");
    if (!secrets) {
        secrets = {};
    }
    secrets[id] = secret;
    secrets[authid] = authSecret;
    await this.rsCtx.putEnt("didSecrets", secrets);

    // const doc: DIDDoc = {
    //     did: did,
    //     key_agreements: [id],
    //     authentications: [authid],
    //     verification_methods: [verification_method, auth_ver_method],
    //     services: [{
    //         id: "#inline",
    //         kind: {
    //             "Other": {
    //                 id: did + "#didcommmessaging-0",
    //                 type: "DIDCommMessaging",
    //                 serviceEndpoint: endpoint,
    //                 accept: ["didcomm/v2", "didcomm/aip2;env=rfc587"],
    //                 routingKeys: []
    //             }
    //         },
    //     }]
    // };

    // let docs = await this.rsCtx.getEnt("didDocs");
    // if (docs) {
    //     docs[did] = doc;
    // } else {
    //     docs = {};
    //     docs[did] = doc;
    // }
    // await this.rsCtx.putEnt("didDocs", docs);

    await addLabelsToChannel(this, [channel.id, did]);

    return doc;
});

const deleteDID = krl.Function(["did"], async function (did: string) {
    let docs = await this.rsCtx.getEnt("didDocs");
    if (docs) {
        delete docs[did];
        await this.rsCtx.putEnt("didDocs", docs);
        return true;
    }
    return false;
});

const updateDID = krl.Function(["did", "newDoc"], async function (did: string, newDoc: DIDDoc) {
    let docs = await this.rsCtx.getEnt("didDocs");
    if (docs) {
        docs[did] = newDoc;
        return true;
    }
    return false;
});

const rotateDID = krl.Function(['old_did'], async function (old_did: string): Promise<DIDDoc> {
    var new_doc: DIDDoc = await generateDID(this, []);
    await updateDidMap(this, [old_did, new_doc["did"]]);
    var pendingRotations = await this.rsCtx.getEnt("pendingRotations");
    this.log.debug("Old DID: ", old_did);
    this.log.debug("New Rotated DID: ", new_doc);
    if (!pendingRotations) {
        pendingRotations = {};
    }
    pendingRotations[new_doc["did"]] = {
        iss: old_did,
        sub: new_doc["did"],
        iat: Math.floor(Date.now() / 1000)
    };
    await this.rsCtx.putEnt("pendingRotations", pendingRotations);
    return new_doc;
});

const rotateInviteDID = krl.Function(['my_did', 'their_did'], async function (my_did: string, their_did: string) {
    if (this.getEvent() && this.getEvent()?.eci) {
        var channels = this.rsCtx.pico().channels.filter(c => c.id === this.getEvent()?.eci);
        this.log.debug("Checking if rotation is needed: ", channels);
        if (channels.length > 0) {
            var channel = channels[0];
            if (channel.tags.includes("did_invite")) {
                var pendingRotations = await this.rsCtx.getEnt("pendingRotations");
                var rotationExists = false;
                for (let r in pendingRotations) {
                    this.log.debug(`${r} : ${pendingRotations[r]}`);
                    if (pendingRotations[r]) rotationExists = true;
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

const clearPendingRotations = krl.Function([], function () {
    this.rsCtx.putEnt("pendingRotations", {});
});

const mapDid = krl.Function(['their_did', 'my_did'], async function (their_did: string, my_did: string) {
    var didMap = await this.rsCtx.getEnt("didMap");
    if (!didMap) {
        didMap = {};
    }
    didMap[their_did] = my_did;
    await this.rsCtx.putEnt("didMap", didMap);
});

const deleteDidFromMap = krl.Function(['their_did'], async function (their_did: string) {
    var map = await this.rsCtx.getEnt("didMap");
    delete map[their_did];
    await this.rsCtx.putEnt("didMap", map);
});

const updateDidMap = krl.Function(['old_did', 'new_did'], async function (old_did: string, new_did: string) {
    var map = await this.rsCtx.getEnt("didMap");
    for (let key in map) {
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

const clearDidMap = krl.Function([], async function () {
    await this.rsCtx.putEnt("didMap", {});
})

const clearDidDocs = krl.Function([], async function () {
    await this.rsCtx.putEnt("didDocs", {});
})

const JWKFromMultibase = function (multibase: string, crv: string) {
    // const regex = /^did:([a-z]+):[0-2]?z([a-zA-z\d]+)/
    // let res = regex.exec(key)
    // if (res) {
    // let multicodec = res[2]
    let multi_decoded = bs58.decode(multibase);
    let key = sodium.to_base64(Buffer.from(multi_decoded.slice(2)), sodium.base64_variants.URLSAFE).replace("=", "");
    return { crv: crv, x: key, kty: "OKP" }
    // }
}

// const storeDidNoDoc = krl.Function(['did', 'key', 'endpoint'], async function (did: string, key: string, endpoint: string) {
//     const id = did + "#key-x25519-1";
//     const verification_method: VerificationMethod = {
//         id: id,
//         type: "JsonWebKey2020",
//         controller: did,
//         verification_material: {
//             format: "JWK",
//             value: JWKFromMultibase(key, "X25519")
//         }
//     };
//     const doc: DIDDoc = {
//         did: did,
//         key_agreements: [id],
//         authentications: [],
//         verification_methods: [verification_method],
//         services: [{
//             id: "#inline",
//             kind: {
//                 "Other": {
//                     "type": "did-communication",
//                     "recipientKeys": [
//                         did
//                     ],
//                     "serviceEndpoint": endpoint
//                 }
//             },
//         }]
//     };
//     let docs = await this.rsCtx.getEnt("didDocs");
//     if (docs) {
//         docs[did] = doc;
//     } else {
//         docs = {};
//         docs[did] = doc;
//     }
//     await this.rsCtx.putEnt("didDocs", docs);
//     return doc;
// });

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
        docs[diddoc["did"]] = diddoc;
    } else {
        docs = {};
        docs[diddoc["did"]] = diddoc;
    }

    await this.rsCtx.putEnt("didDocs", docs);
    return diddoc;
});

const resolvePeer2Did = function (did: string) {
    if (didregex.test(did)) {
        let parts = (did as string).split('.');
        let keyAgs: string[] = [];
        let auths: string[] = [];
        let verMeths: VerificationMethod[] = [];
        let services: any[] = [];
        parts.forEach(part => {
            if (part[0] === 'E') {
                keyAgs.push(did + "#" + part.substring(2));
                verMeths.push({
                    id: did + "#" + part.substring(2),
                    type: "JsonWebKey2020",
                    controller: did,
                    verification_material: {
                        format: "JWK",
                        value: JWKFromMultibase(part.substring(2), "X25519")
                    }
                });
            } else if (part[0] === 'V') {
                auths.push(did + "#" + part.substring(2));
                verMeths.push({
                    id: did + "#" + part.substring(2),
                    type: "JsonWebKey2020",
                    controller: did,
                    verification_material: {
                        format: "JWK",
                        value: JWKFromMultibase(part.substring(2), "Ed25519")
                    }
                });
            } else if (part[0] === 'S') {
                let service = JSON.parse(Buffer.from(part.substring(1), "base64").toString("utf8"));
                services.push({
                    id: did,
                    kind: {
                        "Other": {
                            id: did + "#didcommmessaging-0",
                            type: "DIDCommMessaging",
                            serviceEndpoint: service["s"],
                            routingKeys: service["r"],
                            accept: service["a"],
                        }
                    }
                });
            }
        });

        return {
            did: did,
            key_agreements: keyAgs,
            authentications: auths,
            verification_methods: verMeths,
            services: services
        }
    } else {
        throw "Unable to parse DIDDoc";
    }
};
//#endregion DID Management

// DIDComm Functions
//#region DIDComm
class PicoDIDResolver implements DIDResolver {
    knownDids: any
    constructor(knownDids: any) {
        this.knownDids = knownDids;
    }
    async resolve(did: string): Promise<DIDDoc | null> {
        var doc = this.knownDids[did] || null;
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

const unpack = krl.Function(['message'], async function (message: any) {
    try {
        var result: [Message, UnpackMetadata] = await Message.unpack(JSON.stringify(message), new PicoDIDResolver(await this.rsCtx.getEnt("didDocs")), new PicoSecretsResolver(await this.rsCtx.getEnt("didSecrets")), {}) as [Message, UnpackMetadata];
        return result;
    } catch (error) {
        this.log.error("There was an error unpacking a message: ", { message: message, error: error });
        return null;
    }
});

const pack = krl.Function(['message', '_from', 'to'], async function (message: IMessage, _from: string, to: string) {
    try {
        let _message: Message = new Message(message)
        const [enc_msg, packed_meta]: [string, PackEncryptedMetadata] = await _message.pack_encrypted(to, _from, _from, new PicoDIDResolver(await this.rsCtx.getEnt("didDocs")), new PicoSecretsResolver(await this.rsCtx.getEnt("didSecrets")), { forward: false }) as [string, PackEncryptedMetadata];
        return JSON.parse(enc_msg);
    } catch (error) {
        this.log.error("There was an error packing a message: ", { message: message, from: _from, to: to, error: error });
        return null;
    }
});

const addRoute = krl.Function(['type', 'domain', 'rule'], async function (type: string, domain: string, rule: string) {
    var routes = await this.rsCtx.getEnt("routes");
    if (!routes) {
        routes = {};
    }
    routes[type] = { domain: domain, name: rule };
    await this.rsCtx.putEnt("routes", routes);
    return true;
});

const route = krl.Function(['message'], async function (message: string) {
    var unpack_result: IMessage = await unpack(this, [message]);
    var unpacked = unpack_result[0].as_value();
    var unpack_meta = unpack_result[1];
    // Rotate incoming DID if from_prior included
    if (unpack_meta.from_prior) {
        var from_prior = unpack_meta.from_prior as IFromPrior;
        this.log.debug("FROM_PRIOR FOUND: ", from_prior);
        await deleteDID(this, [from_prior.iss]);
        await storeDidDoc(this, [from_prior.sub]);
        await updateDidMap(this, [from_prior.iss, from_prior.sub]);
        // var my_did = (await this.rsCtx.getEnt("didMap"))[from_prior.sub]
        // mapDid(this, [from_prior.iss, my_did]);
        // deleteDidFromMap(this, [from_prior.sub]);
    }
    // Delete pending rotation if message received using new DID
    if (unpacked.to) {
        var pendingRotations = await this.rsCtx.getEnt("pendingRotations");
        this.log.debug("CHECKING PENDING ROTATIONS", pendingRotations);
        if (pendingRotations && Object.keys(pendingRotations).length > 0) {
            this.log.debug("PENDING ROTATIONS ARE REAL")
            var hasChanged = false;
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
    var routes = await this.rsCtx.getEnt("routes");
    try {
        if (unpacked.type != null) {
            this.rsCtx.raiseEvent(routes[unpacked.type]["domain"], routes[unpacked.type]["name"], { "message": unpacked, "metadata": unpack_meta })
        } else if (unpacked.body["type"] != null) {
            this.rsCtx.raiseEvent(routes[unpacked.body["type"]]["domain"], routes[unpacked.body["type"]]["name"], { "message": unpacked, "metadata": unpack_meta })
        } else {
            this.log.error("Unknown route for message: ", { message: unpacked, metadata: unpack_meta })
        }
    } catch (error) {
        this.log.error("Error handling route for message: ", { message: unpacked, metadata: unpack_meta, error: error })
    }
});

const send = krl.Function(['did', 'message'], async function (did: string, message: any) {
    try {
        var docs = await this.rsCtx.getEnt("didDocs");
        var endpoint = docs[did]["services"][0]["kind"]["Other"]["serviceEndpoint"];
        var didMap = await this.rsCtx.getEnt("didMap");
        var _from: string = message["from"];
        var packed_message = await pack(this, [message, _from, did]);
        var eci = this.rsCtx.pico().channels.filter(c => c.tags.indexOf(normalizeDID(_from)) >= 0)[0]["id"];
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

const generateMessage = krl.Function(['messageOptions'], async function (messageOptions: { type: string, body: any, from?: string, to?: Array<string>, thid?: string, pthid?: string, expires_time?: number, attachments?: Array<Attachment> }): Promise<IMessage> {
    var message: IMessage = {
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

const createInviteUrl = krl.Function(['base64'], function(base64: string) {
    var host: string = this.module("meta")!["host"](this)
    if(host.indexOf("localhost") >= 0) {
        return "http://example.com?_oob=" + base64;
    }
    return host + base64;
});
//#endregion DIDComm

// Misc Functions for managing channels for DIDComm
//#region Misc Functions
const addLabelsToChannel = krl.Function(['eci', 'labels'], async function (eci: string, labels: any) {
    var channel = this.rsCtx.pico().channels.filter(c => c.id == eci);
    var tags = channel[0].tags.concat(labels);
    var eventPolicy = channel[0]["eventPolicy"]
    var queryPolicy = channel[0]["queryPolicy"]
    var conf = { tags, eventPolicy, queryPolicy };
    await this.rsCtx.putChannel(eci, conf);
});

const deleteDIDChannel = krl.Function(['did'], async function (did: string) {
    await this.rsCtx.pico().channels.filter(c => c.tags.indexOf(normalizeDID(did)) >= 0).forEach(async c => await this.rsCtx.delChannel(c.id));
});

const normalizeDID = function(did: string) {
    return did.replace(/[:.]/g, "-").toLowerCase();
}
//#endregion Misc Functions

const dido: krl.Module = {
    generateDID: generateDID,
    deleteDID: deleteDID,
    updateDID: updateDID,
    unpack: unpack,
    pack: pack,
    // storeDidNoDoc: storeDidNoDoc,
    clearDidDocs: clearDidDocs,
    storeDidDoc: storeDidDoc,
    addRoute: addRoute,
    route: route,
    send: send,
    mapDid: mapDid,
    clearDidMap: clearDidMap,
    addLabelsToChannel: addLabelsToChannel,
    generateMessage: generateMessage,
    rotateDID: rotateDID,
    rotateInviteDID: rotateInviteDID,
    clearPendingRotations: clearPendingRotations,
    createInviteUrl: createInviteUrl
}

export default dido;
