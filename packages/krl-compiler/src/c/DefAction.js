var _ = require('lodash')

module.exports = function (ast, comp, e) {
  var body = comp(ast.params)

  _.each(ast.body, function (d) {
    body.push(comp(d))
  })

  body = body.concat(comp(ast.action_block))

  body.push(e('return', e('array', _.map(ast.returns, function (ret) {
    return comp(ret)
  }))))

  var paramOrder = e('array', _.map(ast.params.params, function (p) {
    return e('string', p.id.value, p.id.loc)
  }), ast.params.loc)

  return e('call', e('id', 'ctx.mkAction'), [
    paramOrder,
    e('asyncfn', [
      'ctx',
      'args',
      'runAction'
    ], body)
  ])
}
