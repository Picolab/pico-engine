// Thanks to https://github.com/dbluhm/indy-pack-unpack-js
const _sodium = require('libsodium-wrappers')
const bs58 = require('bs58')
const ktypes = require('krl-stdlib/types')
const mkKRLfn = require('../mkKRLfn')

module.exports = function (core) {
  const def = {}

  def.unpack = mkKRLfn([
    'message',
    'eci'
  ], async (ctx, args) => {
    await _sodium.ready
    const sodium = _sodium

    const msg = ktypes.isString(args.message)
      ? JSON.parse(args.message)
      : args.message

    return { message: 'secret message' }
  })

  def.pack = mkKRLfn([
    'message',
    'toECIs',
    'fromECI'
  ], async (ctx, args) => {
    const message = ktypes.toString(args.message)
    const toKeys = await Promise.all(args.toECIs.map(eci => core.db.getChannelSecrets(eci).then(chann => bs58.decode(chann.sovrin.verifyKey))))

    await _sodium.ready
    const sodium = _sodium
    function b64url (input) {
      return sodium.to_base64(input, sodium.base64_variants.URLSAFE_NO_PADDING)
    }

    let sender
    if (args.fromECI) {
      const fromChann = await core.db.getChannelSecrets(args.fromECI)
      sender = {}
      sender.vk = fromChann.sovrin.verifyKey
      const privateKey = bs58.decode(fromChann.sovrin.secret.encryptionPrivateKey)
      sender.sk = sodium.crypto_sign_ed25519_sk_to_curve25519(from.privateKey)
    }

    const cek = sodium.crypto_secretstream_xchacha20poly1305_keygen()

    const recipients = toKeys.map(targetVKey => {
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
