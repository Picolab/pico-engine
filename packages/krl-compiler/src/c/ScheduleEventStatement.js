var _ = require('lodash')

module.exports = function (ast, comp, e) {
  var args = {
    attributes: ast.event_attrs ? comp(ast.event_attrs) : e('nil')
  }

  if (ast.event_domainAndType) {
    args.domainAndType = comp(ast.event_domainAndType)
  } else {
    args.domain = e('string', ast.event_domain.value, ast.event_domain.loc)
    args.type = comp(ast.event_type)
  }
  if (_.has(ast, 'at')) {
    args.at = comp(ast.at)
  }
  if (_.has(ast, 'timespec')) {
    args.timespec = comp(ast.timespec)
  }

  var moduleCall = e('acall', e('id', 'ctx.scheduleEvent'), [e('obj', args)])

  if (ast.setting) {
    return e(';', e('call', e('id', 'ctx.scope.set', ast.setting.loc), [
      e('str', ast.setting.value, ast.setting.loc),
      moduleCall
    ], ast.setting.loc))
  } else {
    return e(';', moduleCall)
  }
}
