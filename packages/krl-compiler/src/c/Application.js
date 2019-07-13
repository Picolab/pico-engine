var _ = require('lodash')
var callStdLibFn = require('../utils/callStdLibFn')

module.exports = function (ast, comp, e) {
  let callee
  let args

  if (ast.callee.type === 'MemberExpression' &&
            ast.callee.method === 'dot' &&
            (ast.callee.property.type === 'Identifier' || ast.callee.property.type === 'DomainIdentifier')
  ) {
    // dot operator syntax sugar
    // i.e.
    // "foo".bar(baz)
    // bar("foo",baz)

    callee = comp(ast.callee.property)
    args = comp(_.assign({}, ast.args, {
      // inject left-hand of the dot as the first argument
      args: [ast.callee.object].concat(ast.args.args)
    }))
  } else {
    callee = comp(ast.callee)
    args = comp(ast.args)
  }

  let calleeType = callee.$$Annotation
    ? callee.$$Annotation.type
    : 'Unknown'

  switch (calleeType) {
    case 'Function':
      break// great!
    case 'Unknown':
      // runtime check the type
      callee = e('call', e('id', '$env.krl.assertFunction'), [callee])
      break// ok
    default:
      throw comp.error(ast.action.loc, 'Not a function')
  }

  return e('acall', callee, [
    e('id', '$ctx'),
    args
  ])
}
