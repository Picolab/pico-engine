var _ = require('lodash')
var callStdLibFn = require('../utils/callStdLibFn')

module.exports = function (ast, comp, e) {
  if (ast.callee.type === 'MemberExpression' &&
            ast.callee.method === 'dot' &&
            ast.callee.property.type === 'Identifier'
  ) {
    // operator syntax is just sugar for stdlib functions
    var operator = ast.callee.property

    var args = comp(_.assign({}, ast.args, {
      // the object is the first argument in the stdlib function
      args: [ast.callee.object].concat(ast.args.args)
    }))

    return callStdLibFn(e, operator.value, args, operator.loc)
  }

  if (ast.callee.type === 'DomainIdentifier' &&
        ast.callee.domain === 'event' &&
        ast.callee.value === 'attrs'
  ) {
    comp.warn(ast.callee.loc, 'DEPRECATED change `event:attrs()` to `event:attrs`')
    return comp(ast.callee)
  }

  if (ast.callee.type === 'DomainIdentifier' &&
        ast.callee.domain === 'keys'
  ) {
    var domainId = 'keys:' + ast.callee.value
    if (ast.args.args.length > 0) {
      comp.warn(ast.callee.loc, 'DEPRECATED change `' + domainId + '(name)` to `' + domainId + '{name}`')
      return callStdLibFn(e, 'get', [
        comp(ast.callee),
        comp(ast.args.args[0])
      ], ast.loc)
    } else {
      comp.warn(ast.callee.loc, 'DEPRECATED change `' + domainId + '()` to `' + domainId + '`')
      return comp(ast.callee)
    }
  }

  return e('acall', e('id', 'ctx.applyFn'), [
    comp(ast.callee),
    e('id', 'ctx'),
    comp(ast.args)
  ])
}
