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
    // console.log("-------------------X-------------------\n" + JSON.stringify(x));
    if (type == "key") {
        const did = "did:key:z" + bs58.encode(Buffer.from(ariesPublicKeyMultiCodec))
        const id = did + "#key-Ed25519-1";
        const verification_method: VerificationMethod = {
            id: id,
            type: "JsonWebKey2020",
            controller: did,
            verification_material: {
                format: "JWK",
                value: {
                    crv: "Ed25519",
                    kty: "OKP",
                    x: bs58.encode(Buffer.from(ariesPair.publicKey)) //x.publicKey
                    //bs58.encode(Buffer.from(ariesPair.publicKey))
                }
            }
        };
        const secret: Secret = {
            id: id,
            type: "JsonWebKey2020",
            secret_material: {
                format: "JWK",
                value: {
                    crv: "Ed25519",
                    kty: "OKP",
                    x: bs58.encode(Buffer.from(ariesPair.privateKey)) //x.privateKey
                    // bs58.encode(Buffer.from(ariesPair.privateKey))
                }
            }
        }
        let secrets = await this.rsCtx.getEnt("didSecrets");
        //let test =  await this.rsCtx.getEnt("test");
        //console.log("-------test: " + JSON.stringify(test));
        if (secrets) {
            secrets[id] = secret;
        } else {
            secrets = {};
            secrets[id] = secret;
        }
        // console.log("--ID: " + JSON.stringify(id));
        // console.log("--Secret: " + JSON.stringify(secret));
        // console.log("-------secrets: " + JSON.stringify(secrets));
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

const unpack = krl.Function(['_protected', 'recipients', 'iv', 'ciphertext', 'tag', 'eci'], async function (_protected: string, recipients: any, iv: string, ciphertext: string, tag: string, eci: string) {
    // if (!recipients) {
    //     const docs: any = await this.rsCtx.getEnt("didDocs");
    //     console.log(JSON.stringify(docs));
    //     console.log("----ECI-----: " + eci);
    //     const recipient_doc = Object.values(docs).filter((x: any) => {
    //         console.log("--------------ENDPOINTS: ------------\n" + JSON.stringify(x.services[0].kind.Other.serviceEndpoint));
    //         return x.services[0].kind.Other.serviceEndpoint.includes(eci);
    //     })[0] as DIDDoc;
    //     console.log("----RECIP_DOC------" + JSON.stringify(recipient_doc.verification_methods[0].verification_material.value));
    //     const targetPK = sodium.crypto_sign_ed25519_pk_to_curve25519(bs58.decode(recipient_doc.verification_methods[0].verification_material.value));
    //     const cek = sodium.crypto_secretstream_xchacha20poly1305_keygen();
    //     const encCEK = sodium.crypto_box_seal(cek, targetPK);
    //     recipients = [{
    //         header: {
    //             kid: recipient_doc.key_agreements[0]
    //         },
    //         encrypted_key: b64url(encCEK)
    //     }];
    // }
    const message = {
        protected: _protected,
        recipients: recipients,
        iv: iv,
        ciphertext: ciphertext,
        tag: tag
    };
    console.log("packed message: " + JSON.stringify(message));
    return await Message.unpack(JSON.stringify(message), new PicoDIDResolver(await this.rsCtx.getEnt("didDocs")), new PicoSecretsResolver(await this.rsCtx.getEnt("didSecrets")), {});
});

const pack = krl.Function(['message', 'to'], async function (message: Message, to: string) {
    const _from: string = (await this.rsCtx.getEnt("dids")).filter((v: any) => v == to).keys().head();
    return await message.pack_encrypted(to, _from, _from, new PicoDIDResolver(await this.rsCtx.getEnt("didDocs")), new PicoSecretsResolver(await this.rsCtx.getEnt("didSecrets")), {});
});

// const build = krl.Function(['id',
//     'type_',
//     'body',
//     'from: None',
//     'to: None',
//     'thid: None',
//     'pthid: None',
//     'extra_headers: HashMap::new()',
//     'created_time: None',
//     'expires_time: None',
//     'from_prior: None',
//     'attachments: None'], async function ())


const dido: krl.Module = {
    generateDID: generateDID,
    unpack: unpack,
    pack: pack
}

export default dido;