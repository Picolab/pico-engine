import { ed25519, x25519 } from "@noble/curves/ed25519.js";
import { bytesToHex } from "@veramo/utils";
import * as bs58 from "bs58";
import {
  encodePeerDid4,
  longToShortPeerDid4,
  resolvePeerDid4,
  type PeerDid4InputDocument,
} from "./peerDid4";
import type { StoredPeerDidBundle, StoredVeramoKey } from "./peerDid";

function multibasePublicKey(prefix: number, second: number, raw: Uint8Array): string {
  return "z" + bs58.encode(Buffer.concat([Buffer.from([prefix, second]), Buffer.from(raw)]));
}

export interface PeerDid4KeySpec {
  multikey: string;
  relationships: Array<
    | "authentication"
    | "assertionMethod"
    | "keyAgreement"
    | "capabilityDelegation"
    | "capabilityInvocation"
  >;
  ident?: string;
}

export function inputDocFromKeys(
  keys: PeerDid4KeySpec[],
  services?: Record<string, unknown>[]
): PeerDid4InputDocument {
  const inputDoc: PeerDid4InputDocument = {
    "@context": ["https://www.w3.org/ns/did/v1"],
  };
  keys.forEach((key, index) => {
    const ident = key.ident || `#key-${index}`;
    const vm = {
      id: ident,
      type: "Multikey",
      publicKeyMultibase: key.multikey,
    };
    const vms = (inputDoc.verificationMethod as unknown[]) || [];
    vms.push(vm);
    inputDoc.verificationMethod = vms;
    const ctx = inputDoc["@context"] as string[];
    if (!ctx.includes("https://w3id.org/security/multikey/v1")) {
      ctx.push("https://w3id.org/security/multikey/v1");
    }
    for (const rel of key.relationships) {
      const list = (inputDoc[rel] as unknown[]) || [];
      list.push(ident);
      inputDoc[rel] = list;
    }
  });
  if (services?.length) {
    inputDoc.service = services;
  }
  return inputDoc;
}

/** Create did:peer:4 (long form) with Ed25519 + X25519 keys for DIDComm. */
export function createPeerDid4WithKeys(): {
  did: string;
  shortDid: string;
  didDocument: PeerDid4InputDocument;
  keys: StoredPeerDidBundle;
} {
  const edSecret = ed25519.utils.randomSecretKey();
  const edPublic = ed25519.getPublicKey(edSecret);
  const xSecret = x25519.utils.randomSecretKey();
  const xPublic = x25519.getPublicKey(xSecret);

  const edMulti = multibasePublicKey(0xed, 0x01, edPublic);
  const xMulti = multibasePublicKey(0xec, 0x01, xPublic);

  const inputDoc = inputDocFromKeys([
    {
      multikey: edMulti,
      relationships: ["authentication", "capabilityDelegation"],
      ident: "#key-0",
    },
    {
      multikey: xMulti,
      relationships: ["keyAgreement"],
      ident: "#key-1",
    },
  ]);

  const did = encodePeerDid4(inputDoc);
  const shortDid = longToShortPeerDid4(did);
  const didDocument = resolvePeerDid4(did);

  const edPublicHex = bytesToHex(edPublic);
  const xPublicHex = bytesToHex(xPublic);

  const veramoKeys: StoredVeramoKey[] = [
    {
      type: "Ed25519",
      kid: edPublicHex,
      privateKeyHex: bytesToHex(edSecret),
      publicKeyHex: edPublicHex,
      meta: { algorithms: ["EdDSA", "Ed25519"] },
      kms: "local",
    },
    {
      type: "X25519",
      kid: xPublicHex,
      privateKeyHex: bytesToHex(xSecret),
      publicKeyHex: xPublicHex,
      meta: { algorithms: ["ECDH", "ECDH-ES", "ECDH-1PU"] },
      kms: "local",
    },
  ];

  return {
    did,
    shortDid,
    didDocument,
    keys: { veramoKeys },
  };
}
