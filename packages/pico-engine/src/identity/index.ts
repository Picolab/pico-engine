export {
  IdentityStore,
  IDENTITY_PREFIX,
  migrateFromDidO,
  type IdentityStoreDeps,
} from "./store";
export { IdentityService, type IdentityServiceDeps } from "./IdentityService";
export { IdentityError } from "./errors";
export { default as initDidoModule } from "./didoModule";
export {
  IDENTITY_STORAGE_KNOWN_GAP,
  type CachedDidDoc,
  type DidCommRoutes,
  type PeerSubscriptionRecord,
  type PendingRotation,
  type WebvhKeys,
  type WebvhLogEntry,
} from "./types";
export type {
  EstablishSubscriptionInput,
  EstablishSubscriptionResult,
  LinkRemotePeerInput,
} from "./establishSubscription";
export type { StoredVeramoKey, StoredPeerDidBundle } from "./peerDid";
