var _ = require('lodash')

module.exports = function (ast, comp, e) {
  var body = []

  comp.scope.push()

  // compile the params first, so params get defined in comp.scope before the function body compiles
  const params = comp(ast.params)

  _.each(ast.body, function (part, i) {
    if (i < (ast.body.length - 1)) {
      return body.push(comp(part))
    }
    if (part.type !== 'ExpressionStatement') {
      throw comp.error(part.loc, 'function must end with an expression')
    }
    part = part.expression
    return body.push(e('return', comp(part)))
  })
  comp.scope.pop()

  var paramNames = []
  var paramOrder = e('array', _.map(ast.params.params, function (p) {
    paramNames.push(p.id.value)
    return e('string', p.id.value, p.id.loc)
  }), ast.params.loc)

  const estree = e('call', e('id', '$env.krl.function'), [
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
