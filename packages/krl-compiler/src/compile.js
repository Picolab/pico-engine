var _ = require('lodash')
var mkTree = require('estree-builder')
var krlStdlib = require('krl-stdlib')
var toJsIdentifier = require('to-js-identifier')
var SymbolTableStack = require('symbol-table/stack')

var compByType = {
  'Action': require('./c/Action'),
  'ActionBlock': require('./c/ActionBlock'),
  'Application': require('./c/Application'),
  'Arguments': require('./c/Arguments'),
  'Array': require('./c/Array'),
  'Boolean': require('./c/Boolean'),
  'Chevron': require('./c/Chevron'),
  'ClearPersistentVariable': require('./c/ClearPersistentVariable'),
  'ConditionalExpression': require('./c/ConditionalExpression'),
  'Declaration': require('./c/Declaration'),
  'DefAction': require('./c/DefAction'),
  'DomainIdentifier': require('./c/DomainIdentifier'),
  'ErrorStatement': require('./c/ErrorStatement'),
  'EventExpression': require('./c/EventExpression'),
  'EventGroupOperator': require('./c/EventGroupOperator'),
  'EventOperator': require('./c/EventOperator'),
  'EventWithin': require('./c/EventWithin'),
  'Function': require('./c/Function'),
  'GuardCondition': require('./c/GuardCondition'),
  'Identifier': require('./c/Identifier'),
  'InfixOperator': require('./c/InfixOperator'),
  'LastStatement': require('./c/LastStatement'),
  'LogStatement': require('./c/LogStatement'),
  'Map': require('./c/Map'),
  'MapKeyValuePair': require('./c/MapKeyValuePair'),
  'MemberExpression': require('./c/MemberExpression'),
  'Null': require('./c/Null'),
  'Number': require('./c/Number'),
  'Parameter': require('./c/Parameter'),
  'Parameters': require('./c/Parameters'),
  'PersistentVariableAssignment': require('./c/PersistentVariableAssignment'),
  'RaiseEventStatement': require('./c/RaiseEventStatement'),
  'RegExp': require('./c/RegExp'),
  'Rule': require('./c/Rule'),
  'RuleForEach': require('./c/RuleForEach'),
  'RulePostlude': require('./c/RulePostlude'),
  'RuleSelect': require('./c/RuleSelect'),
  'Ruleset': require('./c/Ruleset'),
  'RulesetID': require('./c/RulesetID'),
  'RulesetMeta': require('./c/RulesetMeta'),
  'ScheduleEventStatement': require('./c/ScheduleEventStatement'),
  'String': require('./c/String'),
  'UnaryOperator': require('./c/UnaryOperator')
}

function isKrlLoc (loc) {
  return _.isPlainObject(loc) && _.has(loc, 'start') && _.has(loc, 'end')
}

