var parser = require('krl-parser')
var EStreeLoc = require('estree-loc')
var compile = require('./compile')

function formatWarning (w) {
  var l = w.loc && w.loc.start && w.loc.start.line
  var c = w.loc && w.loc.start && w.loc.start.column
  var suffix = (l != null && c != null) ? ' at ' + l + ':' + c : ''
  return { message: w.message + suffix, line: l, column: c, severity: 'warning' }
}

function errorFromParse (err) {
  var line = err.token && err.token.line
  var column = err.token && err.token.column
  return {
    message: err.message + (line != null ? ' at ' + line + ':' + column : ''),
    line: line,
    column: column,
    severity: 'error'
  }
}

function errorFromCompile (err) {
  var loc = err.krl_compiler && err.krl_compiler.loc
  var line = loc && loc.start && loc.start.line
  var column = loc && loc.start && loc.start.column
  return {
    message: err.message + (line != null ? ' at ' + line + ':' + column : ''),
    line: line,
    column: column,
    severity: 'error'
  }
}

module.exports = function check (src, options) {
  options = options || {}
  var result = {
    ok: true,
    rid: null,
    rulesetSchema: null,
    errors: [],
    warnings: []
  }
  var ast
  try {
    ast = parser(src, options.parser_options)
  } catch (err) {
    result.ok = false
    result.errors.push(errorFromParse(err))
    return result
  }
  if (!ast || ast.type !== 'Ruleset') {
    result.ok = false
    result.errors.push({ message: 'Expected a ruleset', severity: 'error' })
    return result
  }
  var toLoc = EStreeLoc(src, options.filepath)
  try {
    var compiled = compile(ast, { toLoc: toLoc })
    result.rid = compiled.rid
    result.rulesetSchema = compiled.rulesetSchema
    result.warnings = (compiled.warnings || []).map(formatWarning)
  } catch (err) {
    result.ok = false
    result.errors.push(errorFromCompile(err))
  }
  return result
}
