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

function calleeLabel (callee) {
  if (callee.type === 'Identifier') return callee.value
  if (callee.type === 'DomainIdentifier') {
    return callee.domain + ':' + callee.value
  }
  return null
}

function replyToFromExpr (expr) {
  if (!expr) return null
  if (expr.type === 'Application') {
    const cal = expr.callee
    if (cal.type === 'DomainIdentifier' && cal.domain === 'event' && cal.value === 'attr') {
      const a0 = expr.args && expr.args.args && expr.args.args[0]
      if (a0 && a0.type === 'String') return a0.value
    }
  }
  return null
}

function mapGetString (mapNode, key) {
  if (!mapNode || mapNode.type !== 'Map') return null
  for (const pair of mapNode.value) {
    if (pair.key.value === key) {
      if (pair.value.type === 'String') return pair.value.value
      return derive.gen(pair.value)
    }
  }
  return null
}

function mapGetExpr (mapNode, key) {
  if (!mapNode || mapNode.type !== 'Map') return null
  for (const pair of mapNode.value) {
    if (pair.key.value === key) return pair.value
  }
  return null
}

function raiseDomainType (stmt) {
  if (stmt.event_domain && stmt.event_type) {
    const domain = stmt.event_domain.value
    let type = null
    let typeExpr = null
    if (stmt.event_type.type === 'String') type = stmt.event_type.value
    else typeExpr = derive.gen(stmt.event_type)
    return { domain, type, typeExpr }
  }
  if (stmt.event_domainAndType) {
    return {
      domain: null,
      type: null,
      typeExpr: derive.gen(stmt.event_domainAndType)
    }
  }
  return { domain: null, type: null, typeExpr: null }
}

function emitRaise (stmt, when) {
  const dt = raiseDomainType(stmt)
  const entry = {
    via: 'raise',
    domain: dt.domain,
    type: dt.type,
    when: when
  }
  if (dt.typeExpr) entry.typeExpr = dt.typeExpr
  return entry
}

function emitSchedule (stmt, when) {
  const dt = raiseDomainType(stmt)
  const entry = {
    via: 'schedule',
    domain: dt.domain,
    type: dt.type,
    when: when
  }
  if (dt.typeExpr) entry.typeExpr = dt.typeExpr
  return entry
}

function emitSendFromAction (action, when) {
  if (action.type !== 'Action') return null
  const label = calleeLabel(action.action)
  if (label === 'event:send') {
    const arg0 = action.args && action.args.args && action.args.args[0]
    const domain = mapGetString(arg0, 'domain')
    const type = mapGetString(arg0, 'type')
    const eciExpr = mapGetExpr(arg0, 'eci')
    const target = eciExpr ? derive.gen(eciExpr) : null
    const replyTo = replyToFromExpr(eciExpr)
    return {
      via: 'send',
      domain: typeof domain === 'string' ? domain : null,
      type: typeof type === 'string' ? type : null,
      target: target,
      replyTo: replyTo || undefined,
      when: when
    }
  }
  if (label === 'send_directive' || label === 'noop') {
    return null
  }
  if (label && label.indexOf(':') !== -1) {
    return { via: 'action', name: label, when: when }
  }
  if (action.action.type === 'Identifier') {
    return { via: 'action', name: label, when: when }
  }
  return null
}

function walkPostludeStmts (stmts, when, out) {
  if (!stmts) return
  for (const stmt of stmts) {
    if (stmt.type === 'GuardCondition') {
      const w = when.slice()
      if (stmt.condition === 'on final') w.push({ onFinal: true })
      else w.push({ if: derive.gen(stmt.condition) })
      walkPostludeStmts([stmt.statement], w, out)
      continue
    }
    if (stmt.type === 'RaiseEventStatement') {
      out.push(emitRaise(stmt, when))
      continue
    }
    if (stmt.type === 'ScheduleEventStatement') {
      out.push(emitSchedule(stmt, when))
      continue
    }
    if (stmt.type === 'Declaration') {
      walk(stmt, function (n) {
        if (n.type === 'RaiseEventStatement') out.push(emitRaise(n, when))
        if (n.type === 'ScheduleEventStatement') out.push(emitSchedule(n, when))
      })
    }
  }
}

function actionBlockWhen (actionBlock, prefix) {
  const when = prefix.slice()
  if (!actionBlock) return when
  if (actionBlock.block_type === 'every') when.push({ every: true })
  else if (actionBlock.block_type === 'sample') when.push({ sample: true })
  else if (actionBlock.block_type === 'choose' && actionBlock.discriminant) {
    when.push({ choose: derive.gen(actionBlock.discriminant) })
  }
  return when
}