/** Shared KRL → ESTree compile driver (rulesets, console expressions, schema). */
function createCompileSession (options) {
  options = options || {}

  var toLoc = options.toLoc || _.noop

  var mkE = function (defaultKrlLoc) {
    var defaultLoc = toLoc(defaultKrlLoc.start, defaultKrlLoc.end)

    return function () {
      var args = Array.prototype.slice.call(arguments)
      var lastI = args.length - 1
      if (args[0] === 'json' && lastI <= 2) {
        lastI = 2
      }
      var last = args[lastI]
      if (isKrlLoc(last)) {
        args[lastI] = toLoc(last.start, last.end)
      } else {
        args.push(defaultLoc)
      }
      if (args[0] === 'acall') {
        return {
          type: 'AwaitExpression',
          argument: mkTree.apply(null, ['call'].concat(_.tail(args))),
          loc: args[args.length - 1]
        }
      } else if (args[0] === 'asyncfn') {
        args[0] = 'fn'
        var estree = mkTree.apply(null, args)
        estree.async = true
        return estree
      }
      return mkTree.apply(null, args)
    }
  }

  var krlError = function (loc, message) {
    var err = new Error(message)
    err.krl_compiler = {
      loc: loc && toLoc(loc.start, loc.end)
    }
    return err
  }

  var warnings = []

  var warn = function (loc, message) {
    warnings.push({
      loc: loc && toLoc(loc.start, loc.end),
      message: message
    })
  }

  var scope = SymbolTableStack()
  Object.keys(krlStdlib.stdlib).forEach(id => {
    scope.set(id, { type: krlStdlib.krl.typeOf(krlStdlib.stdlib[id]) })
  })
  scope.set('__testing', { type: 'Map' })
  scope.push()

  if (typeof options.seedScope === 'function') {
    options.seedScope(scope)
  }

  var stdlibToInject = {}
  var eventScope = (function () {
    const map = {}
    return {
      add (domain, name) {
        const rname = scope.get('$rule_name')
        const path = [rname, domain, name]
        if (!_.has(map, path)) {
          _.set(map, path, { attrs: {} })
        }
      },
      addAttr (key) {
        const rname = scope.get('$rule_name')
        for (const domain of Object.keys(map[rname] || {})) {
          for (const name of Object.keys(map[rname][domain])) {
            _.set(map, [rname, domain, name, 'attrs', key], true)
          }
        }
      },
      getTestingJSON () {
        const result = []
        for (const rname of Object.keys(map)) {
          for (const domain of Object.keys(map[rname])) {
            for (const name of Object.keys(map[rname][domain])) {
              const e = map[rname][domain][name]
              const attrs = Object.keys(e.attrs)
              result.push({ domain, name, attrs })
            }
          }
        }
        return result
      }
    }
  }())

  var sourceKrl = options.sourceKrl || null

  var compile = function compile (ast, context) {
    if (_.isArray(ast)) {
      return _.map(ast, function (a) {
        return compile(a)
      })
    } else if (!ast || !_.has(ast, 'type')) {
      throw krlError(ast && ast.loc, 'Invalid ast node: ' + JSON.stringify(ast))
    } else if (!_.has(compByType, ast.type)) {
      throw krlError(ast.loc, 'Unsupported ast node type: ' + ast.type)
    }
    var comp = compile
    if (context) {
      comp = function (ast, c) {
        return compile(ast, c || context)
      }
    }
    comp.error = krlError
    comp.warn = warn
    comp.scope = scope
    comp.eventScope = eventScope
    comp.stdlibToInject = stdlibToInject
    comp.sourceKrl = sourceKrl
    comp.consoleEvalMode = options.consoleEvalMode
    comp.globalRefNames = options.globalRefNames
    comp.jsId = function (id) {
      if (!comp.scope.has(id)) {
        throw comp.error(ast.loc, 'Undefined id: ' + id)
      }
      return toJsIdentifier(id) + scope.getItsHeight(id)
    }

    var estree
    try {
      estree = compByType[ast.type](ast, comp, mkE(ast.loc), context)
    } catch (e) {
      if (!e.krl_compiler) {
        e.krl_compiler = {
          loc: toLoc(ast.loc.start, ast.loc.end)
        }
      }
      throw e
    }
    return estree
  }

  return {
    compile,
    warnings,
    stdlibToInject,
    scope
  }
}

function compileRulesetAst (ast, options) {
  var session = createCompileSession(options)

  var rid
  if (ast && ast.type === 'Ruleset') {
    if (ast.rid && ast.rid.type === 'RulesetID') {
      rid = ast.rid.value
    }
  }

  var estree = session.compile(ast)
  estree = _.isArray(estree) ? estree : []

  var rulesetSchema = null
  if (ast && ast.type === 'Ruleset') {
    var buildRulesetSchema = require('./rulesetSchema')
    var shares = []
    if (ast.meta) {
      _.each(ast.meta.properties, function (prop) {
        if (prop.key.value === 'shares' && prop.value && prop.value.ids) {
          _.each(prop.value.ids, function (id) {
            shares.push(id)
          })
        }
      })
    }
    rulesetSchema = buildRulesetSchema(ast, session.compile, shares)
    require('./annotationLint')(ast, session.compile, rulesetSchema)
  }

  return {
    rid,
    estree,
    warnings: session.warnings,
    rulesetSchema
  }
}

module.exports = compileRulesetAst

/** Compile a single expression AST with the same driver as ruleset bodies. */
module.exports.compileExpressionAst = function (exprAst, options) {
  var session = createCompileSession(options)
  return {
    estree: session.compile(exprAst),
    warnings: session.warnings,
    stdlibToInject: session.stdlibToInject,
    scope: session.scope
  }
}

/** Console: optional `name = expr;` bindings, then one expression (same as a rule pre + value). */
module.exports.compileConsoleProgram = function (declarations, exprAst, options) {
  var session = createCompileSession(options)
  var declEstree = _.map(declarations, function (d) {
    return session.compile(d)
  })
  return {
    declEstree: declEstree,
    estree: session.compile(exprAst),
    warnings: session.warnings,
    stdlibToInject: session.stdlibToInject,
    scope: session.scope
  }
}
