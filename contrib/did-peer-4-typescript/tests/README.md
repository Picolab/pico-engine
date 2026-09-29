# Tests to port from Python

Port from [`decentralized-identity/did-peer-4/tests`](https://github.com/decentralized-identity/did-peer-4/tree/main/tests):

| Python file | TS target | Status |
|-------------|-----------|--------|
| `test_did_peer_4.py` | `vectors.test.ts` (full DOC fixture) | partial — hello-world only |
| `test_input_doc.py` | `inputDoc.test.ts` | not started |
| `test_valid.py` | `valid.test.ts` | not started |
| `test_readme_examples.py` | `readmeExamples.test.ts` | not started |
| `tests/examples/*` | shared JSON fixtures (optional cross-lang) | not started |

Run: `npm test` from `contrib/did-peer-4-typescript/`.
