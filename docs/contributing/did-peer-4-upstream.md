# Contribute did:peer:4 TypeScript to DIF

**Status:** planned (parallel to 1.7 — **not** on the 1.7 critical path)  
**Owner:** Picolab / pico-engine team  
**Target repo:** [`decentralized-identity/did-peer-4`](https://github.com/decentralized-identity/did-peer-4)  
**Source in pico-engine:** `packages/pico-engine/src/identity/peerDid4.ts` (spike, commit `0bcee109`)

---

## Why

The DIF reference implementation is **Python-only**. There is no maintained npm package for did:peer:4.
`@veramo/did-provider-peer` v7 supports numalgo **0/2 only**. Pico-engine needed peer:4 for 1.7 and
ported the Python reference to TypeScript in-tree.

Offering the TS port upstream:

- Gets **external review** on crypto / encoding correctness
- Helps **Veramo, Credo, and other JS stacks** avoid N silent ports
- Positions Picolab as a **standards contributor**

**Pico-engine keeps its in-tree copy until upstream merges and (optionally) publishes to npm.**

---

## Scope

| In upstream PR | Stays in pico-engine |
|----------------|---------------------|
| `encodePeerDid4`, `decodePeerDid4`, `resolvePeerDid4`, short/long helpers, `peerDid4Matches` | `peerDid4Create.ts` (Veramo key bundles) |
| Full Python test vector parity | Veramo `did-resolver` hook in `veramoDidComm.ts` |
| Package + CI (vitest, Node 20+) | DIDComm integration tests |

---

## Checklist

| # | Task | Status |
|---|------|--------|
| 1 | Open DIF issue (draft in [`contrib/did-peer-4-typescript/ISSUE-DRAFT.md`](../../contrib/did-peer-4-typescript/ISSUE-DRAFT.md)) | ☐ |
| 2 | Maintainer feedback on layout (`typescript/` vs `packages/ts/`) | ☐ |
| 3 | Extract core from `peerDid4.ts` into PR scaffold | ☐ |
| 4 | Port Python tests: `test_did_peer_4.py`, `test_input_doc.py`, `test_valid.py`, README examples | ☐ |
| 5 | Browser-neutral hash (optional `Uint8Array` + injectable SHA-256 vs Node `crypto`) | ☐ |
| 6 | vitest + GitHub Actions in PR branch | ☐ |
| 7 | DCO sign-off on commits (Apache-2.0) | ☐ |
| 8 | Submit PR to DIF | ☐ |
| 9 | After merge: decide npm publish path; pico-engine may depend on published package | ☐ |

**Estimate:** 2–4 focused days after issue approval.

---

## Proposed DIF repo layout

```
did-peer-4/                    # existing Python at repo root
├── did_peer_4/
├── tests/
└── typescript/                # NEW — proposed in issue
    ├── package.json
    ├── tsconfig.json
    ├── vitest.config.ts
    ├── README.md
    ├── src/
    │   ├── index.ts
    │   └── peerDid4.ts
    └── tests/
        ├── vectors.test.ts
        ├── inputDoc.test.ts
        └── valid.test.ts
```

Local working copy (prepare PR before fork): [`contrib/did-peer-4-typescript/`](../../contrib/did-peer-4-typescript/).

---

## Sync policy (until upstream merge)

1. **Bug fixes** — fix in `packages/pico-engine/src/identity/peerDid4.ts` first, then copy to `contrib/`.
2. **Upstream PR** — fork DIF, add `typescript/` from `contrib/`, open PR.
3. **After merge** — track upstream; consider `npm install did-peer-4` (or scoped name TBD) in pico-engine.

---

## Links

- DIF CONTRIBUTING: https://github.com/decentralized-identity/did-peer-4/blob/main/CONTRIBUTING.md
- Python tests: https://github.com/decentralized-identity/did-peer-4/tree/main/tests
- Pico-engine spike tests: `packages/pico-engine/test/peerDid4.ts` (`npm run test:peer-did4`)
