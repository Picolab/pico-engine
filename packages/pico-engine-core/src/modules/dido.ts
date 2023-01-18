import { krl } from "krl-stdlib";
import { Message, DIDDoc, DIDResolver, Secret, SecretsResolver, VerificationMethod, IMessage, PackEncryptedMetadata, UnpackMetadata } from "didcomm-node";
const bs58 = require('bs58');
// Thanks to https://github.com/dbluhm/indy-pack-unpack-js
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

        const secret: Secret =
        {
            id: id,
            type: "JsonWebKey2020",
            secret_material: {
                format: "JWK",
                value: keyPair.privateKey
            },
        };

        let secrets = await this.rsCtx.getEnt("didSecrets");
        if (secrets) {
            secrets[id] = secret;
        } else {
            secrets = {};
            secrets[id] = secret;
        }
        await this.rsCtx.putEnt("didSecrets", secrets);

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
    }

    return {
        did: bs58.encode(Buffer.from(publicKeyMultiCodec)),
        publicKey: keyPair.publicKey,
        secret: keyPair.privateKey
    };
});

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

// May need these when I get to building Docs from invitaions
const JWKFromDIDKey = function (key: string) {
    const regex = /^did:([a-z]+):[0-2]?z([a-zA-z\d]+)/
    let res = regex.exec(key)
    if (res) {
        let mulitcodec = res[2]
        let multi_decoded = bs58.decode(mulitcodec)
        let key = bs58.encode(Buffer.from(multi_decoded.slice(2)))
        return { crv: "X25519", x: key, kty: "OKP" }
    }
}

const storeDidNoDoc = krl.Function(['did', 'key', 'endpoint'], async function (did: string, key: string, endpoint: string) {
    const id = did + "#key-X25519-1";
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
})

const unpack = krl.Function(['message'], async function (message: string) {
    var [unpack_msg, unpack_meta]: [Message, UnpackMetadata] = await Message.unpack(message, new PicoDIDResolver(await this.rsCtx.getEnt("didDocs")), new PicoSecretsResolver(await this.rsCtx.getEnt("didSecrets")), {}) as [Message, UnpackMetadata];
    return unpack_msg;
});

const pack = krl.Function(['message', '_from', 'to'], async function (message: IMessage, _from: string, to: string) {
    let _message: Message = new Message(message)
    const [enc_msg, packed_meta]: [string, PackEncryptedMetadata] = await _message.pack_encrypted(to, null, null, new PicoDIDResolver(await this.rsCtx.getEnt("didDocs")), new PicoSecretsResolver(await this.rsCtx.getEnt("didSecrets")), { forward: false }) as [string, PackEncryptedMetadata];
    return enc_msg;
});

const dido: krl.Module = {
    generateDID: generateDID,
    unpack: unpack,
    pack: pack,
    storeDidNoDoc: storeDidNoDoc
}

export default dido;