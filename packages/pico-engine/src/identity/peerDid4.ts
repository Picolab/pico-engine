/**
 * did:peer numalgo 4 — TypeScript port of DIF did-peer-4 (Python reference).
 * https://github.com/decentralized-identity/did-peer-4
 */

import { createHash } from "crypto";
import * as bs58 from "bs58";

const MULTICODEC_JSON = Buffer.from([0x80, 0x04]);
const MULTICODEC_SHA2_256 = Buffer.from([0x12, 0x20]);
const MULTIBASE_BASE58_BTC = "z";

const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const LONG_PATTERN = new RegExp(
  `^did:peer:4zQm[${BASE58_ALPHABET}]{44}:z[${BASE58_ALPHABET}]{6,}$`
);
const SHORT_PATTERN = new RegExp(`^did:peer:4zQm[${BASE58_ALPHABET}]{44}$`);

export type PeerDid4InputDocument = Record<string, unknown>;

function encodeDoc(document: PeerDid4InputDocument): string {
  const payload = MULTICODEC_JSON.toString("binary") + JSON.stringify(document);
  return MULTIBASE_BASE58_BTC + bs58.encode(Buffer.from(payload, "binary"));
}

function decodeDoc(encodedDoc: string): PeerDid4InputDocument {
  const encoding = encodedDoc[0];
  const encoded = encodedDoc.slice(1);
  if (encoding !== MULTIBASE_BASE58_BTC) {
    throw new Error(`Unsupported encoding: ${encoding}`);
  }
  const decodedBytes = bs58.decode(encoded);
  if (
    decodedBytes.length < 2 ||
    decodedBytes[0] !== MULTICODEC_JSON[0] ||
    decodedBytes[1] !== MULTICODEC_JSON[1]
  ) {
    throw new Error("Unsupported multicodec for did:peer:4 document");
  }
  const json = Buffer.from(decodedBytes.slice(2)).toString("utf8");
  return JSON.parse(json) as PeerDid4InputDocument;
}

function hashEncodedDoc(encodedDoc: string): string {
  const digest = createHash("sha256").update(encodedDoc).digest();
  const multihash = Buffer.concat([MULTICODEC_SHA2_256, digest]);
  return MULTIBASE_BASE58_BTC + bs58.encode(multihash);
}

/** Encode input document → long-form did:peer:4. */
export function encodePeerDid4(document: PeerDid4InputDocument): string {
  const encodedDoc = encodeDoc(document);
  const hashed = hashEncodedDoc(encodedDoc);
  return `did:peer:4${hashed}:${encodedDoc}`;
}

/** Encode input document → short-form did:peer:4. */
export function encodePeerDid4Short(document: PeerDid4InputDocument): string {
  const encodedDoc = encodeDoc(document);
  const hashed = hashEncodedDoc(encodedDoc);
  return `did:peer:4${hashed}`;
}

/** Decode long-form did:peer:4 → input document (not contextualized). */
export function decodePeerDid4(did: string): PeerDid4InputDocument {
  if (!did.startsWith("did:peer:4")) {
    throw new Error(`Invalid did:peer:4: ${did}`);
  }
  if (SHORT_PATTERN.test(did)) {
    throw new Error("Cannot decode document from short form did:peer:4");
  }
  if (!LONG_PATTERN.test(did)) {
    throw new Error(`Invalid did:peer:4: ${did}`);
  }
  const body = did.slice("did:peer:4".length);
  const colon = body.indexOf(":");
  if (colon < 0) {
    throw new Error(`Invalid did:peer:4: ${did}`);
  }
  const hashed = body.slice(0, colon);
  const encodedDoc = body.slice(colon + 1);
  if (hashEncodedDoc(encodedDoc) !== hashed) {
    throw new Error(`Hash is invalid for did: ${did}`);
  }
  return decodeDoc(encodedDoc);
}

export function longToShortPeerDid4(did: string): string {
  if (!LONG_PATTERN.test(did)) {
    throw new Error(`DID is not a long form did:peer:4: ${did}`);
  }
  const idx = did.lastIndexOf(":");
  return did.slice(0, idx);
}

export function isPeerDid4(did: string): boolean {
  return did.startsWith("did:peer:4");
}

function visitVerificationMethods(
  document: PeerDid4InputDocument,
  visitor: (vm: Record<string, unknown>) => Record<string, unknown>
): PeerDid4InputDocument {
  const out = { ...document };
  const vms = out.verificationMethod;
  if (Array.isArray(vms)) {
    out.verificationMethod = vms.map((vm) =>
      typeof vm === "object" && vm !== null
        ? visitor(vm as Record<string, unknown>)
        : vm
    );
  }
  for (const rel of [
    "authentication",
    "assertionMethod",
    "keyAgreement",
    "capabilityInvocation",
    "capabilityDelegation",
  ]) {
    const entries = out[rel];
    if (Array.isArray(entries)) {
      out[rel] = entries.map((entry) => {
        if (typeof entry === "object" && entry !== null) {
          return visitor(entry as Record<string, unknown>);
        }
        return entry;
      });
    }
  }
  return out;
}

function contextualizeDocument(
  did: string,
  document: PeerDid4InputDocument
): PeerDid4InputDocument {
  const out: PeerDid4InputDocument = {
    ...document,
    id: did,
  };
  return visitVerificationMethods(out, (vm) => {
    if (!vm.controller) {
      return { ...vm, controller: did };
    }
    return vm;
  });
}

/** Resolve long-form did:peer:4 → contextualized DID document. */
export function resolvePeerDid4(did: string): PeerDid4InputDocument {
  const decoded = decodePeerDid4(did);
  const document = contextualizeDocument(did, decoded);
  const aka = Array.isArray(document.alsoKnownAs)
    ? [...(document.alsoKnownAs as string[])]
    : [];
  aka.push(longToShortPeerDid4(did));
  document.alsoKnownAs = aka;
  return document;
}

/** Resolve short-form variant from long-form did:peer:4. */
export function resolvePeerDid4Short(did: string): PeerDid4InputDocument {
  const decoded = decodePeerDid4(did);
  const shortDid = longToShortPeerDid4(did);
  const document = contextualizeDocument(shortDid, decoded);
  const aka = Array.isArray(document.alsoKnownAs)
    ? [...(document.alsoKnownAs as string[])]
    : [];
  aka.push(did);
  document.alsoKnownAs = aka;
  return document;
}

/** Match short/long peer:4 forms. */
export function peerDid4Matches(stored: string, incoming: string): boolean {
  if (stored === incoming) {
    return true;
  }
  if (!isPeerDid4(stored) || !isPeerDid4(incoming)) {
    return false;
  }
  try {
    if (LONG_PATTERN.test(stored)) {
      if (stored === incoming || longToShortPeerDid4(stored) === incoming) {
        return true;
      }
    }
    if (LONG_PATTERN.test(incoming)) {
      if (stored === longToShortPeerDid4(incoming)) {
        return true;
      }
    }
  } catch {
    return false;
  }
  return false;
}
