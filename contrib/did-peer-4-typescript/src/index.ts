/**
 * Public API — align naming with Python `did_peer_4` where practical.
 * @see https://github.com/decentralized-identity/did-peer-4
 */

export {
  decodePeerDid4 as decode,
  encodePeerDid4 as encode,
  encodePeerDid4Short as encodeShort,
  isPeerDid4,
  longToShortPeerDid4 as longToShort,
  peerDid4Matches as matches,
  resolvePeerDid4 as resolve,
  resolvePeerDid4Short as resolveShort,
  type PeerDid4InputDocument,
} from "./peerDid4.js";
