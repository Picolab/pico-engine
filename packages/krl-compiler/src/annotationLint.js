var derive = require('./deriveSchema')

function walk (node, visit) {
  if (!node || typeof node !== 'object') return
  visit(node)
  for (const key of Object.keys(node)) {
    if (key === 'loc') continue
    const val = node[key]
    if (Array.isArray(val)) val.forEach(function (c) { walk(c, visit) })
    else if (val && typeof val === 'object') walk(val, visit)
  }
}

function settingAttrName (expr) {
  if (!expr || expr.type !== 'Application') return null
  const cal = expr.callee
  if (cal.type !== 'DomainIdentifier') return null
  if (cal.domain !== 'setting' || cal.value !== 'attr') return null
  const a0 = expr.args && expr.args.args && expr.args.args[0]
  if (a0 && a0.type === 'String') return a0.value
  return null
}

var isEventAttrsExpr = derive.isEventAttrsExpr

function ruleUsesWholeEventAttrs (rule) {
  var uses = false
  walk(rule, function (node) {
    if (uses) return
    if (node.type === 'Declaration' && isEventAttrsExpr(node.right)) {
      uses = true
    }
    if (node.type === 'RaiseEventStatement' && node.event_attrs) {
      if (isEventAttrsExpr(node.event_attrs)) uses = true
    }
    if (node.type === 'ScheduleEventStatement' && node.event_attrs) {
      if (isEventAttrsExpr(node.event_attrs)) uses = true
    }
    if (node.type === 'Action' && node.action) {
      const label = node.action.type === 'DomainIdentifier'
        ? node.action.domain + ':' + node.action.value
        : null
      if (label === 'event:send' && node.args && node.args.args && node.args.args[0]) {
        walk(node.args.args[0], function (pair) {
          if (pair.type === 'MapKeyValuePair' &&
            pair.key && pair.key.value === 'attributes' &&
            isEventAttrsExpr(pair.value)) {
            uses = true
          }
        })
      }
    }
  })
  return uses
}

function attrNamesUsedByRule (rule, global) {
  const names = {}
  for (const n of derive.derivedAttrNamesFromRule(rule, global)) {
    names[n] = true
  }
  walk(rule, function (node) {
    const s = settingAttrName(node)
    if (s) names[s] = true
  })
  for (const e of derive.entriesFromSelect(rule.select)) {
    for (const a of e.derivedAttrs || []) {
      names[a.name] = true
    }
  }
  return names
}

function ruleByName (ast, name) {
  for (const rule of ast.rules || []) {
    if (rule.name && rule.name.value === name) return rule
  }
  return null
}

function lintUnusedDocAttrs (ast, operations, warn) {
  for (const op of operations) {
    const rule = ruleByName(ast, op.rule)
    if (!rule || !rule.doc) continue
    const used = attrNamesUsedByRule(rule, ast.global)
    var skipUnused = ruleUsesWholeEventAttrs(rule)
    for (const peer of op.alsoSelectedBy || []) {
      const peerRule = ruleByName(ast, peer.rule)
      if (!peerRule) continue
      const peerUsed = attrNamesUsedByRule(peerRule, ast.global)
      for (const name of Object.keys(peerUsed)) {
        used[name] = true
      }
      if (ruleUsesWholeEventAttrs(peerRule)) skipUnused = true
    }
    for (const tag of rule.doc.tags || []) {
      if (tag.kind !== 'attr') continue
      if (skipUnused) continue
      if (!used[tag.name]) {
        warn(rule.doc.loc, '@attr ' + tag.name + ' is not read in rule ' + op.rule)
      }
    }
  }
}

function metaNameSet (ast, key) {
  const set = {}
  if (!ast.meta) return set
  for (const prop of ast.meta.properties) {
    if (prop.key.value !== key) continue
    if (!prop.value || !prop.value.ids) continue
    for (const id of prop.value.ids) {
      set[id.value] = true
    }
  }
  return set
}

