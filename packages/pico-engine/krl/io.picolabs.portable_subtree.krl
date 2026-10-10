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
    /** Export a descendant subtree (or this pico when subtreeRootPicoId is ctx:picoId). Read-only. */
    exportSubtree = function(subtreeRootPicoId, secret) {
      dido:exportPortableSubtree(subtreeRootPicoId, secret)
    }

    /** Result of the most recent import (read-only). */
    lastImport = function() {
      ent:lastImport
    }

    /** Debug: { wranglerName, establishedCount, entRulesets, … } from an export blob. */
    summarizeExportBlob = function(blob, secret) {
      dido:summarizePortableSubtreeExport(blob, secret)
    }
  }

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
