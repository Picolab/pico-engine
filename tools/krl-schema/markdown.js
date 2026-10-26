/**
 * Render a ruleset discovery schema (from schemaFromSource) as a human-readable
 * Markdown reference page. Prose comes only from /** *\/ annotations; everything
 * else is derived from the code and shown as code, never paraphrased.
 * @see docs/design/pico-schemas.md
 */

'use strict'

const BRANCH_TEXT = {
  fired: 'when it acts',
  else: "when it doesn't act",
  notfired: "when it doesn't act",
  always: 'always',
  finally: 'always, afterwards',
  action: 'when it acts'
}

function code (s) {
  const str = String(s)
  const ticks = str.includes('`') ? '``' : '`'
  const pad = ticks === '``' ? ' ' : ''
  return ticks + pad + str + pad + ticks
}

function cell (s) {
  return s == null || s === '' ? '' : String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ')
}

function anchor (s) {
  // GitHub's heading anchors: lowercase, drop punctuation, each space becomes a hyphen (not collapsed)
  return String(s).toLowerCase().replace(/[^a-z0-9_ -]/g, '').trim().replace(/ /g, '-')
}

function eventName (e) {
  return e.domain + ':' + e.name
}

function constraintText (c, optionalAttrs) {
  if (c == null) return ''
  const ifGiven = c.attr && optionalAttrs && optionalAttrs[c.attr] ? ' (if given)' : ''
  if (typeof c === 'string') return c
  if (c.op === 'const' || c.const !== undefined) {
    return code(c.attr) + ' = ' + code(JSON.stringify(c.op === 'const' ? c.value : c.const))
  }
  if (c.op === 'pattern' || c.pattern !== undefined) {
    return code(c.attr) + ifGiven + ' matches ' + code('re#' + c.pattern + '#')
  }
  if (c.source !== undefined) return code(c.source)
  return code(JSON.stringify(c))
}

function entryText (e, optionalAttrs) {
  const cs = (e.constraints || []).map(c => constraintText(c, optionalAttrs)).filter(Boolean)
  return code(eventName(e)) + (cs.length ? ' with ' + cs.join(' and ') : '')
}

function whenText (when, opCondition) {
  const parts = []
  for (const w of when || []) {
    if (w.condition !== undefined) {
      if (w.condition !== opCondition) parts.push('if ' + code(w.condition))
    } else if (w.branch !== undefined) {
      parts.push(BRANCH_TEXT[w.branch] || w.branch)
    } else if (w.if !== undefined) {
      parts.push('if ' + code(w.if))
    } else if (w.choose !== undefined) {
      parts.push('when ' + code(w.choose) + ' is ' + code(w.key))
    } else if (w.sample) {
      parts.push('one chosen at random')
    } else if (w.foreach !== undefined) {
      parts.push('for each of ' + code(w.foreach))
    } else if (w.onFinal) {
      parts.push('after the last iteration')
    } else if (w.every) {
      // every: all actions run; adds nothing for a reader
    } else {
      parts.push(code(JSON.stringify(w)))
    }
  }
  return parts.join(', ')
}

function emitText (e, opCondition) {
  const ev = e.domain && e.type ? code(e.domain + ':' + e.type) : code(e.source || e.name || '?')
  let verb
  if (e.via === 'send') {
    verb = 'sends ' + ev
    if (e.replyTo) verb += ' to the ' + code(e.replyTo) + ' you supplied'
    else if (e.target) verb += ' to ' + code(e.target)
  } else if (e.via === 'schedule') {
    verb = 'schedules ' + ev + ' on this pico'
  } else if (e.via === 'action') {
    verb = 'calls module action ' + ev
  } else {
    verb = 'raises ' + ev + ' on this pico'
  }
  const when = whenText(e.when, opCondition)
  return verb + (when ? ' — ' + when : '')
}

function precheckText (p) {
  if (p.call) return code(p.call)
  const args = Object.entries(p.args || {}).map(([k, v]) =>
    k + ': ' + (v && v.attr ? 'attr ' + v.attr : JSON.stringify(v)))
  return code(p.fn + '(' + Object.keys(p.args || {}).join(', ') + ')') +
    (args.length ? ' (' + args.join('; ') + ')' : '')
}

function paramSig (args) {
  return (args || []).map(a => a.required ? a.name : a.name + '?').join(', ')
}

function opTitle (op, dup) {
  const t = (op.entry || []).map(e => code(eventName(e))).join(' · ') || code(op.rule)
  return dup ? t + ' (' + op.rule + ')' : t
}

function opAnchorTitle (op, dup) {
  const t = (op.entry || []).map(eventName).join(' · ') || op.rule
  return dup ? t + ' (' + op.rule + ')' : t
}

