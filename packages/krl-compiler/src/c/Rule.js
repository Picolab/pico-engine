var _ = require('lodash')
var declarationBlock = require('../utils/declarationBlock')

module.exports = function (ast, comp, e) {
  var rule = {
    name: e('string', ast.name.value, ast.name.loc)
  }
  if (ast.rule_state !== 'active') {
    rule.rule_state = e('string', ast.rule_state)
    comp.warn(ast.loc, 'rule ' + ast.name.value + ' is inactive, i.e. commented out')
    return e('obj', rule)
  }
  if (!ast.select) {
    throw comp.error(ast.loc, 'rule ' + ast.name.value + ' is missing a `select`')
  }
  rule.select = comp(ast.select)

  var ruleBody = []

  if (!_.isEmpty(ast.prelude)) {
    ruleBody = ruleBody.concat(declarationBlock(ast.prelude, comp))
  }
  if (ast.action_block) {
    ruleBody = ruleBody.concat(comp(ast.action_block))
  } else {
    ruleBody.push(e('var', 'fired', e('true')))
  }

  ruleBody.push(e('if', e('id', 'fired'),
    e(';', e('call', e('id', 'ctx.emit'), [e('str', 'debug'), e('str', 'fired')])),
    e(';', e('call', e('id', 'ctx.emit'), [e('str', 'debug'), e('str', 'not fired')]))
  ))

  if (ast.postlude) {
    ruleBody = ruleBody.concat(comp(ast.postlude))
  }

  if (!_.isEmpty(ast.foreach)) {
    var foreachBody = ruleBody

    var nesetedForeach = function (arr, i) {
      if (_.isEmpty(arr)) {
        return foreachBody
      }
      return comp(_.head(arr), {
        foreach_i: i,
        foreach_n_left: _.size(_.tail(arr)),
        foreach_body: nesetedForeach(_.tail(arr), i + 1)
      })
    }
    ruleBody = nesetedForeach(ast.foreach, 0)
  }

  rule.body = e('asyncfn', ['ctx', 'runAction', 'toPairs'], ruleBody)

  return e('obj', rule)
}
