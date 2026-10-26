ruleset io.picolabs.portable_subtree {
  meta {
    name "Portable subtree"
    description <<
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
    >>
    author "PICOLABS"

    provides exportSubtree, lastImport, summarizeExportBlob
    shares exportSubtree, lastImport, summarizeExportBlob
  }

  global {
    /**
     * Export a descendant subtree (or this pico itself) as an encrypted blob:
     * rulesets, entity state, channels, schedules, and Layer 2 identity. Read-only;
     * the source subtree is untouched. Transfer the blob to the adopting parent and
     * send it portable_subtree:import there with the same secret.
     * @param subtreeRootPicoId String "pico id of the subtree root; this pico's own id exports this pico"
     * @param secret String "encryption secret; the importer needs the same one"
     * @returns String "encrypted export blob"
     */
    exportSubtree = function(subtreeRootPicoId, secret) {
      dido:exportPortableSubtree(subtreeRootPicoId, secret)
    }

    /**
     * Result of the most recent portable_subtree:import on this pico (the same
     * attrs as the portable_subtree:imported event), or null if none.
     * @returns Map
     */
    lastImport = function() {
      ent:lastImport
    }

    /**
     * Inspect an export blob before importing it: subtree root name, relationship
     * count, rulesets with entity state, and similar. Read-only.
     * @param blob String "export blob from exportSubtree"
     * @param secret String "the secret used to export it"
     * @returns Map "{ wranglerName, establishedCount, entRulesets, … }"
     */
    summarizeExportBlob = function(blob, secret) {
      dido:summarizePortableSubtreeExport(blob, secret)
    }
  }

  /**
   * Import an exported subtree as a child of this pico. Rulesets, entity state,
   * channels, schedules, and identity are restored, and Layer 2 relationships are
   * relocated so they survive the move. The result is stored for lastImport() and
   * raised as portable_subtree:imported. This pico must provide any platform
   * services the subtree relied on in its old mesh (e.g. import a Manifold app
   * pico under a Manifold parent). The source subtree is not deleted.
   * @attr blob String "export blob from exportSubtree"
   * @attr secret String "the secret used to export it"
   * @attr renewIngress Boolean optional "mint a fresh DIDComm ingress channel when relocating each pico's did:webvh (default true)"
   * @attr bootstrapDisplayName String optional "display name for the imported root"
   * @example "import" { "blob": "<blob from exportSubtree>", "secret": "<secret>" }
   */
  rule import_subtree {
    select when portable_subtree import
    pre {
      blob = event:attr("blob")
      secret = event:attr("secret")
      result = dido:importPortableSubtree(blob, secret, {
        "renewIngress": event:attr("renewIngress").defaultsTo(true),
        "parentChannelEci": event:eci,
        "bootstrapDisplayName": event:attr("bootstrapDisplayName")
      })
    }
    fired {
      ent:lastImport := result
      raise portable_subtree event "imported" attributes result
    }
  }
}
