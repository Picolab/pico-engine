import { krl } from "krl-stdlib";
import { Message, DIDDoc, DIDResolver, Secret, SecretsResolver, VerificationMethod, IMessage, PackEncryptedMetadata, UnpackMetadata } from "didcomm-node";
const bs58 = require('bs58');
const sodium = require('libsodium-wrappers')
const crypto = require('crypto')
const didregex = /^did:peer:(([01](z)([1-9a-km-zA-HJ-NP-Z]{46,47}))|(2((\.[AEVID](z)([1-9a-km-zA-HJ-NP-Z]{46,47}))+(\.(S)[0-9a-zA-Z=]*)?)))$/

const generateDID = krl.Function(['type', 'endpoint'], async function (type: string | undefined, endpoint: string | undefined): Promise<any> {
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


    if (type == "key" || type == "peer") {
        let did
        if (type == "key") {
            did = "did:key:z" + base58EncryptionPublicKey;
        } else {
            const service = ".S" + sodium.to_base64(JSON.stringify({
                "t": "dm",
                "s": endpoint,
                "a": ["didcomm/v2", "didcomm/aip2;env=rfc587"]
            }), sodium.base64_variants.URLSAFE).replace(/=/g, "");
            const encryption = ".Ez" + base58EncryptionPublicKey;
            const signing = ".Vz" + base58SigningPublicKey;
            did = "did:peer:2" + encryption + signing + service;
        }
        const id = did + "#" + base58EncryptionPublicKey;
        const verification_method: VerificationMethod =
        {
            id: id,
            type: "JsonWebKey2020",
            controller: did,
            verification_material: {
                format: "JWK",
                value: encryptionKeyPair.publicKey
            },
        };
        const authid = did + "#" + base58SigningPublicKey
        const auth_ver_method: VerificationMethod =
        {
            id: authid,
            type: "JsonWebKey2020",
            controller: did,
            verification_material: {
                format: "JWK",
                value: signingKeyPair.publicKey
            },
        };

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

        const doc: DIDDoc = {
            did: did,
            key_agreements: [id],
            authentications: [authid],
            verification_methods: [verification_method, auth_ver_method],
            services: [{
                id: "#inline",
                kind: {
                    "Other": {
                        id: did + "#didcommmessaging-0",
                        type: "DIDCommMessaging",
                        serviceEndpoint: endpoint,
                        accept: ["didcomm/v2", "didcomm/aip2;env=rfc587"],
                        routingKeys: []
                    }
                },
            }]
        };

        let docs = await this.rsCtx.getEnt("didDocs");
        if (docs) {
            docs[did] = doc;
        } else {
            docs = {};
            docs[did] = doc;
        }
        await this.rsCtx.putEnt("didDocs", docs);

        return doc;
    }

    return {
        did: bs58.encode(Buffer.from(encryptionPublicKeyMultiCodec)),
        publicKey: encryptionKeyPair.publicKey,
        secret: encryptionKeyPair.privateKey
    };
});

// const getDID = krl.Function([]);

