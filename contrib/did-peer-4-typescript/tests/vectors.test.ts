import { describe, expect, it } from "vitest";
import {
  decode,
  encode,
  encodeShort,
  longToShort,
  matches,
  resolve,
} from "../src/index.js";

/** Minimal vector from DIF Python reference / pico-engine test/peerDid4.ts */
const HELLO_WORLD = {
  doc: { hello: "world" },
  did: "did:peer:4zQmb7xLdVY9TXx8oov5XgpGUmGELgqiAV2699s43i6Qdm3M:zQSJgiFTYiCHjQ9MktwNThRXM7a",
  short: "did:peer:4zQmb7xLdVY9TXx8oov5XgpGUmGELgqiAV2699s43i6Qdm3M",
};

describe("hello world vector", () => {
  it("encode matches known long form", () => {
    expect(encode(HELLO_WORLD.doc)).toBe(HELLO_WORLD.did);
  });

  it("decode roundtrips", () => {
    expect(decode(HELLO_WORLD.did)).toEqual(HELLO_WORLD.doc);
  });

  it("short form matches encodeShort and longToShort", () => {
    const long = encode(HELLO_WORLD.doc);
    expect(encodeShort(HELLO_WORLD.doc)).toBe(HELLO_WORLD.short);
    expect(longToShort(long)).toBe(HELLO_WORLD.short);
  });

  it("resolve contextualizes id and alsoKnownAs", () => {
    const doc = resolve(HELLO_WORLD.did);
    expect(doc.id).toBe(HELLO_WORLD.did);
    expect(doc.alsoKnownAs).toContain(HELLO_WORLD.short);
  });

  it("matches short and long forms", () => {
    expect(matches(HELLO_WORLD.did, HELLO_WORLD.short)).toBe(true);
    expect(matches(HELLO_WORLD.short, HELLO_WORLD.did)).toBe(true);
  });
});