function lintAnnotatedFunctionsNotShared (ast, warn) {
  const shares = metaNameSet(ast, 'shares')
  const provides = metaNameSet(ast, 'provides')
  for (const dec of ast.global || []) {
    if (!dec.doc) continue
    if (!dec.left || dec.left.type !== 'Identifier') continue
    const name = dec.left.value
    if (dec.right && dec.right.type !== 'Function') continue
    if (shares[name] || provides[name]) continue
    warn(
      dec.doc.loc,
      'Annotated function ' + name + ' is not listed in meta shares or provides'
    )
  }
}

function lintExampleKeys (ast, rulesetSchema, warn) {
  if (!rulesetSchema) return
  for (const op of rulesetSchema.operations || []) {
    const rule = ruleByName(ast, op.rule)
    if (!rule || !rule.doc) continue
    const allowed = {}
    for (const a of op.attrs || []) allowed[a.name] = true
    for (const tag of rule.doc.tags || []) {
      if (tag.kind !== 'example') continue
      for (const key of Object.keys(tag.data || {})) {
        if (!allowed[key]) {
          warn(
            rule.doc.loc,
            '@example "' + tag.name + '" key ' + key + ' is not an attribute of rule ' + op.rule
          )
        }
      }
    }
  }
  for (const q of rulesetSchema.queries || []) {
    const dec = (ast.global || []).find(function (d) {
      return d.left && d.left.value === q.name
    })
    if (!dec || !dec.doc) continue
    const allowed = {}
    for (const a of q.args || []) allowed[a.name] = true
    for (const tag of dec.doc.tags || []) {
      if (tag.kind !== 'example') continue
      for (const key of Object.keys(tag.data || {})) {
        if (!allowed[key]) {
          warn(
            dec.doc.loc,
            '@example "' + tag.name + '" key ' + key + ' is not a parameter of ' + q.name
          )
        }
      }
    }
  }
}

function lintSameRulesetAttrTypeConflicts (operations, warn, ast) {
  const byEntry = {}
  for (const op of operations) {
    for (const ent of op.entry) {
      const key = derive.entryKey(ent)
      if (!key) continue
      if (!byEntry[key]) byEntry[key] = []
      byEntry[key].push({ rule: op.rule, attrs: op.attrs })
    }
  }
  for (const key of Object.keys(byEntry)) {
    const sources = byEntry[key]
    if (sources.length < 2) continue
    const typesByAttr = {}
    for (const src of sources) {
      for (const a of src.attrs) {
        if (!typesByAttr[a.name]) typesByAttr[a.name] = {}
        typesByAttr[a.name][src.rule] = a.type || 'Any'
      }
    }
    for (const attrName of Object.keys(typesByAttr)) {
      const byRule = typesByAttr[attrName]
      const types = {}
      for (const ruleName of Object.keys(byRule)) {
        types[byRule[ruleName]] = true
      }
      if (Object.keys(types).length > 1) {
        const rule = ruleByName(ast, sources[0].rule)
        const loc = rule && rule.doc ? rule.doc.loc : (rule && rule.loc)
        warn(loc, 'Conflicting @attr types for "' + attrName + '" on entry ' + key +
          ' across rules in this ruleset')
      }
    }
  }
}

function lintUnknownDocTags (ast, warn) {
  function checkDoc (doc) {
    if (!doc || !doc.unknownTags) return
    for (const u of doc.unknownTags) {
      warn(doc.loc, 'Unknown doc tag @' + u.name + ' (ignored)')
    }
  }
  for (const rule of ast.rules || []) {
    checkDoc(rule.doc)
  }
  for (const dec of ast.global || []) {
    checkDoc(dec.doc)
  }
}

module.exports = function lintAnnotations (ast, comp, rulesetSchema) {
  if (!ast || ast.type !== 'Ruleset') return
  lintUnknownDocTags(ast, comp.warn)
  lintAnnotatedFunctionsNotShared(ast, comp.warn)
  if (!rulesetSchema || !rulesetSchema.operations) return
  lintUnusedDocAttrs(ast, rulesetSchema.operations, comp.warn)
  lintExampleKeys(ast, rulesetSchema, comp.warn)
  lintSameRulesetAttrTypeConflicts(rulesetSchema.operations, comp.warn, ast)
}
