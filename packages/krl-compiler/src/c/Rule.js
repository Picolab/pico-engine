var _ = require('lodash')
var declarationBlock = require('../utils/declarationBlock')
const jsIdent = require('../utils/jsIdent')

function Rule (ast, comp, e) {
  // TODO use symbol-table to store ast.name.value
  if (ast.rule_state !== 'active') {
    comp.warn(ast.loc, 'rule ' + ast.name.value + ' is inactive, i.e. commented out')
    return e(';', e('null'))
  }
  if (!ast.select) {
    throw comp.error(ast.loc, 'rule ' + ast.name.value + ' is missing a `select`')
  }

  comp.scope.set('$selectVars', [])

  const selectWhenRule = comp(ast.select)

  var ruleBody = []

  const selectVars = _.uniq(comp.scope.get('$selectVars'))
  _.each(selectVars, function (selectVar) {
    ruleBody.push(e('var', jsIdent(selectVar), e('get', e('id', '$state.setting'), e('str', selectVar))))
  })
  if (_.size(selectVars) > 0) {
    ruleBody.push(e(';', e('=', e('id', 'this.rule.state'), e('call', e('id', 'Object.assign'), [
      e('obj', {}),
      e('id', '$state'),
      e('obj', {
        setting: e('obj', {})
      })
    ]))))
  }

  _.each(ast.foreach, function (foreach) {
    _.each(foreach.setting, function (set, i) {
      comp.scope.set(set.value, { type: 'Unknown' })
    })
  })

  if (!_.isEmpty(ast.prelude)) {
    ruleBody = ruleBody.concat(declarationBlock(ast.prelude, comp))
  }
  if (ast.action_block) {
    ruleBody = ruleBody.concat(comp(ast.action_block))
  } else {
    ruleBody.push(e('var', '$fired', e('true')))
  }

  ruleBody.push(e('if', e('id', '$fired'),
    e(';', e('call', e('id', '$ctx.log.debug'), [
      e('str', 'fired')
    ])),
    e(';', e('call', e('id', '$ctx.log.debug'), [
      e('str', 'not fired')
    ]))
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

  return e(';', e('call', e('id', '$rs.when'), [
    selectWhenRule,
    e('asyncfn', ['$event', '$state', '$last'], ruleBody)
  ]))
}

module.exports = function (ast, comp, e) {
  comp.scope.push()
  comp.scope.set('$rule_name', ast.name.value)
  const estree = Rule(ast, comp, e)
  comp.scope.pop()
  return estree
}
