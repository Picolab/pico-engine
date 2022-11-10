import { krl } from "krl-stdlib";
import { Message, DIDDoc, DIDResolver, Secret, SecretsResolver, VerificationMethod } from "didcomm-node";

const nacl = require('tweetnacl');
const bs58 = require('bs58');

// Thanks to https://github.com/dbluhm/indy-pack-unpack-js
const sodium = require('libsodium-wrappers')


const generateDID = krl.Function(['type', 'endpoint'], async function (type: string | undefined, endpoint: string | undefined): Promise<any> {
    const seed = nacl.randomBytes(nacl.sign.seedLength);
    const x = nacl.sign.keyPair.fromSeed(seed);
    const secretKey = x.secretKey.subarray(0, 32);
    const signKey = bs58.encode(Buffer.from(secretKey));
    const keyPair = nacl.box.keyPair.fromSecretKey(secretKey);
    const ariesPair = sodium.crypto_sign_keypair();
    const ariesPublicKeyMultiCodec = new Uint8Array(ariesPair.publicKey.length + 2);
    ariesPublicKeyMultiCodec.set([0xed, 0x01]);
    ariesPublicKeyMultiCodec.set(ariesPair.publicKey, 2);

    if (type == "key") {
        const did = "did:key:z" + bs58.encode(Buffer.from(ariesPublicKeyMultiCodec))
        const id = did + "#key-Ed25519-1";
        const verification_method: VerificationMethod = {
            id: id,
            type: "Ed25519VerificationKey2018",
            controller: did,
            verification_material: {
                format: "Hex",
                value: ariesPair.publicKey
            }
        };
        const secret: Secret = {
            id: id,
            type: "Ed25519VerificationKey2018",
            secret_material: {
                format: "Hex",
                value: ariesPair.privateKey
            }
        }
        let secrets = await this.rsCtx.getEnt("didSecrets");
        if (secrets) {
            secrets.set(id, secret);
        } else {
            secrets = new Map([[id, secret]]);
        }
        this.rsCtx.putEnt("didSecrets", secrets);

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
            // verifyKey: bs58.encode(Buffer.from(x.publicKey)),
            // encryptionPublicKey: bs58.encode(Buffer.from(keyPair.publicKey)),
            // ariesPublicKey: bs58.encode(Buffer.from(ariesPair.publicKey)),
            // ariesPublicKeyMultiCodec: ,
            // secret: {
            //     seed: Buffer.from(seed).toString('hex'),
            //     signKey: signKey,
            //     encryptionPrivateKey: bs58.encode(Buffer.from(keyPair.secretKey)),
            //     ariesPrivateKey: bs58.encode(Buffer.from(ariesPair.privateKey)),
            // }
        };

        let docs = await this.rsCtx.getEnt("didDocs");
        if(docs) {
            docs.set(did, doc);
        } else {
            docs = new Map([[did, doc]]);
        }
        this.rsCtx.putEnt("didDocs", docs);
        return doc;
    }

    return {
        did: bs58.encode(Buffer.from(x.publicKey.subarray(0, 16))),
        verifyKey: bs58.encode(Buffer.from(x.publicKey)),
        encryptionPublicKey: bs58.encode(Buffer.from(keyPair.publicKey)),
        ariesPublicKey: bs58.encode(Buffer.from(ariesPair.publicKey)),
        ariesPublicKeyMultiCodec: bs58.encode(Buffer.from(ariesPublicKeyMultiCodec)),
        secret: {
            seed: Buffer.from(seed).toString('hex'),
            signKey: signKey,
            encryptionPrivateKey: bs58.encode(Buffer.from(keyPair.secretKey)),
            ariesPrivateKey: bs58.encode(Buffer.from(ariesPair.privateKey)),
        }
    };
});

class PicoDIDResolver implements DIDResolver {
    knownDids: Map<string, DIDDoc>
    constructor(knownDids: Map<string, DIDDoc>) {
        this.knownDids = knownDids;
    }
    async resolve(did: string): Promise<DIDDoc | null> {
        return this.knownDids.get(did) || null;
    }
}

class PicoSecretsResolver implements SecretsResolver {
    knownSecrets: any
    constructor(secrets: any) {
        this.knownSecrets = secrets;
    }
    async get_secret(secret_id: string): Promise<Secret | null> {
        return this.knownSecrets.get(secret_id) || null;
    }
    async find_secrets(secret_ids: string[]): Promise<string[]> {
        return secret_ids.filter((id => this.knownSecrets.find((secret: any) => secret.id === id)));
    }

}

const unpack = krl.Function(['message'], async function (message: string) {
    return await Message.unpack(message, new PicoDIDResolver(await this.rsCtx.getEnt("didDocs")), new PicoSecretsResolver(await this.rsCtx.getEnt("didSecrets")), {});
});

const pack = krl.Function(['message', 'to'], async function (message: Message, to: string) {
    const from = (await this.rsCtx.getEnt("dids")).filter((v: any) => v == to).keys().head();
    return await message.pack_encrypted(to, from, from, new PicoDIDResolver(await this.rsCtx.getEnt("didDocs")), new PicoSecretsResolver(await this.rsCtx.getEnt("didSecrets")), {});
});


const dido: krl.Module = {
    generateDID: generateDID,
    unpack: unpack,
    pack: pack
}

export default dido;