function renderOperation (op, rid, dup) {
  const out = []
  out.push('### ' + opTitle(op, dup), '')
  if (op.description) out.push(op.description, '')

  const optionalAttrs = {}
  for (const a of op.attrs || []) if (!a.required) optionalAttrs[a.name] = true
  out.push('**Send:** ' + (op.entry || []).map(e => entryText(e, optionalAttrs)).join(', or ') + '  ')
  out.push('**Rule:** ' + code(op.rule), '')

  if (op.attrs && op.attrs.length) {
    out.push('| Attribute | Type | Required | Description |')
    out.push('|-----------|------|----------|-------------|')
    for (const a of op.attrs) {
      out.push('| ' + code(a.name) + ' | ' + cell(a.type) + ' | ' + (a.required ? 'yes' : 'no') +
        ' | ' + cell(a.description) + ' |')
    }
    out.push('')
    if (op.examples && op.examples.length) {
      out.push('**Examples:**', '')
      for (const ex of op.examples) {
        out.push('- **' + ex.name + ':** `' + JSON.stringify(ex.attrs) + '`')
      }
      out.push('')
    }
  } else {
    out.push('No attributes.', '')
  }

  out.push(op.condition
    ? '**Acts when:** ' + code(op.condition)
    : '**Acts when:** always, once selected')
  if (op.prechecks && op.prechecks.length) {
    out.push('', '**Check first:** ' + op.prechecks.map(precheckText).join(', '))
  }
  out.push('')

  if (op.emits && op.emits.length) {
    out.push('**May emit** (possible, not guaranteed):', '')
    // Show events, plus calls into other modules. Engine actions (ctx:*) and this
    // ruleset's own defactions are implementation, not something a reader awaits.
    const shown = op.emits.filter(e => {
      if (e.via !== 'action') return true
      const n = e.name || e.source || ''
      return n.includes(':') && !/^ctx:/.test(n)
    })
    for (const e of shown) {
      out.push('- ' + emitText(e, op.condition))
    }
    out.push('')
  }

  if (op.alsoSelectedBy && op.alsoSelectedBy.length) {
    out.push('**Other rules on the same event:**', '')
    for (const r of op.alsoSelectedBy) {
      const sel = (r.select || '').replace(/\s+/g, ' ').replace(/^select when /, '')
      const gate = r.condition ? ' — acts when ' + code(r.condition)
        : /\bwhere\b|re#/.test(sel) ? ' — selects only ' + code(sel)
          : ''
      out.push('- ' + code(r.rule) + gate)
    }
    out.push('')
  }

  out.push('<details><summary>Select expression</summary>', '', '```krl', op.select || '', '```', '', '</details>', '')
  return out.join('\n')
}

function renderQuery (q, rid) {
  const out = []
  out.push('### ' + code(q.name + '(' + paramSig(q.args) + ')') + (q.returns ? ' → ' + q.returns : ''), '')
  if (q.description) out.push(q.description, '')
  if (q.args && q.args.length) {
    out.push('| Parameter | Type | Required | Default | Description |')
    out.push('|-----------|------|----------|---------|-------------|')
    for (const a of q.args) {
      const dflt = a.default !== undefined ? code(JSON.stringify(a.default))
        : a.defaultExpr !== undefined ? code(a.defaultExpr) : ''
      out.push('| ' + code(a.name) + ' | ' + cell(a.type) + ' | ' + (a.required ? 'yes' : 'no') +
        ' | ' + dflt + ' | ' + cell(a.description) + ' |')
    }
    out.push('')
    if (q.examples && q.examples.length) {
      out.push('**Examples:**', '')
      for (const ex of q.examples) {
        out.push('- **' + ex.name + ':** `' + JSON.stringify(ex.args) + '`')
      }
      out.push('')
    }
  }
  const qs = (q.args || []).map(a => a.name + '=…').join('&')
  out.push('**Call:** ' + code('GET /sky/query/<eci>/' + rid + '/' + q.name + (qs ? '?' + qs : '')) +
    ', or ' + code('<alias>:' + q.name + '(' + paramSig(q.args) + ')') + ' from KRL with ' +
    code('use module ' + rid + ' alias <alias>'), '')
  return out.join('\n')
}

function renderMarkdown (schema, opts) {
  opts = opts || {}
  const rid = schema.rid
  const ops = schema.operations || []
  const qs = schema.queries || []
  const out = []
  out.push('# ' + rid, '')
  if (schema.description) {
    // Keep the author's line breaks (usage lines, lists) as Markdown hard breaks;
    // blank lines stay paragraph breaks.
    const paras = String(schema.description).split(/\n\s*\n/)
    out.push(paras.map(p => p.split('\n').map(l => l.trim()).filter(Boolean).join('  \n')).join('\n\n'), '')
  }
  out.push('*Version ' + (schema.rid_version || 'draft') + '. Generated from the ruleset\'s annotations by ' +
    code('krl-schema --format markdown') + '; edit the `/** */` comments in the source, not this page. ' +
    'Only annotated rules and shared functions appear.*', '')

  // Operations that share entry events get the rule name in their heading.
  const titleCount = {}
  for (const o of ops) {
    const k = opAnchorTitle(o, false)
    titleCount[k] = (titleCount[k] || 0) + 1
  }
  const isDup = o => titleCount[opAnchorTitle(o, false)] > 1
  if (ops.length) {
    out.push('**Operations:** ' + ops.map(o => {
      const label = ((o.entry || []).map(eventName)[0] || o.rule) + (isDup(o) ? ' (' + o.rule + ')' : '')
      return '[' + label + '](#' + anchor(opAnchorTitle(o, isDup(o))) + ')'
    }).join(' · ') + '  ')
  }
  if (qs.length) {
    out.push('**Queries:** ' + qs.map(q => '[' + q.name + '](#' + anchor(q.name + '(' + paramSig(q.args) + ')' + (q.returns ? ' → ' + q.returns : '')) + ')').join(' · '))
  }
  out.push('')

  if (ops.length) {
    out.push('## Operations', '', 'Events you can send to a pico with this ruleset installed. ' +
      'Whether an operation acts, and what it emits, depends on its condition and the pico\'s state when the event arrives.', '')
    for (const o of ops) out.push(renderOperation(o, rid, isDup(o)))
  }
  if (qs.length) {
    out.push('## Queries', '')
    for (const q of qs) out.push(renderQuery(q, rid))
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n'
}

module.exports = { renderMarkdown }
