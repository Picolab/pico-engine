import { krl } from "krl-stdlib";
import { Message, DIDDoc, DIDResolver, Secret, SecretsResolver, VerificationMethod, IMessage, PackEncryptedMetadata, UnpackMetadata } from "didcomm-node";
const bs58 = require('bs58');
const sodium = require('libsodium-wrappers')
const crypto = require('crypto')

const generateDID = krl.Function(['type', 'endpoint'], async function (type: string | undefined, endpoint: string | undefined): Promise<any> {
    const keyPair = await crypto.generateKeyPairSync("x25519", {
        publicKeyEncoding: {
            type: 'spki',
            format: 'jwk'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'jwk',
        }
    });
    const authKeyPair = await crypto.generateKeyPairSync("ed25519", {
        publicKeyEncoding: {
            type: 'spki',
            format: 'jwk'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'jwk',
        }
    });
    const publicKeyMultiCodec = new Uint8Array(Buffer.from(sodium.from_base64(keyPair.publicKey.x)).length + 2);
    publicKeyMultiCodec.set([0xed, 0x01]);
    publicKeyMultiCodec.set(Buffer.from(sodium.from_base64(keyPair.publicKey.x)), 2);
    if (type == "key" || type == "peer") {
        let did
        if (type == "key") {
            did = "did:key:z" + bs58.encode(Buffer.from(publicKeyMultiCodec))
        } else {
            did = "did:peer:0z" + bs58.encode(Buffer.from(publicKeyMultiCodec))
        }
        const id = did + "#key-x25519-1";
        const verification_method: VerificationMethod =
        {
            id: id,
            type: "JsonWebKey2020",
            controller: id,
            verification_material: {
                format: "JWK",
                value: keyPair.publicKey
            },
        };
        const authid = did + "#key-1"
        const auth_ver_method: VerificationMethod =
        {
            id: authid,
            type: "JsonWebKey2020",
            controller: authid,
            verification_material: {
                format: "JWK",
                value: authKeyPair.publicKey
            },
        };

        const secret: Secret =
        {
            id: id,
            type: "JsonWebKey2020",
            secret_material: {
                format: "JWK",
                value: keyPair.privateKey
            },
        };
        const authSecret: Secret =
        {
            id: authid,
            type: "JsonWebKey2020",
            secret_material: {
                format: "JWK",
                value: authKeyPair.privateKey
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
    }

    return {
        did: bs58.encode(Buffer.from(publicKeyMultiCodec)),
        publicKey: keyPair.publicKey,
        secret: keyPair.privateKey
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

const JWKFromDIDKey = function (key: string) {
    const regex = /^did:([a-z]+):[0-2]?z([a-zA-z\d]+)/
    let res = regex.exec(key)
    if (res) {
        let multicodec = res[2]
        let multi_decoded = bs58.decode(multicodec)
        let key = sodium.to_base64(Buffer.from(multi_decoded.slice(2)), sodium.base64_variants.URLSAFE).replace("=", "");
        return { crv: "X25519", x: key, kty: "OKP" }
    }
}

const storeDidNoDoc = krl.Function(['did', 'key', 'endpoint'], async function (did: string, key: string, endpoint: string) {
    const id = did + "#key-x25519-1";
    const verification_method: VerificationMethod = {
        id: id,
        type: "JsonWebKey2020",
        controller: did,
        verification_material: {
            format: "JWK",
            value: JWKFromDIDKey(key)
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

const storeDidDoc = krl.Function(['diddoc'], async function (diddoc: DIDDoc) {
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
        this.log.error("There was an error packing a message: ", { message: message, error: error });
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

const clearDidMap = krl.Function([], async function() {
    await this.rsCtx.putEnt("didMap", {});
})

const send = krl.Action(['did', 'message'], async function (did: string, message: string) {
    var docs = await this.rsCtx.getEnt("didDocs");
    var endpoint = docs[did]["services"][0]["kind"]["Other"]["serviceEndpoint"];
    var didMap = await this.rsCtx.getEnt("didMap");
    var my_did = didMap[did];
    var packed_message = await pack(this, [message, my_did, did]);
    this.log.debug("DIDO SEND", { packed_message: packed_message, my_did: my_did, their_did: did, endpoint: endpoint })
    await this.krl.assertAction(this.module("http")!["post"])(this, {
        "url": endpoint,
        "json": packed_message,
        "autosend": {
            "eci": this.module("meta")!["eci"](this),
            "domain": "dido",
            "type": "dido_send_response",
            "name": "dido_send_response"
        }
    });
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
    clearDidMap: clearDidMap
}

export default dido;