function deriveEmitsFromRule (rule) {
  const out = []
  const prefix = []
  if (rule.action_block && rule.action_block.condition) {
    prefix.push({ condition: derive.gen(rule.action_block.condition) })
  }

  if (rule.action_block && rule.action_block.actions) {
    const ab = rule.action_block
    if (ab.block_type === 'choose') {
      for (const act of ab.actions) {
        const w = prefix.slice()
        w.push({ every: true })
        if (act.label) w.push({ key: act.label.value })
        const em = emitSendFromAction(act, w)
        if (em) out.push(em)
      }
    } else {
      const w = actionBlockWhen(ab, prefix)
      for (const act of ab.actions) {
        const em = emitSendFromAction(act, w)
        if (em) out.push(em)
      }
    }
  }

  if (rule.postlude) {
    if (rule.postlude.fired) {
      walkPostludeStmts(rule.postlude.fired, prefix.concat([{ branch: 'fired' }]), out)
    }
    if (rule.postlude.notfired) {
      walkPostludeStmts(rule.postlude.notfired, prefix.concat([{ branch: 'notfired' }]), out)
    }
    if (rule.postlude.always) {
      walkPostludeStmts(rule.postlude.always, prefix.concat([{ branch: 'always' }]), out)
    }
  }

  return out
}

function sharedFunctionParams (global, sharesSet) {
  const globalByName = derive.globalByNameFrom(global)
  const map = {}
  for (const dec of global || []) {
    const name = dec.left && dec.left.value
    if (!name || !sharesSet.has(name)) continue
    const fn = derive.resolveGlobalFunction(globalByName, name)
    if (fn && fn.params) {
      map[name] = fn.params.params.map(function (p) { return p.id.value })
    } else {
      map[name] = []
    }
  }
  return map
}

function buildPreBindings (prelude) {
  const bindings = {}
  for (const dec of prelude || []) {
    if (dec.type !== 'Declaration') continue
    if (dec.left && dec.left.type === 'Identifier') {
      bindings[dec.left.value] = dec.right
    }
  }
  return bindings
}

function traceToEventAttr (expr, preBindings, depth) {
  if (!expr) return null
  if (depth === undefined) depth = 0
  if (depth > 12) return null
  const direct = replyToFromExpr(expr)
  if (direct) return { attr: direct }
  if (expr.type === 'Identifier' && preBindings[expr.value]) {
    return traceToEventAttr(preBindings[expr.value], preBindings, depth + 1)
  }
  return null
}

function precheckEntryFromCall (app, paramNames, preBindings) {
  const fn = app.callee.value
  const argExprs = (app.args && app.args.args) || []
  if (argExprs.length === 0) {
    return { fn: fn, args: {} }
  }
  const argsObj = {}
  let allTraceable = true
  for (let i = 0; i < argExprs.length; i++) {
    const param = paramNames[i] || String(i)
    const traced = traceToEventAttr(argExprs[i], preBindings)
    if (traced) argsObj[param] = traced
    else allTraceable = false
  }
  if (allTraceable && Object.keys(argsObj).length === argExprs.length) {
    return { fn: fn, args: argsObj }
  }
  return { fn: fn, call: derive.gen(app) }
}

function collectBooleanTerms (expr) {
  if (!expr) return []
  if (expr.type === 'InfixOperator' && (expr.op === '&&' || expr.op === '||')) {
    return collectBooleanTerms(expr.left).concat(collectBooleanTerms(expr.right))
  }
  if (expr.type === 'UnaryOperator' && expr.op === '!') {
    return collectBooleanTerms(expr.argument)
  }
  return [expr]
}

function sharedPrecheckCallInTerm (term, sharesSet) {
  if (!term) return null
  if (term.type === 'Application' &&
    term.callee && term.callee.type === 'Identifier' &&
    sharesSet.has(term.callee.value)) {
    return term
  }
  return null
}

function prechecksFromCondition (expr, sharesSet, prelude, sharedParams) {
  if (!expr) return []
  const preBindings = buildPreBindings(prelude)
  const found = []
  const seen = {}
  for (const term of collectBooleanTerms(expr)) {
    const node = sharedPrecheckCallInTerm(term, sharesSet)
    if (!node) continue
    const fn = node.callee.value
    if (seen[fn]) continue
    seen[fn] = true
    const paramNames = sharedParams[fn] || []
    found.push(precheckEntryFromCall(node, paramNames, preBindings))
  }
  return found
}

module.exports = {
  deriveEmitsFromRule,
  prechecksFromCondition,
  sharedFunctionParams
}
