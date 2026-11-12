'use strict'

var { XMLValidator } = require('fast-xml-parser')
var xmluiBuiltins = require('./xmluiBuiltins')

var FORBIDDEN_INTERP_DOMAINS = {
  ent: 'entity state (ent:)',
  pds: 'PDS (pds:)',
  application: 'application (application:)',
  ctx: 'engine context (ctx:)'
}

/**
 * Replace #{ ... } beestings with placeholders so XML validation ignores KRL expressions.
 * Handles nested braces inside #{ ... }.
 */
function stripBeestingsToPlaceholders (src) {
  var out = ''
  var i = 0
  while (i < src.length) {
    if (src[i] === '#' && i + 1 < src.length && src[i + 1] === '{') {
      var start = i
      i += 2
      var depth = 1
      while (i < src.length && depth > 0) {
        var c = src[i]
        if (c === '{') depth++
        else if (c === '}') depth--
        i++
      }
      out += '___KRL_BEESTING___'
      if (depth !== 0) {
        return { text: out + src.slice(start), error: 'unclosed #{ ... } in view markup' }
      }
      continue
    }
    out += src[i]
    i++
  }
  return { text: out, error: null }
}

function chevronToXmlFragment (chev) {
  if (!chev || chev.type !== 'Chevron' || !Array.isArray(chev.value)) return ''
  var parts = []
  for (var j = 0; j < chev.value.length; j++) {
    var part = chev.value[j]
    if (part.type === 'String') {
      parts.push(part.value)
    } else {
      parts.push('#{ … }')
    }
  }
  return parts.join('')
}

function describeForbiddenDomain (domain) {
  return FORBIDDEN_INTERP_DOMAINS[domain] || domain + ':' + ' namespace'
}

function warnOnInterpolatedExpr (expr, warn, fallbackLoc, inBeesting) {
  if (!expr || !inBeesting) return

  if (expr.type === 'DomainIdentifier') {
    if (FORBIDDEN_INTERP_DOMAINS[expr.domain]) {
      warn(expr.loc || fallbackLoc,
        'view markup: interpolating ' + describeForbiddenDomain(expr.domain) +
          ' exposes data in open /ui/ files; use ui:query / constants only')
    }
    return
  }

  if (expr.type === 'MemberExpression') {
    var mobj = expr.object
    if (mobj && mobj.type === 'Identifier' && mobj.value === 'event') {
      warn(expr.loc || fallbackLoc,
        'view markup: #{ event:… } may expose event attributes in open /ui/ files; bind through ui:query instead')
    }
    warnOnInterpolatedExpr(expr.object, warn, fallbackLoc, true)
    warnOnInterpolatedExpr(expr.property, warn, fallbackLoc, true)
    return
  }

  if (expr.type === 'Application' && expr.callee) {
    warnOnInterpolatedExpr(expr.callee, warn, fallbackLoc, true)
    if (expr.args && expr.args.args) {
      for (var i = 0; i < expr.args.args.length; i++) {
        warnOnInterpolatedExpr(expr.args.args[i], warn, fallbackLoc, true)
      }
    }
    return
  }

  if (expr.type === 'UnaryOperator' && expr.argument) {
    warnOnInterpolatedExpr(expr.argument, warn, fallbackLoc, true)
    return
  }

  if (expr.type === 'ConditionalExpression') {
    warnOnInterpolatedExpr(expr.test, warn, fallbackLoc, true)
    warnOnInterpolatedExpr(expr.consequent, warn, fallbackLoc, true)
    warnOnInterpolatedExpr(expr.alternate, warn, fallbackLoc, true)
  }
}

function lintChevronInterpolations (chev, warn) {
  if (!chev || chev.type !== 'Chevron' || !Array.isArray(chev.value)) return
  for (var j = 0; j < chev.value.length; j++) {
    var part = chev.value[j]
    if (part.type !== 'String') {
      warnOnInterpolatedExpr(part, warn, chev.loc, true)
    }
  }
}

function validateViewXmlFragment (raw, loc, warn) {
  var stripped = stripBeestingsToPlaceholders(raw)
  if (stripped.error) {
    warn(loc, 'view markup: ' + stripped.error)
    return
  }
  var wrapped = '<view-root xmlns:k="urn:krl-view">' + stripped.text + '</view-root>'
  var result = XMLValidator.validate(wrapped, { allowBooleanAttributes: true })
  if (result === true) return
  var msg = result && result.err && result.err.msg ? result.err.msg : 'invalid XML in view heredoc'
  var line = result && result.err && result.err.line
  warn(loc, 'view markup: ' + msg + (line != null ? ' (XML line ' + line + ')' : ''))
}

/**
 * Lint @view and @component shared functions: well-formed XML in heredoc,
 * unsafe #{ } interpolations, and names that would replace a built-in XMLUI
 * component.
 */
function lintViewMarkup (ast, rulesetSchema, warn) {
  if (!ast || ast.type !== 'Ruleset' || !rulesetSchema || !rulesetSchema.queries) return

  var viewQueries = {}
  for (var q = 0; q < rulesetSchema.queries.length; q++) {
    var query = rulesetSchema.queries[q]
    if (!query.view && !query.component) continue
    viewQueries[query.name] = true
    var componentName = xmluiBuiltins.componentNameFor(query.name)
    if (xmluiBuiltins.isBuiltin(componentName)) {
      var dec0 = (ast.global || []).find(function (d) {
        return d && d.left && d.left.value === query.name
      })
      warn(dec0 && dec0.doc ? dec0.doc.loc : null,
        (query.component ? '@component ' : '@view ') + query.name + ' is named ' +
        componentName + ', a built-in XMLUI component; pick another name')
    }
  }

  for (var i = 0; i < (ast.global || []).length; i++) {
    var dec = ast.global[i]
    if (!dec || !dec.left || dec.left.type !== 'Identifier') continue
    var fnName = dec.left.value
    if (!viewQueries[fnName]) continue
    if (!dec.right || dec.right.type !== 'Function') continue
    var ret = dec.right.return
    if (!ret || ret.type !== 'Chevron') continue

    lintChevronInterpolations(ret, warn)
    var fragment = chevronToXmlFragment(ret)
    validateViewXmlFragment(fragment, ret.loc || dec.loc, warn)
  }
}

module.exports = function (ast, comp, rulesetSchema) {
  if (!rulesetSchema || !rulesetSchema.queries) return
  lintViewMarkup(ast, rulesetSchema, comp.warn)
}
