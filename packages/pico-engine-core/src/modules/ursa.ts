// Thanks to https://github.com/Picolab/node-sovrin-did/blob/master/index.js
import { krl } from "krl-stdlib";
const nacl = require('tweetnacl');
const bs58 = require('bs58');

// Thanks to https://github.com/dbluhm/indy-pack-unpack-js
const sodium = require('libsodium-wrappers')

const generateDID = krl.Function([], function () {
    const seed = nacl.randomBytes(nacl.sign.seedLength);
    const x = nacl.sign.keyPair.fromSeed(seed);
    const secretKey = x.secretKey.subarray(0,32);
    const signKey = bs58.encode(Buffer.from(secretKey));
    const keyPair = nacl.box.keyPair.fromSecretKey(secretKey);
    const ariesPair = sodium.crypto_sign_keypair();

    return {
      did: bs58.encode(Buffer.from(x.publicKey.subarray(0,16))),
      verifyKey: bs58.encode(Buffer.from(x.publicKey)),
      encryptionPublicKey: bs58.encode(Buffer.from(keyPair.publicKey)),
      ariesPublicKey: bs58.encode(Buffer.from(ariesPair.publicKey)),
      secret: {
        seed: Buffer.from(seed).toString('hex'),
        signKey: signKey,
        encryptionPrivateKey: bs58.encode(Buffer.from(keyPair.secretKey)),
        ariesPrivateKey: bs58.encode(Buffer.from(ariesPair.privateKey)),
      }
    };
  });

function b64url (input : Uint8Array) : string {
  return sodium.to_base64(input, sodium.base64_variants.URLSAFE)
}

function b64dec (input : string) : Uint8Array {
  return sodium.from_base64(input, sodium.base64_variants.URLSAFE)
}

function b64decStr (input : string) : string {
  return sodium.to_string(sodium.from_base64(input, sodium.base64_variants.URLSAFE))
}

const unpack = krl.Function([
    'messageIn',
    'chann'
  ], (messageIn : any, chann : any) => {
    const keys = {
      public: bs58.decode(chann.ariesPublicKey),
      public58: chann.ariesPublicKey,
      private: bs58.decode(chann.secret.ariesPrivateKey)
    }

    const wrapper = krl.isString(messageIn)
      ? JSON.parse(messageIn)
      : messageIn

    const recipsOuter = JSON.parse(b64decStr(wrapper.protected))

    const recipient = recipsOuter.recipients.find((r : any) => {
      return r.header.kid === keys.public58
    })
    if (!recipient) {
      throw new Error('No corresponding recipient key found')
    }
    let pk = sodium.crypto_sign_ed25519_pk_to_curve25519(keys.public)
    let sk = sodium.crypto_sign_ed25519_sk_to_curve25519(keys.private)
    let encrytpedKey = b64dec(recipient.encrypted_key)
    let nonce = recipient.header.iv ? b64dec(recipient.header.iv) : null
    let encSender = recipient.header.sender ? b64dec(recipient.header.sender) : null
    let senderVK = null
    let cek = null
    if (nonce && encSender) {
      senderVK = sodium.to_string(sodium.crypto_box_seal_open(encSender, pk, sk))
      const senderPK = sodium.crypto_sign_ed25519_pk_to_curve25519(bs58.decode(senderVK))
      cek = sodium.crypto_box_open_easy(encrytpedKey, nonce, senderPK, sk)
    } else {
      cek = sodium.crypto_box_seal_open(encrytpedKey, pk, sk)
    }

    switch (recipsOuter.alg) {
      case 'Authcrypt':
        if (!senderVK) {
          throw new Error('Sender public key not provided in Authcrypt message')
        }
        break
      case 'Anoncrypt':
        break
      default:
        throw new Error(`Unsupported pack algorithm: ${recipsOuter.alg}`)
    }

    const ciphertext = b64dec(wrapper.ciphertext)
    nonce = b64dec(wrapper.iv)
    const mac = b64dec(wrapper.tag)

    const message = sodium.to_string(
      sodium.crypto_aead_chacha20poly1305_ietf_decrypt_detached(
        null, // nsec
        ciphertext,
        mac,
        wrapper.protected, // ad
        nonce, // npub
        cek
      )
    )

    return {
      message,
      sender_key: senderVK,
      recipient_key: recipient.header.kid
    }
  })

const ursa: krl.Module = {
  generateDID: generateDID,
  unpack: unpack,
};

export default ursa;
