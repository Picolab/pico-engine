var _ = require('lodash')
var mkTree = require('estree-builder')

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

module.exports = function (ast, options) {
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

  var compile = function compile (ast, context) {
    if (_.isArray(ast)) {
      return _.map(ast, function (a) {
        return compile(a)
      })
    } else if (!ast || !_.has(ast, 'type')) {
      throw krlError(ast.loc, 'Invalid ast node: ' + JSON.stringify(ast))
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

  var body = compile(ast)
  body = _.isArray(body) ? body : [body]

  body = body.map(function (estree) {
    if (!/Statement/.test(estree.type)) {
      return mkTree(';', estree, estree.loc)
    }
    return estree
  })

  return {
    body: body,
    warnings: warnings
  }
}
