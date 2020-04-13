var _ = require('lodash')

module.exports = function (ast, comp, e) {
  var body = []

  comp.scope.push()
  comp.scope.set('$$is_inside_fn_or_action_body$$', true)

  // compile the params first, so params get defined in comp.scope before the function body compiles
  const { params, defaultSetups } = comp(ast.params)
  body = body.concat(defaultSetups)

  _.each(ast.body, function (part, i) {
    body.push(comp(part))
  })

  body.push(e('return', comp(ast.return)))

  comp.scope.pop()

  var paramNames = []
  var paramOrder = e('array', _.map(ast.params.params, function (p) {
    paramNames.push(p.id.value)
    return e('string', p.id.value, p.id.loc)
  }), ast.params.loc)

  const estree = e('call', e('id', '$env.krl.Function'), [
    paramOrder,
    {
      type: 'FunctionExpression',
      params: params,
      body: {
        type: 'BlockStatement',
        body: body
      },
      async: true
    }
  ])
  estree.$$Annotation = {
    type: 'Function',
    params: paramNames
  }
  return estree
}
