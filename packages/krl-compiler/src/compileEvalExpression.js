/**
 * Compile a KRL expression for the owner console (read-only eval in ruleset scope).
 * Uses compile.js (same ESTree driver as ruleset pre/actions/queries).
 */
var escodegen = require('escodegen')
var toJsIdentifier = require('to-js-identifier')
var tokenizer = require('krl-parser/dist/src/tokenizer').default
var krlParse = require('krl-parser/dist/src/krl')
var compileModule = require('./compile')
var compileExpressionAst = compileModule.compileExpressionAst
var compileConsoleProgram = compileModule.compileConsoleProgram

var FORBIDDEN = {
  PersistentVariableAssignment: 'assignments (including ent:… := …) are not allowed in the console',
  ClearPersistentVariable: 'clearing entity variables is not allowed in the console',
  RaiseEventStatement: 'raise is not allowed in the console',
  ScheduleEventStatement: 'schedule is not allowed in the console',
  Action: 'actions are not allowed in the console',
  ActionBlock: 'action blocks are not allowed in the console',
  DefAction: 'defactions are not allowed in the console',
  Function: 'defining functions is not allowed in the console',
  Declaration: 'declarations are not allowed in the console',
  Rule: 'rules are not allowed in the console',
  Ruleset: 'rulesets are not allowed in the console'
}

function walkAst (node, visit) {
  if (!node || typeof node !== 'object' || !node.type) {
    return
  }
  visit(node)
  for (var key of Object.keys(node)) {
    if (key === 'loc' || key === 'type') {
      continue
    }
    var val = node[key]
    if (Array.isArray(val)) {
      val.forEach(function (n) {
        walkAst(n, visit)
      })
    } else if (val && typeof val === 'object' && val.type) {
      walkAst(val, visit)
    }
  }
}

function lintConsoleExpression (ast) {
  walkAst(ast, function (node) {
    var msg = FORBIDDEN[node.type]
    if (msg) {
      var err = new Error(msg)
      err.krl_compiler = { loc: null }
      throw err
    }
  })
}

function parseConsoleSource (exprSource) {
  var src = String(exprSource)
  var tokens = tokenizer(src)
  try {
    return {
      declarations: [],
      exprAst: krlParse.parseExpression(tokens)
    }
  } catch (parseExprErr) {
    var statements = krlParse.parse(tokenizer(src))
    if (!Array.isArray(statements) || statements.length === 0) {
      throw parseExprErr
    }
    var last = statements[statements.length - 1]
    if (last.type === 'Declaration') {
      var err = new Error(
        'Console needs a final expression after bindings (e.g. flip = "name"; getThings(){…})'
      )
      err.krl_compiler = { loc: null }
      throw err
    }
    if (last.type !== 'Application' &&
        last.type !== 'Identifier' &&
        last.type !== 'MemberExpression' &&
        last.type !== 'InfixOperator' &&
        last.type !== 'ConditionalExpression' &&
        last.type !== 'UnaryOperator' &&
        last.type !== 'DomainIdentifier' &&
        last.type !== 'Map' &&
        last.type !== 'Array' &&
        last.type !== 'String' &&
        last.type !== 'Number' &&
        last.type !== 'Boolean' &&
        last.type !== 'Null' &&
        last.type !== 'RegExp') {
      var bad = new Error('Console final statement must be an expression, not ' + last.type)
      bad.krl_compiler = { loc: last.loc || null }
      throw bad
    }
    var declarations = statements.slice(0, -1)
    for (var i = 0; i < declarations.length; i++) {
      var s = declarations[i]
      if (s.type !== 'Declaration') {
        var e2 = new Error(
          'Only name bindings are allowed before `;` (e.g. flip = "name"; …), not ' + s.type
        )
        e2.krl_compiler = { loc: s.loc || null }
        throw e2
      }
      if (s.right.type === 'Function' || s.right.type === 'Action' ||
          s.right.type === 'DefAction') {
        var e3 = new Error('Defining functions or actions in the console is not allowed')
        e3.krl_compiler = { loc: s.loc || null }
        throw e3
      }
    }
    return { declarations: declarations, exprAst: last }
  }
}

