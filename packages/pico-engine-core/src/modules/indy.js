const _sodium = require('libsodium-wrappers');
const mkKRLfn = require('../mkKRLfn')

module.exports = function (core) {
  const def = {}

  def.unpack = mkKRLfn([
    'message',
    'eci'
  ], async (ctx, args) => {
    await _sodium.ready;
    const sodium = _sodium;

    return {
      message: 'secret message'
      // sender_key: sender_vk,
      // recipient_key: recip_vk
    }
  })

  def.pack = mkKRLfn([
    'message',
    'eci'
  ], async (ctx, args) => {
    await _sodium.ready;
    const sodium = _sodium;

    return {}
  })

  return {
    def
  }
}
