// Thanks to https://github.com/dbluhm/indy-pack-unpack-js
const bs58 = require('bs58')
const ktypes = require('krl-stdlib/types')
const mkKRLfn = require('../mkKRLfn')
const sodium = require('libsodium-wrappers')

function b64url (input) {
  return sodium.to_base64(input, sodium.base64_variants.URLSAFE)
}

function b64dec (input) {
  return sodium.from_base64(input, sodium.base64_variants.URLSAFE)
}

function b64decStr (input) {
  return sodium.to_string(sodium.from_base64(input, sodium.base64_variants.URLSAFE))
}

module.exports = function (core) {
  const def = {}

  def.sig_data = mkKRLfn([
    'bytes'
  ], async (ctx, args) => {
    return b64url(Uint8Array.from(args.bytes))
  })

  def.crypto_sign = mkKRLfn([
    'bytes',
    'eci'
  ], async (ctx, args) => {
    const chann = await core.db.getChannelSecrets(args.eci)
    const key = bs58.decode(chann.sovrin.secret.indyPrivate)
    return b64url(sodium.crypto_sign_detached(Uint8Array.from(args.bytes), key))
  })

  def.verify_signed_field = mkKRLfn([
    'signed_field'
  ], async (ctx, args) => {
    const signatureBytes = b64dec(args.signed_field.signature)
    const sigDataBytes = b64dec(args.signed_field.sig_data)
    const signer = bs58.decode(args.signed_field.signer)
    const verified = sodium.crypto_sign_verify_detached(
      signatureBytes,
      sigDataBytes,
      signer)
    const data = Buffer.from(sigDataBytes.slice(8)).toString('ascii')
    return {
      'sig_verified': verified,
      'field': data,
      'timestamp': sigDataBytes.slice(0, 8)
    }
  })
  def.unpack = mkKRLfn([
    'message',
    'eci'
  ], async (ctx, args) => {
    const chann = await core.db.getChannelSecrets(args.eci)
    const keys = {
      public: bs58.decode(chann.sovrin.indyPublic),
      public58: chann.sovrin.indyPublic,
      private: bs58.decode(chann.sovrin.secret.indyPrivate)
    }

    const wrapper = ktypes.isString(args.message)
      ? JSON.parse(args.message)
      : args.message

    const recipsOuter = JSON.parse(b64decStr(wrapper.protected))

    const recipient = recipsOuter.recipients.find(r => {
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

  def.pack = mkKRLfn([
    'message',
    'toPublicKeys',
    'fromECI'
  ], async (ctx, args) => {
    const message = ktypes.toString(args.message)

    let sender
    if (args.fromECI) {
      const fromChann = await core.db.getChannelSecrets(args.fromECI)
      sender = {}
      sender.vk = fromChann.sovrin.indyPublic
      const privateKey = bs58.decode(fromChann.sovrin.secret.indyPrivate)
      sender.sk = sodium.crypto_sign_ed25519_sk_to_curve25519(privateKey)
    }

    const cek = sodium.crypto_secretstream_xchacha20poly1305_keygen()

    const recipients = args.toPublicKeys.map(targetVKey => {
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

  return {
    def
  }
}
