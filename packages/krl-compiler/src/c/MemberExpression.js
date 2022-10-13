var callStdLibFn = require('../utils/callStdLibFn')

module.exports = function (ast, comp, e) {
  if (ast.method === 'dot') {
    comp.warn(ast.loc, 'DEPRECATED use `{}` or `[]` instead of `.`')
    if (ast.property.type === 'Identifier') {
      // using "get" rather than . b/c we don"t want to mess
      // with reserved javascript properties i.e. "prototype"
      return e('get', comp(ast.object), e('str', ast.property.value, ast.property.loc))
    }
    return e('get', comp(ast.object), comp(ast.property))
  } else if (ast.method === 'path') {
    if (ast.object.type === 'DomainIdentifier' &&
            (ast.object.domain === 'ent')
    ) {
      // TODO use optimized version
      // TODO return e('acall', e('id', '$ctx.rsCtx.getEnt'), [
      // TODO   e('str', ast.object.value),
      // TODO   comp(ast.property)
      // TODO ])
      return e('acall', e('id', '$stdlib.get'), [
        e('id', '$ctx'),
        e('array', [
          e('acall', e('id', '$ctx.rsCtx.getEnt'), [
            e('str', ast.object.value)
          ]),
          comp(ast.property)
        ])
      ])
    }
    if (ast.object.type === 'DomainIdentifier' &&
      ast.object.domain === 'event' &&
      ast.object.value === 'attrs'
    ) {
      const val = ast.property
      if (val && val.type === 'String') {
        comp.eventScope.addAttr(val.value)
      }
    }
    return callStdLibFn(e, 'get', [
      comp(ast.object),
      comp(ast.property)
    ], ast.loc)
  } else if (ast.method === 'index') {
    return callStdLibFn(e, 'get', [
      comp(ast.object),
      e('array', [comp(ast.property)], ast.property.loc)
    ], ast.loc)
  }
  throw new Error('Unsupported MemberExpression method: ' + ast.method)
}
