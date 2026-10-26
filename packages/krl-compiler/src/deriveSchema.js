var krlGenerator = require('krl-generator')

function gen (ast) {
  if (!ast) return ''
  return krlGenerator(ast).trim()
}

function literalString (expr) {
  if (!expr) return null
  if (expr.type === 'String') return expr.value
  return null
}

function constraintsFromWhere (expr) {
  const out = []
  if (!expr) return out
  if (expr.type === 'InfixOperator' && expr.op === '&&') {
    return constraintsFromWhere(expr.left).concat(constraintsFromWhere(expr.right))
  }
  if (expr.type === 'InfixOperator' && expr.op === '==') {
    const attr = eventAttrName(expr.left)
    const lit = literalString(expr.right)
    if (attr && lit != null) {
      out.push({ attr: attr, op: 'const', value: lit })
    }
  }
  return out
}

function eventAttrName (expr) {
  if (expr.type !== 'Application') return null
  const callee = expr.callee
  if (callee.type !== 'DomainIdentifier') return null
  if (callee.domain !== 'event' || callee.value !== 'attr') return null
  if (!expr.args || !expr.args.args || !expr.args.args[0]) return null
  const arg0 = expr.args.args[0]
  if (arg0.type === 'String') return arg0.value
  return null
}

function isEventAttrsExpr (expr) {
  if (!expr || expr.type !== 'DomainIdentifier') return false
  return expr.domain === 'event' && expr.value === 'attrs'
}

function eventAttrsMemberName (expr) {
  if (!expr || expr.type !== 'MemberExpression') return null
  if (!isEventAttrsExpr(expr.object)) return null
  const p = expr.property
  if (p && p.type === 'String') return p.value
  return null
}

function globalByNameFrom (global) {
  const map = {}
  for (const dec of global || []) {
    if (dec.left && dec.left.type === 'Identifier') {
      map[dec.left.value] = dec
    }
  }
  return map
}

function resolveGlobalFunction (globalByName, name) {
  const seen = {}
  let cur = name
  while (cur && !seen[cur]) {
    seen[cur] = true
    const dec = globalByName[cur]
    if (!dec || !dec.right) return null
    if (dec.right.type === 'Function') return dec.right
    if (dec.right.type === 'Identifier') {
      cur = dec.right.value
      continue
    }
    return null
  }
  return null
}

function derivedAttrNamesFromRule (rule, global) {
  const names = {}
  const globalByName = globalByNameFrom(global)
  const callStack = {}

  function recordAttrReads (node) {
    if (!node || typeof node !== 'object') return
    if (node.type === 'Application') {
      const n = eventAttrName(node)
      if (n) names[n] = true
    }
    if (node.type === 'MemberExpression') {
      const n = eventAttrsMemberName(node)
      if (n) names[n] = true
    }
  }

  function walkWithGlobalCalls (node, inGlobalFn) {
    if (!node || typeof node !== 'object') return
    recordAttrReads(node)
    if (node.type === 'RuleForEach' && node.expression) {
      recordAttrReads(node.expression)
      walkWithGlobalCalls(node.expression, inGlobalFn)
    }
    if (!inGlobalFn && node.type === 'Application' &&
      node.callee && node.callee.type === 'Identifier') {
      const fnName = node.callee.value
      if (globalByName[fnName] && !callStack[fnName]) {
        callStack[fnName] = true
        const fn = resolveGlobalFunction(globalByName, fnName)
        if (fn) walkWithGlobalCalls(fn, true)
        delete callStack[fnName]
      }
    }
    for (const key of Object.keys(node)) {
      if (key === 'loc') continue
      const val = node[key]
      if (Array.isArray(val)) {
        val.forEach(function (child) { walkWithGlobalCalls(child, inGlobalFn) })
      } else if (val && typeof val === 'object') {
        walkWithGlobalCalls(val, inGlobalFn)
      }
    }
  }

  walkWithGlobalCalls(rule.prelude, false)
  for (const fe of rule.foreach || []) {
    walkWithGlobalCalls(fe, false)
  }
  if (rule.action_block) walkWithGlobalCalls(rule.action_block, false)
  if (rule.postlude) walkWithGlobalCalls(rule.postlude, false)
  return Object.keys(names)
}

function entryFromEventExpression (event) {
  if (!event || !event.type) return []
  if (event.type === 'EventExpression') {
    const constraints = constraintsFromWhere(event.where)
    const attrs = []
    for (const a of event.event_attrs || []) {
      const attr = {
        name: a.key.value,
        type: 'Any',
        required: true,
        fromSelect: true
      }
      if (a.value && a.value.type === 'RegExp' && a.value.value) {
        const pattern = String(a.value.value.source || a.value.value)
        attr.pattern = pattern
        constraints.push({ attr: a.key.value, op: 'pattern', pattern: pattern })
      }
      attrs.push(attr)
    }
    return [{
      domain: event.event_domain.value,
      name: event.event_type.value,
      constraints: constraints,
      derivedAttrs: attrs
    }]
  }
  if (event.type === 'EventOperator') {
    if (event.op === 'or') {
      return event.args.flatMap(function (arg) {
        return entryFromEventExpression(arg)
      })
    }
    return [{
      domain: null,
      name: null,
      constraints: [],
      sequence: { op: event.op, text: gen(event) }
    }]
  }
  if (event.type === 'EventGroupOperator') {
    return [{
      domain: null,
      name: null,
      constraints: [],
      sequence: { op: event.op, text: gen(event) }
    }]
  }
  return []
}

function entriesFromSelect (select) {
  if (!select) return []
  if (select.kind === 'where') {
    return [{ domain: null, name: null, constraints: [], selectWhere: true }]
  }
  return entryFromEventExpression(select.event)
}

function selectText (select) {
  if (!select) return null
  return gen(select)
}

function conditionText (rule) {
  if (!rule.action_block || !rule.action_block.condition) return null
  return gen(rule.action_block.condition)
}

function mergeAttrs (docAttrs, derivedNames, entryDerived) {
  const byName = {}
  for (const a of docAttrs) {
    byName[a.name] = Object.assign({}, a)
  }
  for (const a of entryDerived || []) {
    if (!byName[a.name]) {
      byName[a.name] = {
        name: a.name,
        type: 'Any',
        required: !!a.required,
        description: undefined
      }
      if (a.pattern) byName[a.name].pattern = a.pattern
    }
  }
  for (const name of derivedNames) {
    if (!byName[name]) {
      byName[name] = {
        name: name,
        type: 'Any',
        required: false
      }
    }
  }
  return Object.values(byName)
}

function entryKey (entry) {
  if (!entry.domain || !entry.name) return null
  const c = JSON.stringify(entry.constraints || [])
  return entry.domain + ':' + entry.name + ':' + c
}

module.exports = {
  selectText,
  conditionText,
  entriesFromSelect,
  derivedAttrNamesFromRule,
  mergeAttrs,
  entryKey,
  gen,
  globalByNameFrom,
  resolveGlobalFunction,
  isEventAttrsExpr
}
