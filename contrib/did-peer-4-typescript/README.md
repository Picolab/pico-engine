# did-peer-4 TypeScript — upstream PR scaffold

Working copy for a contribution to [`decentralized-identity/did-peer-4`](https://github.com/decentralized-identity/did-peer-4).

**Not built or published from pico-engine.** Source of truth for production today:
`packages/pico-engine/src/identity/peerDid4.ts`.

## Prepare PR

1. Open issue — paste from [`ISSUE-DRAFT.md`](./ISSUE-DRAFT.md)
2. Fork DIF repo
3. Copy `typescript/` tree (this folder, renamed) into fork
4. Sync `src/peerDid4.ts` from pico-engine if drifted
5. Port remaining Python tests (see `tests/README.md`)
6. `npm test` locally; open PR with DCO sign-off

Full checklist: [`docs/contributing/did-peer-4-upstream.md`](../../docs/contributing/did-peer-4-upstream.md)

## Local dev (scaffold)

```bash
cd contrib/did-peer-4-typescript
npm install
npm test
npm run build
```
