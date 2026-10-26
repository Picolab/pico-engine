/**
 * Legacy __testing query shape from rulesetSchema (P3 compat alias).
 * Kept in sync with pico-engine-ui rulesetSchemaToTesting.ts.
 */
module.exports = function rulesetSchemaToTesting (schema) {
  if (!schema) return null

  const events = []
  const seen = new Set()

  for (const op of schema.operations || []) {
    const attrNames = (op.attrs || []).map(function (a) { return a.name })
    const examples = op.examples || []
    for (const ent of op.entry || []) {
      if (!ent.domain || !ent.name) continue
      const baseKey = ent.domain + ':' + ent.name
      if (examples.length === 0) {
        if (seen.has(baseKey)) continue
        seen.add(baseKey)
        events.push({
          domain: ent.domain,
          name: ent.name,
          attrs: attrNames.length ? attrNames : undefined
        })
        continue
      }
      for (const ex of examples) {
        const key = baseKey + ':' + ex.name
        if (seen.has(key)) continue
        seen.add(key)
        const defaults = {}
        for (const k of Object.keys(ex.attrs || {})) {
          const v = ex.attrs[k]
          if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
            defaults[k] = v
          } else if (v != null) {
            defaults[k] = JSON.stringify(v)
          }
        }
        const exAttrNames = Object.keys(defaults).length
          ? Object.keys(defaults)
          : attrNames
        const ev = {
          domain: ent.domain,
          name: ent.name,
          attrs: exAttrNames.length ? exAttrNames : undefined
        }
        if (ex.name) ev.exampleName = ex.name
        if (Object.keys(defaults).length) ev.defaults = defaults
        events.push(ev)
      }
    }
  }

  const queries = []
  for (const q of schema.queries || []) {
    const argNames = (q.args || []).map(function (a) { return a.name })
    const examples = q.examples || []
    if (examples.length === 0) {
      queries.push({
        name: q.name,
        args: argNames.length ? argNames : undefined
      })
      continue
    }
    for (const ex of examples) {
      const defaults = {}
      for (const k of Object.keys(ex.args || {})) {
        const v = ex.args[k]
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
          defaults[k] = v
        } else if (v != null) {
          defaults[k] = JSON.stringify(v)
        }
      }
      const qOut = {
        name: q.name,
        args: Object.keys(defaults).length
          ? Object.keys(defaults)
          : (argNames.length ? argNames : undefined)
      }
      if (ex.name) qOut.exampleName = ex.name
      if (Object.keys(defaults).length) qOut.defaults = defaults
      queries.push(qOut)
    }
  }

  if (events.length === 0 && queries.length === 0) return null
  return { events: events, queries: queries }
}
