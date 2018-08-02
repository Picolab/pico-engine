var _ = require('lodash')

var mkId = function (e, i, key) {
  return e('id', 'foreach' + i + '_' + key)
}

var mkIsFinal = function (e, nIndexes) {
  var mkEq = function (i) {
    return e(
      '===',
      mkId(e, i, 'i'),
      e('-', mkId(e, i, 'len'), e('number', 1))
    )
  }
  var curr = mkEq(0)
  var i = 1
  while (i < nIndexes) {
    curr = e('&&', curr, mkEq(i))
    i++
  }
  return curr
}

module.exports = function (ast, comp, e, context) {
  var id = function (key) {
    return mkId(e, context.foreach_i, key)
  }

  var stmts = []

  var body = []
  if (context.foreach_n_left === 0) {
    // the last loop
    body.push(e('var', 'foreach_is_final', mkIsFinal(e, context.foreach_i + 1)))
  }
  _.each(ast.setting, function (set, i) {
    var val
    if (i === 0) {
      val = e('get', e('get', id('pairs'), id('i')), e('number', 1))// value
    } else if (i === 1) {
      val = e('get', e('get', id('pairs'), id('i')), e('number', 0))// key
    } else {
      val = e('nil')
    }
    body.push(e(';', e('call', e('id', 'ctx.scope.set'), [
      e('string', set.value, set.loc),
      val
    ])))
  })
  body = body.concat(context.foreach_body)

  stmts.push(e('var', id('pairs'), e('call', e('id', 'toPairs'), [comp(ast.expression)])))
  stmts.push(e('var', id('len'), e('.', id('pairs'), e('id', 'length'))))
  stmts.push(e('var', id('i')))
  stmts.push(e('for',
    e('=', id('i'), e('number', 0)),
    e('<', id('i'), id('len')),
    e('++', id('i')),
    e('block', body)
  ))

  return stmts
}
