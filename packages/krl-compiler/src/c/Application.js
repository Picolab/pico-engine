var _ = require('lodash')

module.exports = function (ast, comp, e) {
  if (ast.callee.type === 'DomainIdentifier' &&
    ast.callee.domain === 'event' &&
            ast.callee.value === 'attrs'
  ) {
    throw comp.error(ast.callee.loc, '`event:attrs` is a Map, not a Function. Use `event:attrs{key}` instead')
  }
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
  } else if (ast.callee.type === 'DomainIdentifier') {
    callee = comp(ast.callee, { isGoingToBeApplied: true })
    args = comp(ast.args)
    if (ast.callee.domain === 'event' && ast.callee.value === 'attr') {
      let arg0 = ast.args.args[0]
      if (arg0 && arg0.type === 'String') {
        comp.eventScope.addAttr(arg0.value)
      }
    }
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
      callee = e('call', e('id', '$ctx.krl.assertFunction'), [callee])
      break// ok
    default:
      throw comp.error(ast.action.loc, 'Not a function')
  }

  return e('acall', callee, [
    e('id', '$ctx'),
    args
  ])
}
