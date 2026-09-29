# GitHub issue draft — paste at https://github.com/decentralized-identity/did-peer-4/issues/new

**Title:** TypeScript implementation — offer from pico-engine spike

---

## Summary

We have a **TypeScript port** of the Python reference (`encode`, `decode`, `resolve`, short/long forms) developed for [pico-engine](https://github.com/Picolab/pico-engine) (did:peer:4 for Layer 2 identity, 1.7). It validates against the simple Python test vector (`{hello: "world"}` → `did:peer:4zQmb7xLdVY9TXx8oov5XgpGUmGELgqiAV2699s43i6Qdm3M:…`) and is in production use behind a custom Veramo resolver.

There is **no npm package** for did:peer:4 today, and `@veramo/did-provider-peer` only supports numalgo 0/2. A maintained TS implementation in this repo would help the broader JS/DIDComm ecosystem.

We would like to **contribute** the core library upstream rather than maintain a silent fork.

## Proposed scope

**In scope (library only):**

- `encode` / `encodeShort` — input document → long/short `did:peer:4`
- `decode` — long form → input document (hash verification)
- `resolve` / `resolveShort` — contextualized DID document + `alsoKnownAs`
- `longToShort`, `matches` (short ↔ long equivalence)
- Test parity with existing Python suite (`tests/test_did_peer_4.py`, `test_input_doc.py`, `test_valid.py`, README examples)
- vitest + GitHub Actions

**Out of scope (application-specific):**

- Key generation / Multikey builders
- Veramo, DIDComm, or agent integration

## Proposed layout

Add a `typescript/` directory alongside the Python package:

```
typescript/
├── package.json
├── src/
│   ├── index.ts
│   └── peerDid4.ts
└── tests/
    └── …
```

Open to maintainer preference (`packages/typescript/`, monorepo tooling, etc.).

## Dependencies

- `bs58` (multibase base58-btc)
- Node `crypto` for SHA-256 today; happy to refactor for browser (`Uint8Array` + injectable hash) if desired

## Questions for maintainers

1. Is a `typescript/` subdirectory in this repo the preferred home, or a separate repo under the DIF org?
2. Naming for npm publish — `did-peer-4`, `@digitalcredentials/did-peer-4`, or other?
3. Should TS tests import shared JSON fixtures from `tests/examples/` (cross-language vectors)?

## Reference

- Source (MIT, Picolab): https://github.com/Picolab/pico-engine/blob/windley/1.7-identity-portability/packages/pico-engine/src/identity/peerDid4.ts
- We will sign commits under DCO / Apache-2.0 per CONTRIBUTING.md.

Happy to open a draft PR after feedback on layout and API naming (align with Python `did_peer_4` module vs camelCase TS exports).
