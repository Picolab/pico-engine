# Portable subtrees: io.picolabs.portable_subtree

*Optional. Not installed by default. API reference: [io.picolabs.portable_subtree](/rulesets/io.picolabs.portable_subtree).*

`io.picolabs.portable_subtree` copies a pico and all its descendants to another parent, on the same engine or on another one. It copies their rulesets, entity state, channels, schedules, and identity. Each pico keeps its `did:webvh`, and its DID-based relationships are moved so they keep working.

## Export

Install it on an ancestor of the pico you want to copy (the root pico works). Then query it:

```krl
blob = portable_subtree:exportSubtree(subtree_root_pico_id, secret)
```

The result is an encrypted blob. Move it to the destination however you like. Keep the secret separately: it isn't in the blob.

## Inspect

Before importing, check what a blob holds, with the same secret:

```krl
portable_subtree:summarizeExportBlob(blob, secret)
```

## Import

Install the ruleset on the pico that will be the new parent, and send it:

```krl
raise portable_subtree event "import" attributes {"blob": blob, "secret": secret}
```

The subtree becomes a child of that pico. The ruleset raises `portable_subtree:imported`, and `portable_subtree:lastImport()` returns the result. Wrangler on the imported pico raises `wrangler:subtree_imported`.

## Things to know

- **What the subtree relied on.** Picos often depend on services their ancestors provide: shared rulesets, relationships to a framework's picos, channels set up by a parent. The new parent has to provide them too. For example, import a Manifold app's pico under a Manifold parent, not under a bare root.
- **The original stays.** Exporting copies; it doesn't remove anything. Delete the source subtree yourself when you no longer need it.
- **The blob is sensitive.** It holds the subtree's state and capabilities. Treat it, and its secret, like credentials.

## Read more

- The [Moving picos](/cookbook/moving_picos/) demo: export a pico and its children from one engine and import them on another.
- [The design of pico moves](/design/pico-move).
