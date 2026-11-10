# io.picolabs.portable_subtree

Optional wrangler utility for copying a pico subtree (rulesets, entity state,  
channels, schedules, and Layer 2 identity) to another parent — on the same  
engine or a different one. Not installed by default.

Export (install on an ancestor of the subtree to copy):  
portable_subtree:exportSubtree(subtreeRootPicoId, secret)  
→ encrypted blob (transfer manually to the destination engine)

Inspect a blob before import (same secret):  
portable_subtree:summarizeExportBlob(blob, secret)

Import (install on the adopting parent):  
raise portable_subtree event "import"  
attributes { "blob": "...", "secret": "..." }  
→ portable_subtree:imported event; read result with portable_subtree:lastImport()

The importer must ensure the recipient mesh provides any platform services  
the subtree relied on from ancestors in the donor mesh (e.g. import a  
Manifold app pico under a Manifold parent, not a bare wrangler root).

After import, delete the source subtree manually if you no longer need it.

*Version draft. Generated from the ruleset's annotations by `krl-schema --format markdown`; edit the `/** */` comments in the source, not this page. Only annotated rules and shared functions appear.*

**Operations:** [portable_subtree:import](#portable_subtreeimport)  
**Queries:** [exportSubtree](#exportsubtreesubtreerootpicoid-secret--string) · [lastImport](#lastimport--map) · [summarizeExportBlob](#summarizeexportblobblob-secret--map)

## Operations

Events you can send to a pico with this ruleset installed. Whether an operation acts, and what it emits, depends on its condition and the pico's state when the event arrives.

### `portable_subtree:import`

Import an exported subtree as a child of this pico. Rulesets, entity state, channels, schedules, and identity are restored, and Layer 2 relationships are relocated so they survive the move. The result is stored for lastImport() and raised as portable_subtree:imported. This pico must provide any platform services the subtree relied on in its old mesh (e.g. import a Manifold app pico under a Manifold parent). The source subtree is not deleted.

**Send:** `portable_subtree:import`  
**Rule:** `import_subtree`

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `blob` | String | yes | export blob from exportSubtree |
| `secret` | String | yes | the secret used to export it |
| `renewIngress` | Boolean | no | mint a fresh DIDComm ingress channel when relocating each pico's did:webvh (default true) |
| `bootstrapDisplayName` | String | no | display name for the imported root |

**Examples:**

- **import:** `{"blob":"<blob from exportSubtree>","secret":"<secret>"}`

**Acts when:** always, once selected

**May emit** (possible, not guaranteed):

- raises `portable_subtree:imported` on this pico — when it acts

<details><summary>Select expression</summary>

```krl
select when portable_subtree import
```

</details>

## Queries

### `exportSubtree(subtreeRootPicoId, secret)` → String

Export a descendant subtree (or this pico itself) as an encrypted blob: rulesets, entity state, channels, schedules, and Layer 2 identity. Read-only; the source subtree is untouched. Transfer the blob to the adopting parent and send it portable_subtree:import there with the same secret.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `subtreeRootPicoId` | String | yes |  | pico id of the subtree root; this pico's own id exports this pico |
| `secret` | String | yes |  | encryption secret; the importer needs the same one |

**Call:** `GET /sky/query/<eci>/io.picolabs.portable_subtree/exportSubtree?subtreeRootPicoId=…&secret=…`, or `<alias>:exportSubtree(subtreeRootPicoId, secret)` from KRL with `use module io.picolabs.portable_subtree alias <alias>`

### `lastImport()` → Map

Result of the most recent portable_subtree:import on this pico (the same attrs as the portable_subtree:imported event), or null if none.

**Call:** `GET /sky/query/<eci>/io.picolabs.portable_subtree/lastImport`, or `<alias>:lastImport()` from KRL with `use module io.picolabs.portable_subtree alias <alias>`

### `summarizeExportBlob(blob, secret)` → Map

Inspect an export blob before importing it: subtree root name, relationship count, rulesets with entity state, and similar. Read-only.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `blob` | String | yes |  | export blob from exportSubtree |
| `secret` | String | yes |  | the secret used to export it |

**Call:** `GET /sky/query/<eci>/io.picolabs.portable_subtree/summarizeExportBlob?blob=…&secret=…`, or `<alias>:summarizeExportBlob(blob, secret)` from KRL with `use module io.picolabs.portable_subtree alias <alias>`
