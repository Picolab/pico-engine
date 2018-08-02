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
            (ast.object.domain === 'ent' || ast.object.domain === 'app')
    ) {
      return e('acall', e('id', 'ctx.modules.get'), [
        e('id', 'ctx'),
        e('str', ast.object.domain),
        e('obj', {
          key: e('str', ast.object.value),
          path: comp(ast.property)
        })
      ], ast.loc)
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