const deleteDID = krl.Function(["did"], async function (did: string) {
    let docs = await this.rsCtx.getEnt("didDocs");
    if (docs) {
        docs.remove(did);
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
})

const clearDidDocs = krl.Function([], async function () {
    await this.rsCtx.putEnt("didDocs", {});
})

class PicoDIDResolver implements DIDResolver {
    knownDids: any
    constructor(knownDids: any) {
        this.knownDids = knownDids;
    }
    async resolve(did: string): Promise<DIDDoc | null> {
        return this.knownDids[did] || null;
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

const storeDidNoDoc = krl.Function(['did', 'key', 'endpoint'], async function (did: string, key: string, endpoint: string) {
    const id = did + "#key-x25519-1";
    const verification_method: VerificationMethod = {
        id: id,
        type: "JsonWebKey2020",
        controller: did,
        verification_material: {
            format: "JWK",
            value: JWKFromMultibase(key, "X25519")
        }
    };
    const doc: DIDDoc = {
        did: did,
        key_agreements: [id],
        authentications: [],
        verification_methods: [verification_method],
        services: [{
            id: "#inline",
            kind: {
                "Other": {
                    "type": "did-communication",
                    "recipientKeys": [
                        did
                    ],
                    "serviceEndpoint": endpoint
                }
            },
        }]
    };
    let docs = await this.rsCtx.getEnt("didDocs");
    if (docs) {
        docs[did] = doc;
    } else {
        docs = {};
        docs[did] = doc;
    }
    await this.rsCtx.putEnt("didDocs", docs);
    return doc;
});

const storeDidDoc = krl.Function(['input'], async function (input: any) {

    let diddoc: DIDDoc;
    if (typeof input === 'object' && typeof input !== 'string') {
        diddoc = input;
    } else if (didregex.test(input)) {
        let parts = (input as string).split('.');
        let keyAgs: string[] = [];
        let auths: string[] = [];
        let verMeths: VerificationMethod[] = [];
        let services: any[] = [];
        parts.forEach(part => {
            if(part[0] === 'E') {
                keyAgs.push(input + "#" + part.substring(2));
                verMeths.push({
                    id: input + "#" + part.substring(2),
                    type: "JsonWebKey2020",
                    controller: input,
                    verification_material: {
                        format: "JWK",
                        value: JWKFromMultibase(part.substring(2), "X25519")
                    }
                });
            } else if (part[0] === 'V') {
                auths.push(input + "#" + part.substring(2));
                verMeths.push({
                    id: input + "#" + part.substring(2),
                    type: "JsonWebKey2020",
                    controller: input,
                    verification_material: {
                        format: "JWK",
                        value: JWKFromMultibase(part.substring(2), "Ed25519")
                    }
                });
            } else if (part[0] === 'S') {
                let service = JSON.parse(Buffer.from(part.substring(1), "base64").toString("utf8"));
                this.log.debug(JSON.stringify(service));
                services.push({
                    id: input,
                    kind: {
                        "Other": {
                            id: input + "#didcommmessaging-0",
                            type: "DIDCommMessaging",
                            serviceEndpoint: service["s"],
                            routingKeys: service["r"],
                            accept: service["a"],
                        }
                    }
                });
            }
        });
        
        diddoc = {
            did: input,
            key_agreements: keyAgs,
            authentications: auths,
            verification_methods: verMeths,
            services: services
        }
    } else {
        this.log.error("Unable to parse DIDDoc", input);
        return "Unable to parse DIDDoc";
    }
    let docs = await this.rsCtx.getEnt("didDocs");

    if (docs) {
        docs[diddoc["did"]] = diddoc;
    } else {
        docs = {};
        docs[diddoc["did"]] = diddoc;
    }

    await this.rsCtx.putEnt("didDocs", docs);
    //return diddoc;
});

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

const getDIDDoc = krl.Function(['did'], async function (did: string) {
    let docs: any = await this.rsCtx.getEnt("didDocs");

    if (docs) {
        return docs[did]
    }

    return null
});

const route = krl.Function(['message'], async function (message: string) {
    var unpack_result: IMessage = await unpack(this, [message]);
    var unpacked = unpack_result[0].as_value();
    var unpack_meta = unpack_result[1];
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

const mapDid = krl.Function(['their_did', 'my_did'], async function (their_did: string, my_did: string) {
    var didMap = await this.rsCtx.getEnt("didMap");
    if (!didMap) {
        didMap = {};
    }
    didMap[their_did] = my_did;
    await this.rsCtx.putEnt("didMap", didMap);
});

const clearDidMap = krl.Function([], async function () {
    await this.rsCtx.putEnt("didMap", {});
})

const send = krl.Function(['did', 'message'], async function (did: string, message: string) {
    try {
        var docs = await this.rsCtx.getEnt("didDocs");
        this.log.debug("DOCS: ", docs);
        var endpoint = docs[did]["services"][0]["kind"]["Other"]["serviceEndpoint"];
        var didMap = await this.rsCtx.getEnt("didMap");
        var my_did = didMap[did];
        var packed_message = await pack(this, [message, my_did, did]);
        this.log.debug("DIDO SEND", { packed_message: packed_message, my_did: my_did, their_did: did, endpoint: endpoint })
        var formatted = did.replace(/:/g, "-").toLowerCase();
        this.log.debug("FORMATTED DID: ", formatted)
        var channels = this.rsCtx.pico().channels;
        this.log.debug("CHANNELS: ", channels)
        var filtered = channels.filter(c => c.tags.indexOf(formatted) >= 0);
        this.log.debug("FILTERED: ", filtered);
        var first = filtered[0];
        this.log.debug("FIRST: ", first)
        var eci = first["id"];
        this.log.debug("ECI: ", eci);
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

const addLabelsToChannel = krl.Function(['eci', 'labels'], async function (eci: string, labels: any) {
    this.log.debug("ECI: ", eci);
    var channel = this.rsCtx.pico().channels.filter(c => c.id == eci);
    this.log.debug("FILTERED: ", channel)
    this.log.debug("CHANNELS: ", this.rsCtx.pico().channels);
    var tags = channel[0].tags.concat(labels);
    var eventPolicy = channel[0]["eventPolicy"]
    var queryPolicy = channel[0]["queryPolicy"]
    var conf = { tags, eventPolicy, queryPolicy };
    await this.rsCtx.putChannel(eci, conf);
});

const dido: krl.Module = {
    generateDID: generateDID,
    deleteDID: deleteDID,
    updateDID: updateDID,
    unpack: unpack,
    pack: pack,
    storeDidNoDoc: storeDidNoDoc,
    clearDidDocs: clearDidDocs,
    storeDidDoc: storeDidDoc,
    addRoute: addRoute,
    route: route,
    getDIDDoc: getDIDDoc,
    send: send,
    mapDid: mapDid,
    clearDidMap: clearDidMap,
    addLabelsToChannel: addLabelsToChannel
}

export default dido;