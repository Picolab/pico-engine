module.exports = function (ast, comp, e) {
  return e(';', e('call', e('id', 'ctx.stopRulesetExecution'), [e('id', 'ctx')]))
}
