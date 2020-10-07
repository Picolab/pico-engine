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

function b64url (input : string) : string {
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

const pack = krl.Function([
    'message',
    'toPublicKeys',
    'fromChann'
  ], (message, toPublicKeys, fromChann) => {

    let sender : any
    if (fromChann) {
      sender = {}
      sender.vk = fromChann.ariesPublicKey
      const privateKey = bs58.decode(fromChann.secret.ariesPrivateKey)
      sender.sk = sodium.crypto_sign_ed25519_sk_to_curve25519(privateKey)
    }

    const cek = sodium.crypto_secretstream_xchacha20poly1305_keygen()

    const recipients = toPublicKeys.map((targetVKey : string) => {
      if (typeof targetVKey === 'string') {
        targetVKey = bs58.decode(targetVKey)
      }
      let encSender = null
      let nonce = null
      let encCEK = null

      const targetPK = sodium.crypto_sign_ed25519_pk_to_curve25519(targetVKey)

      if (sender) {
        nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES)
        encSender = sodium.crypto_box_seal(sender.vk, targetPK)
        encCEK = sodium.crypto_box_easy(cek, nonce, targetPK, sender.sk)
      } else {
        encCEK = sodium.crypto_box_seal(cek, targetPK)
      }

      return {
        encrypted_key: b64url(encCEK),
        header: {
          kid: bs58.encode(targetVKey),
          sender: encSender ? b64url(encSender) : null,
          iv: nonce ? b64url(nonce) : null
        }
      }
    })

    const recipsB64 = b64url(JSON.stringify({
      enc: 'xchacha20poly1305_ietf',
      typ: 'JWM/1.0',
      alg: sender ? 'Authcrypt' : 'Anoncrypt',
      recipients
    }))

    const iv = sodium.randombytes_buf(sodium.crypto_aead_chacha20poly1305_ietf_NPUBBYTES)
    const out = sodium.crypto_aead_chacha20poly1305_ietf_encrypt_detached(message, recipsB64, null, iv, cek)

    return JSON.stringify({
      protected: recipsB64,
      iv: b64url(iv),
      ciphertext: b64url(out.ciphertext),
      tag: b64url(out.mac)
    })
  })

const ursa: krl.Module = {
  generateDID: generateDID,
  unpack: unpack,
  pack: pack,
};

export default ursa;
