const _ = require('lodash')
const jsIdent = require('../utils/jsIdent')

function mkId (e, i, key) {
  return e('id', '$foreach' + i + '_' + key)
}

function mkIsFinal (e, nIndexes) {
  function mkEq (i) {
    return e(
      '===',
      mkId(e, i, 'i'),
      e('-', mkId(e, i, 'len'), e('number', 1))
    )
  }
  let curr = mkEq(0)
  let i = 1
  while (i < nIndexes) {
    curr = e('&&', curr, mkEq(i))
    i++
  }
  return curr
}

module.exports = function (ast, comp, e, context) {
  function id (key) {
    return mkId(e, context.foreach_i, key)
  }

  let stmts = []

  let body = []
  if (context.foreach_n_left === 0) {
    // the last loop
    body.push(e('let', '$foreach_is_final', mkIsFinal(e, context.foreach_i + 1)))
  }
  _.each(ast.setting, function (set, i) {
    let val
    if (i === 0) {
      val = e('get', e('get', id('pairs'), id('i')), e('number', 1))// value
    } else if (i === 1) {
      val = e('get', e('get', id('pairs'), id('i')), e('number', 0))// key
    } else {
      val = e('nil')
    }
    body.push(e('let', jsIdent(set.value), val, set.loc))
  })
  body = body.concat(context.foreach_body)

  stmts.push(e('let', id('pairs'), e('call', e('id', '$env.krl.toPairs'), [comp(ast.expression)])))
  stmts.push(e('let', id('len'), e('.', id('pairs'), e('id', 'length'))))
  stmts.push(e('let', id('i')))
  stmts.push(e('for',
    e('=', id('i'), e('number', 0)),
    e('<', id('i'), id('len')),
    e('++', id('i')),
    e('block', body)
  ))

  return stmts
}
