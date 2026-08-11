import { ed25519 } from "@noble/curves/ed25519.js";
import {
  bytesToHex,
  convertEd25519PrivateKeyToX25519,
  convertEd25519PublicKeyToX25519,
} from "@veramo/utils";
import type {
  SignableDocument,
  SigningInput,
  SigningOutput,
  VerificationMethod,
  Verifier,
} from "didwebvh-ts/dist/types/interfaces";

type DidWebvhTs = typeof import("didwebvh-ts");

export interface StoredWebvhKeyMaterial {
  updateKeyMultibase: string;
  verificationMethodId: string;
  verificationMethod: VerificationMethod & { secretKeyMultibase: string };
}

export async function generateWebvhKeyMaterial(): Promise<StoredWebvhKeyMaterial> {
  const webvh = await loadDidWebvhTs();
  const { secretKey, publicKey } = ed25519.keygen();
  const publicKeyMultibase = webvh.multibaseEncode(
    new Uint8Array([0xed, 0x01, ...publicKey]),
    webvh.MultibaseEncoding.BASE58_BTC
  );
  const secretKeyMultibase = webvh.multibaseEncode(
    new Uint8Array([0x80, 0x26, ...secretKey, ...publicKey]),
    webvh.MultibaseEncoding.BASE58_BTC
  );
  const verificationMethodId = `did:key:${publicKeyMultibase}#${publicKeyMultibase}`;
  return {
    updateKeyMultibase: publicKeyMultibase,
    verificationMethodId,
    verificationMethod: {
      type: "Multikey",
      publicKeyMultibase,
      secretKeyMultibase,
      purpose: "assertionMethod",
    },
  };
}

export async function createWebvhCrypto(
  keys: StoredWebvhKeyMaterial
): Promise<WebvhCrypto> {
  const webvh = await loadDidWebvhTs();
  return new WebvhCrypto(webvh, keys);
}

export class WebvhCrypto {
  private webvh: DidWebvhTs;
  readonly keys: StoredWebvhKeyMaterial;

  constructor(webvh: DidWebvhTs, keys: StoredWebvhKeyMaterial) {
    this.webvh = webvh;
    this.keys = keys;
  }

  getVerificationMethodId(): string {
    return this.keys.verificationMethodId;
  }

  async sign(input: SigningInput<SignableDocument>): Promise<SigningOutput> {
    const { bytes: secretKeyBytes } = this.webvh.multibaseDecode(
      this.keys.verificationMethod.secretKeyMultibase
    );
    const seed = secretKeyBytes.slice(2).slice(0, 32);
    const proof = ed25519.sign(
      await this.webvh.prepareDataForSigning(input.document, input.proof),
      seed
    );
    return {
      proofValue: this.webvh.multibaseEncode(
        proof,
        this.webvh.MultibaseEncoding.BASE58_BTC
      ),
    };
  }

  async verify(
    signature: Uint8Array,
    message: Uint8Array,
    publicKey: Uint8Array
  ): Promise<boolean> {
    return ed25519.verify(signature, message, publicKey, { zip215: false });
  }
}

export function storedKeysFromWebvhKeys(
  raw: Record<string, unknown>
): StoredWebvhKeyMaterial | null {
  const updateKeyMultibase = raw.updateKeyMultibase;
  const verificationMethodId = raw.verificationMethodId;
  const verificationMethod = raw.verificationMethod;
  if (
    typeof updateKeyMultibase !== "string" ||
    typeof verificationMethodId !== "string" ||
    !verificationMethod ||
    typeof verificationMethod !== "object"
  ) {
    return null;
  }
  const vm = verificationMethod as VerificationMethod & {
    secretKeyMultibase?: string;
  };
  if (typeof vm.secretKeyMultibase !== "string") {
    return null;
  }
  return {
    updateKeyMultibase,
    verificationMethodId,
    verificationMethod: vm as StoredWebvhKeyMaterial["verificationMethod"],
  };
}

export function webvhKeysToStore(keys: StoredWebvhKeyMaterial): Record<string, unknown> {
  return {
    updateKeyMultibase: keys.updateKeyMultibase,
    verificationMethodId: keys.verificationMethodId,
    verificationMethod: keys.verificationMethod,
  };
}

/** Veramo key material for decrypting DIDComm addressed to this pico's did:webvh. */
export async function webvhAgreementKeysForVeramo(
  did: string,
  doc: Record<string, unknown>,
  keys: StoredWebvhKeyMaterial
): Promise<
  Array<{
    type: string;
    kid: string;
    privateKeyHex: string;
    publicKeyHex: string;
    kms: string;
  }>
> {
  const webvh = await loadDidWebvhTs();
  const { bytes: secretKeyBytes } = webvh.multibaseDecode(
    keys.verificationMethod.secretKeyMultibase
  );
  const seed = secretKeyBytes.slice(2, 34);
  const { bytes: publicKeyBytes } = webvh.multibaseDecode(
    keys.verificationMethod.publicKeyMultibase as string
  );
  const edPub = publicKeyBytes.slice(2);
  const xPub = convertEd25519PublicKeyToX25519(edPub);
  const xPriv = convertEd25519PrivateKeyToX25519(seed);

  const keyAgreement = doc.keyAgreement;
  const kids: string[] = [];
  if (Array.isArray(keyAgreement)) {
    for (const entry of keyAgreement) {
      if (typeof entry === "string") {
        kids.push(entry);
      } else if (entry && typeof entry === "object" && typeof (entry as { id?: string }).id === "string") {
        kids.push((entry as { id: string }).id);
      }
    }
  }
  if (kids.length === 0) {
    kids.push(`${did}#didcomm`);
  }

  return kids.map((kid) => ({
    type: "X25519",
    kid,
    privateKeyHex: bytesToHex(xPriv),
    publicKeyHex: bytesToHex(xPub),
    kms: "local",
  }));
}

let didWebvhTs: DidWebvhTs | undefined;

export async function loadDidWebvhTs(): Promise<DidWebvhTs> {
  if (!didWebvhTs) {
    didWebvhTs = await import("didwebvh-ts");
  }
  return didWebvhTs;
}

export type WebvhVerifier = Verifier;

export async function createPassthroughVerifier(): Promise<Verifier> {
  return {
    async verify(
      signature: Uint8Array,
      message: Uint8Array,
      publicKey: Uint8Array
    ): Promise<boolean> {
      const { ed25519 } = await import("@noble/curves/ed25519.js");
      return ed25519.verify(signature, message, publicKey, { zip215: false });
    },
  };
}
