/**
 * AES-256-GCM encryption for ruleset state export blobs (Phase A, pico-move).
 */

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LEN = 32;
const IV_LEN = 12;
const SALT_LEN = 16;
/** Override with RULESET_STATE_SCRYPT_N for faster tests (e.g. 1024). */
const SCRYPT_N = Number(process.env.RULESET_STATE_SCRYPT_N || 16384);
const SCRYPT_R = 8;
const SCRYPT_P = 1;

export interface RulesetStateEnvelope {
  v: 1;
  salt: string;
  iv: string;
  tag: string;
  data: string;
}

export interface RulesetStatePayload {
  version: 1;
  rid: string;
  url: string;
  config: Record<string, unknown>;
  ent: Record<string, unknown>;
  exportedAt: string;
}

function deriveKey(secret: string, salt: Buffer): Buffer {
  return scryptSync(secret, salt, KEY_LEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });
}

export function assertSecret(secret: unknown): asserts secret is string {
  if (typeof secret !== "string" || secret.length === 0) {
    throw new TypeError("secret must be a non-empty string");
  }
}

function sealEnvelope(json: string, secret: string): string {
  assertSecret(secret);
  const salt = randomBytes(SALT_LEN);
  const key = deriveKey(secret, salt);
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const enc = Buffer.concat([cipher.update(json, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const envelope: RulesetStateEnvelope = {
    v: 1,
    salt: salt.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    data: enc.toString("base64"),
  };
  return JSON.stringify(envelope);
}

function openEnvelope(blob: string, secret: string): unknown {
  assertSecret(secret);
  let envelope: RulesetStateEnvelope;
  try {
    envelope = JSON.parse(blob) as RulesetStateEnvelope;
  } catch {
    throw new Error("Invalid portable state blob");
  }
  if (envelope.v !== 1) {
    throw new Error(`Unsupported portable state version: ${envelope.v}`);
  }
  const salt = Buffer.from(envelope.salt, "base64");
  const iv = Buffer.from(envelope.iv, "base64");
  const tag = Buffer.from(envelope.tag, "base64");
  const data = Buffer.from(envelope.data, "base64");
  const key = deriveKey(secret, salt);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  try {
    const plain = Buffer.concat([decipher.update(data), decipher.final()]);
    return JSON.parse(plain.toString("utf8"));
  } catch {
    throw new Error(
      "Portable state decryption failed (wrong secret or tampered blob)"
    );
  }
}

/** Encrypt any JSON-serializable payload → envelope string. */
export function sealPortableBlob(payload: object, secret: string): string {
  return sealEnvelope(JSON.stringify(payload), secret);
}

/** Decrypt envelope string → payload (caller validates shape). */
export function openPortableBlob(blob: string, secret: string): unknown {
  return openEnvelope(blob, secret);
}

/** Encrypt payload → JSON envelope string. */
export function sealRulesetState(
  payload: RulesetStatePayload,
  secret: string
): string {
  return sealPortableBlob(payload, secret);
}

/** Decrypt envelope string → payload. */
export function openRulesetState(
  blob: string,
  secret: string
): RulesetStatePayload {
  const payload = openPortableBlob(blob, secret) as RulesetStatePayload;
  if (
    !payload ||
    payload.version !== 1 ||
    typeof payload.rid !== "string"
  ) {
    throw new Error("Invalid ruleset state payload");
  }
  return payload;
}

/** Constant-time compare for optional verification helpers. */
export function secretsEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) {
    return false;
  }
  return timingSafeEqual(ab, bb);
}
