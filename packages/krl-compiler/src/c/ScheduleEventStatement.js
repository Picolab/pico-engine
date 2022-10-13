const _ = require('lodash')

module.exports = function (ast, comp, e) {
  const args = {
    eci: e('id', '$event.eci'),
    attrs: ast.event_attrs ? comp(ast.event_attrs) : e('nil')
  }

  if (ast.event_domainAndType) {
    args.domainAndType = comp(ast.event_domainAndType)
  } else {
    args.domain = e('string', ast.event_domain.value, ast.event_domain.loc)
    args.name = comp(ast.event_type)
  }

  let addFunction
  if (_.has(ast, 'at')) {
    args.time = comp(ast.at)
    addFunction = 'at'
  } else if (_.has(ast, 'timespec')) {
    args.timespec = comp(ast.timespec)
    addFunction = 'repeat'
  } else {
    throw comp.error(ast.loc, 'error')
  }

  var moduleCall = e('acall', e('get', e('call', e('id', '$ctx.module'), [e('str', 'schedule')]), e('str', addFunction)), [e('id', '$ctx'), e('obj', args)])

  if (ast.setting) {
    comp.scope.set(ast.setting.value, { type: 'Unknown' })
    return e('var',
      e('id', comp.jsId(ast.setting.value), ast.setting.loc),
      moduleCall,
      ast.setting.loc
    )
  } else {
    return e(';', moduleCall)
  }
}
