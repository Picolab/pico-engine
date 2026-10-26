# Pico schemas — engine scope complete (1.8 §1)

**Status:** **engine complete** (2026-10-23). Design: [`pico-schemas.md`](pico-schemas.md).

---

## Shipped

| Layer | Deliverable |
|-------|-------------|
| **Parser** | `/** … */` doc comments on rules and shared/provided globals (`packages/krl-parser`) |
| **Compiler** | `rulesetSchema` JSON on compile; derive `select`, attrs, emits, prechecks, `alsoSelectedBy`; annotation lint; **`krl-check`** CLI |
| **Compat** | Query **`__testing`** filled from `rulesetSchema` when annotated (1.9: remove injection) |
| **Engine core** | Merge **`picoSchema`** on install/uninstall; **`rulesetSchema`**, **`schemaBindings`**, **`channelSchema`**; **`ruleset_set_changed`** → wrangler **`schema_updated`** |
| **Wrangler** | Delegates to `ctx:*`; bundled platform RSs annotated (wrangler, PDS, OAuth, subscription, engine-ui, portable_subtree) |
| **UI** | Testing tab from **`rulesetSchema(rid)`**; Docs modal; history/saved on pico; About **`picoSchema()`** |
| **Dev MCP** | `pico_schema`, `ruleset_schema` tools |
| **Tooling** | `npm run krl-schema`; **`npm run check:krl-schema-samples`** (bundled markdown drift gate) |
| **Tests** | `npm run test:schema` (root); `packages/pico-engine-core/test/picoSchema.ts`; UI schema/history tests |

---

## Deferred (not blocking 1.8 engine tag)

| Item | Notes |
|------|--------|
| **JSON Schema export** | `picoSchema({ format: "jsonschema" })` — P4 in design; mesh MCP / HA |
| **Public docs site U8** | Copy generated markdown from `tools/krl-schema/samples/` into `public/docs/` + `llms-full.txt` CI (samples gate exists; site copy optional for 1.8.0) |
| **Remove `__testing1` injection** | 1.9 |
| **Doctests** | Stretch (`krl doctest`) |
| **Manifold-api annotations** | Separate repo / release |
| **Discovery hand-written `bindings()`** | SafeAndMine `notifications` pass-through until 1.9 |

---

## Verify

```sh
npm run test:schema    # from repo root
npm run krl-check -- packages/pico-engine/krl/io.picolabs.wrangler.krl
```

Exit **#2** (Testing tab + `rulesetSchema` / `picoSchema`): covered by core + UI tests above.

---

## References

- Audit of bundled channel policies (orthogonal): [`channel-policy-audit-2026-10.md`](channel-policy-audit-2026-10.md)
- Release plan §1: [`docs/release/1.8.md`](../release/1.8.md)
