var _ = require('lodash')

module.exports = function (ast, comp, e) {
  // FYI the graph allready vetted the domain and type

  if (ast.deprecated) {
    comp.warn(ast.loc, 'DEPRECATED SYNTAX - ' + ast.deprecated)
  }

  comp.eventScope.add(ast.event_domain.value, ast.event_type.value)

  var fnBody = []

  if (!_.isEmpty(ast.event_attrs)) {
    // select when domain type <attr> re#..#
    fnBody.push(e('var', 'matches', e('array', [])))
    fnBody.push(e('var', 'setting', e('obj', {})))
    fnBody.push(e('var', 'm'))
    fnBody.push(e('var', 'j'))
    _.each(ast.event_attrs, function (a) {
      var id = function (str, loc) {
        return e('id', str, loc || a.loc)
      }

      // m = regex.exec(attr string or "")
      var key = e('string', a.key.value, a.key.loc)
      comp.eventScope.addAttr(a.key.value)

      var regexExec = e('.', comp(a.value), id('exec', a.value.loc), a.value.loc)
      fnBody.push(e(';', e('=', id('m'), e('call', regexExec, [
        e('?', e('call', e('id', 'Object.prototype.hasOwnProperty.call'), [id('$event.data.attrs'), key]), e('call', e('id', '$stdlib.as', a.key.loc), [
          e('id', '$ctx', a.key.loc),
          e('array', [
            e('get', id('$event.data.attrs'), key, a.key.loc),
            e('str', 'String', a.key.loc)
          ], a.key.loc)
        ], a.key.loc), e('str', '', a.key.loc))
      ], a.value.loc), a.value.loc)))

      // if !m, then the EventExpression doesn't match
      fnBody.push(e('if', e('!', id('m')), e('return', e('obj', { match: e(false) }))))

      // append to matches
      var init = e('=', id('j'), e('number', 1))
      var test = e('<', id('j'), id('m.length'))
      var update = e('++', id('j'))
      var body = e(';', e('call', id('matches.push'), [e('get', id('m'), id('j'))]))
      fnBody.push(e('for', init, test, update, body))
    })
  } else if (!_.isEmpty(ast.setting)) {
    fnBody.push(e('var', 'matches', e('array', [])))
  }

  _.each(ast.setting, function (s, i) {
    comp.scope.set(s.value, { type: 'String' })
    comp.scope.get('$selectVars').push(s.value)
    fnBody.push(
      e('var',
        comp.jsId(s.value),
        e('=',
          e('get', e('id', 'setting', s.loc), e('str', s.value, s.loc), s.loc),
          e('get', e('id', 'matches', s.loc), e('num', i, s.loc), s.loc),
          s.loc
        ),
        s.loc
      )
    )
  })

  if (ast.where) {
    fnBody.push(e('if', e('!', comp(ast.where)), e('return', e('obj', { match: e(false) }))))
  }

  if (ast.aggregator) {
    fnBody.push(e(';',
      e('=',
        e('id', '$state', ast.aggregator.loc),
        e('acall',
          e('id', '$ctx.krl.aggregateEvent', ast.aggregator.loc),
          [
            e('id', '$state', ast.aggregator.loc),
            e('string', ast.aggregator.op, ast.aggregator.loc),
            e('array', _.map(ast.aggregator.args, function (a, i) {
              comp.scope.set(a.value, { type: 'Unknown' })
              comp.scope.get('$selectVars').push(a.value)
              return e('array', [
                e('string', a.value, a.loc),
                e('get', e('id', 'matches', a.loc), e('num', i, a.loc), a.loc)
              ], a.loc)
            }), ast.aggregator.loc)
          ],
          ast.aggregator.loc
        ), ast.aggregator.loc
      ), ast.aggregator.loc))
  }

  const ee = [
    e('str', `${ast.event_domain.value}:${ast.event_type.value}`)
  ]

  if (fnBody.length > 0) {
    fnBody.push(e('return', e('obj', {
      match: e(true),
      state: _.isEmpty(ast.event_attrs)
        ? e('id', '$state')
        : e('call', e('id', 'Object.assign'), [
          e('obj', {}),
          e('id', '$state'),
          e('obj', {
            setting: e('call', e('id', 'Object.assign'), [
              e('obj', {}),
              e('||', e('id', '$state.setting'), e('obj', {})),
              e('id', 'setting')
            ])
          })
        ])
    })))
    ee.push(e('asyncfn', ['$event', '$state'], fnBody))
  }

  return e('call', e('id', '$ctx.krl.SelectWhen.e'), ee)
}