function seedScopeFromRuleset (rulesetAst, scope) {
  if (rulesetAst.meta) {
    rulesetAst.meta.properties.forEach(function (prop) {
      if (prop.key.value === 'use' && prop.value && prop.value.kind === 'module') {
        var alias = prop.value.alias
          ? prop.value.alias.value
          : prop.value.rid.value
        scope.set(alias, { type: 'Module' })
      }
    })
  }
  if (rulesetAst.global) {
    rulesetAst.global.forEach(function (decl) {
      if (decl.type === 'Declaration' && decl.left.type === 'Identifier') {
        scope.set(decl.left.value, { type: 'Unknown' })
      }
    })
  }
}

module.exports = function compileEvalExpression (exprSource, options) {
  options = options || {}
  var rulesetKrl = options.rulesetKrl
  if (!rulesetKrl) {
    throw new Error('compileEvalExpression requires rulesetKrl')
  }

  var parsed = parseConsoleSource(exprSource)
  lintConsoleExpression(parsed.exprAst)
  parsed.declarations.forEach(function (d) {
    lintConsoleExpression(d.right)
  })

  var rulesetAst = krlParse.parseRuleset(tokenizer(rulesetKrl))
  var globalRefSet = {}
  if (rulesetAst.global) {
    rulesetAst.global.forEach(function (d) {
      if (d.type === 'Declaration' && d.left.type === 'Identifier') {
        globalRefSet[d.left.value] = true
      }
    })
  }

  var compileOpts = {
    consoleEvalMode: true,
    globalRefNames: globalRefSet,
    seedScope: function (scope) {
      seedScopeFromRuleset(rulesetAst, scope)
    }
  }

  var compiled = parsed.declarations.length === 0
    ? compileExpressionAst(parsed.exprAst, compileOpts)
    : compileConsoleProgram(parsed.declarations, parsed.exprAst, compileOpts)

  var stdlibModuleInit = {
    type: 'VariableDeclaration',
    kind: 'const',
    declarations: [{
      type: 'VariableDeclarator',
      id: { type: 'Identifier', name: '$stdlib' },
      init: {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          computed: false,
          object: { type: 'Identifier', name: '$ctx' },
          property: { type: 'Identifier', name: 'module' }
        },
        arguments: [{ type: 'Literal', value: 'stdlib' }]
      }
    }]
  }

  var stdlibInits = []
  Object.keys(compiled.stdlibToInject).forEach(function (id) {
    stdlibInits.push({
      type: 'VariableDeclaration',
      kind: 'const',
      declarations: [{
        type: 'VariableDeclarator',
        id: {
          type: 'Identifier',
          name: toJsIdentifier(id) + compiled.scope.getItsHeight(id)
        },
        init: {
          type: 'MemberExpression',
          computed: true,
          object: { type: 'Identifier', name: '$stdlib' },
          property: { type: 'Literal', value: id }
        }
      }]
    })
  })

  var fn = {
    type: 'FunctionExpression',
    async: true,
    params: [
      { type: 'Identifier', name: '$ctx' },
      { type: 'Identifier', name: '$g' }
    ],
    body: {
      type: 'BlockStatement',
      body: [stdlibModuleInit].concat(
        stdlibInits,
        compiled.declEstree || [],
        [{
          type: 'ReturnStatement',
          argument: compiled.estree
        }]
      )
    }
  }

  var code = escodegen.generate(fn, {
    format: { quotes: 'double', indent: { style: '  ' } }
  })

  return {
    warnings: compiled.warnings,
    run: function runConsoleEval ($ctx, $g) {
      var AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
      var runner = new AsyncFunction('$ctx', '$g', 'return (' + code + ')($ctx, $g)')
      return runner($ctx, $g)
    }
  }
}
