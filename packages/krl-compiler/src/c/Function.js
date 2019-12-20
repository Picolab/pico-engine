var _ = require('lodash')

module.exports = function (ast, comp, e) {
  var body = comp(ast.params)

  _.each(ast.body, function (part, i) {
    return body.push(comp(part))
  })

  body.push(e('return', comp(ast.return)))

  var paramOrder = e('array', _.map(ast.params.params, function (p) {
    return e('string', p.id.value, p.id.loc)
  }), ast.params.loc)

  return e('call', e('id', 'ctx.mkFunction'), [
    paramOrder,
    e('asyncfn', ['ctx', 'args'], body)
  ])
}
