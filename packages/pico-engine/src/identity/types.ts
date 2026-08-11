/**
 * Engine-owned per-pico identity state (Epic 1).
 *
 * Private key shapes are intentionally loose until didwebvh-ts / did-peer-4
 * integration (Epic 2–3). KRL must never receive these types directly.
 */

/** @see docs/design/pico-identity-layer2-work.md § 1.6-known-gap */
export const IDENTITY_STORAGE_KNOWN_GAP =
  "Identity private keys are stored unencrypted in the engine DB (1.6). " +
  "Encryption at rest and passkey-gated unlock are required before treating " +
  "self-hosted engines as non-custodial for agent keys.";

/** Key material for a pico's did:webvh document (signing + agreement). */
export interface WebvhKeys {
  [key: string]: unknown;
}

/** One line of a did:webvh JSON-LD log file. */
export type WebvhLogEntry = Record<string, unknown>;

/** Pairwise did:peer state for one subscription. */
export interface PeerSubscriptionRecord {
  subscriptionId: string;
  /** Our peer DID for this subscription (short form). */
  peerDid: string;
  /** Sender's peer DID — used to route inbound DIDComm. */
  remotePeerDid?: string;
  /** Legacy alias for remotePeerDid. */
  remoteDid?: string;
  /** Caller's did:webvh (for callerDid metadata). */
  remoteWebvhDid?: string;
  /** Internal Rx channel ECI for policy + delivery. */
  rxEci?: string;
  /** Remote mesh root (cross-mesh transport selection). */
  remoteMeshRootId?: string;
  /** Remote engine base URL for outbound DIDComm. */
  remoteTxHost?: string;
  /** Full DIDComm ingress URL when remote did:webvh resolution is unavailable. */
  remoteDidcommEndpoint?: string;
  keys?: Record<string, unknown>;
  createdAt: string;
}

/** Cached resolved DID document (local or remote). */
export interface CachedDidDoc {
  did: string;
  doc: Record<string, unknown>;
  cachedAt: string;
}

/** In-flight DID rotation state (Epic 4+). */
export interface PendingRotation {
  [key: string]: unknown;
}

/** Scalar identity metadata stored under dedicated subkeys. */
export interface DidCommRoute {
  domain: string;
  name: string;
}

export type DidCommRoutes = Record<string, DidCommRoute>;
