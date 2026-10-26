var derive = require('./deriveSchema')
var deriveEmits = require('./deriveEmits')

function chevronPlainText (chevron) {
  if (!chevron || chevron.type !== 'Chevron' || !chevron.value) return null
  const raw = chevron.value.map(function (part) {
    if (part.type === 'String') return part.value
    return '#{' + derive.gen(part) + '}'
  }).join('')
  return raw
    .replace(/[^\S\n]+/g, ' ')
    .split('\n')
    .map(function (line) { return line.trim() })
    .join('\n')
    .trim()
}

function metaDescription (meta) {
  if (!meta) return null
  for (const prop of meta.properties) {
    if (prop.key.value === 'description' && prop.value) {
      if (prop.value.type === 'String') return prop.value.value
      if (prop.value.type === 'Chevron') return chevronPlainText(prop.value)
    }
  }
  return null
}

/** KRL meta.version, or deprecated ruleset{version}; default "draft" per rulesets.md. */
function metaRidVersion (meta, ast) {
  if (meta) {
    for (const prop of meta.properties) {
      if (prop.key.value === 'version' && prop.value && prop.value.type === 'String') {
        return prop.value.value
      }
    }
  }
  if (ast.version && ast.version.type === 'String') {
    return ast.version.value
  }
  return 'draft'
}

function docAttrs (doc) {
  if (!doc || !doc.tags) return []
  return doc.tags
    .filter(function (t) { return t.kind === 'attr' })
    .map(function (t) {
      return {
        name: t.name,
        type: t.type || 'Any',
        required: !t.optional,
        description: t.description || undefined
      }
    })
}

function functionParamNames (fnNode) {
  if (!fnNode || fnNode.type !== 'Function' || !fnNode.params) return []
  return fnNode.params.params.map(function (p) { return p.id.value })
}

function docQueryArgs (doc, fnNode, comp) {
  const paramNames = functionParamNames(fnNode)
  const defaults = {}
  if (fnNode.params && fnNode.params.params) {
    for (const p of fnNode.params.params) {
      defaults[p.id.value] = p.default != null
    }
  }
  const byName = {}
  if (doc && doc.tags) {
    for (const t of doc.tags) {
      if (t.kind !== 'param') continue
      if (paramNames.indexOf(t.name) === -1) {
        throw comp.error(doc.loc, '@param ' + t.name + ' is not in the function parameter list')
      }
      byName[t.name] = {
        name: t.name,
        type: t.type || 'Any',
        required: !defaults[t.name],
        description: t.description || undefined
      }
    }
  }
  const args = []
  for (const name of paramNames) {
    const p = byName[name] || {
      name: name,
      type: 'Any',
      required: !defaults[name]
    }
    args.push(p)
  }
  return args
}

function docReturns (doc) {
  if (!doc || !doc.tags) return 'Any'
  const r = doc.tags.find(function (t) { return t.kind === 'returns' })
  return r ? r.type : 'Any'
}

function docRuleExamples (doc) {
  if (!doc || !doc.tags) return []
  return doc.tags
    .filter(function (t) { return t.kind === 'example' })
    .map(function (t) {
      return { name: t.name, attrs: t.data }
    })
}

function docQueryExamples (doc) {
  if (!doc || !doc.tags) return []
  return doc.tags
    .filter(function (t) { return t.kind === 'example' })
    .map(function (t) {
      return { name: t.name, args: t.data }
    })
}

/**
 * Ruleset schema JSON (P1): annotated rules/functions plus derived select/attrs.
 * Returns null when nothing is annotated.
 */
module.exports = function buildRulesetSchema (ast, comp, shares) {
  const operations = []
  const entryIndex = {}
  const sharesSet = new Set(shares.map(function (s) { return s.value }))
  const sharedParams = deriveEmits.sharedFunctionParams(ast.global, sharesSet)
  const globalByName = derive.globalByNameFrom(ast.global)

  for (const rule of ast.rules) {
    if (rule.rule_state !== 'active') continue
    const rawEntries = derive.entriesFromSelect(rule.select)
    for (const e of rawEntries) {
      const key = derive.entryKey(e)
      if (!key) continue
      if (!entryIndex[key]) entryIndex[key] = []
      entryIndex[key].push({
        rule: rule.name.value,
        select: derive.selectText(rule.select),
        condition: derive.conditionText(rule)
      })
    }
  }

  for (const rule of ast.rules) {
    if (!rule.doc) continue
    if (rule.rule_state !== 'active') continue

    const rawEntries = derive.entriesFromSelect(rule.select)
    const entry = rawEntries.map(function (e) {
      if (e.sequence || e.selectWhere) {
        return {
          domain: e.domain,
          name: e.name,
          constraints: e.constraints || [],
          sequence: e.sequence || undefined
        }
      }
      return {
        domain: e.domain,
        name: e.name,
        constraints: e.constraints || []
      }
    })

    const derivedNames = derive.derivedAttrNamesFromRule(rule, ast.global)
    const entryDerived = rawEntries.reduce(function (acc, e) {
      return acc.concat(e.derivedAttrs || [])
    }, [])
    const attrs = derive.mergeAttrs(docAttrs(rule.doc), derivedNames, entryDerived)

    const prechecks = rule.action_block && rule.action_block.condition
      ? deriveEmits.prechecksFromCondition(
        rule.action_block.condition,
        sharesSet,
        rule.prelude,
        sharedParams
      )
      : []

    const examples = docRuleExamples(rule.doc)
    const opOut = {
      rule: rule.name.value,
      description: rule.doc.description,
      entry: entry,
      select: derive.selectText(rule.select),
      condition: derive.conditionText(rule),
      prechecks: prechecks,
      attrs: attrs,
      emits: deriveEmits.deriveEmitsFromRule(rule),
      alsoSelectedBy: []
    }
    if (examples.length) opOut.examples = examples
    operations.push(opOut)
  }

  for (const op of operations) {
    const peerByRule = {}
    for (const ent of op.entry) {
      if (!ent.domain || !ent.name) continue
      const key = ent.domain + ':' + ent.name + ':' + JSON.stringify(ent.constraints || [])
      const peers = (entryIndex[key] || []).filter(function (p) {
        return p.rule !== op.rule
      })
      for (const p of peers) {
        peerByRule[p.rule] = p
      }
    }
    const merged = Object.keys(peerByRule).map(function (k) { return peerByRule[k] })
    if (merged.length) op.alsoSelectedBy = merged
  }

  const queries = []
  for (const share of shares) {
    const name = share.value
    const dec = globalByName[name]
    if (!dec || !dec.doc) continue
    const fn = derive.resolveGlobalFunction(globalByName, name)
    if (!fn) {
      throw comp.error(dec.doc.loc, 'Doc annotation on shared ' + name + ' requires a function')
    }
    const qExamples = docQueryExamples(dec.doc)
    const qOut = {
      name: name,
      description: dec.doc.description,
      args: docQueryArgs(dec.doc, fn, comp),
      returns: docReturns(dec.doc)
    }
    if (qExamples.length) qOut.examples = qExamples
    queries.push(qOut)
  }

  if (operations.length === 0 && queries.length === 0) {
    return null
  }

  return {
    version: 1,
    rid: ast.rid.value,
    rid_version: metaRidVersion(ast.meta, ast),
    description: metaDescription(ast.meta),
    operations: operations,
    queries: queries
  }
}
