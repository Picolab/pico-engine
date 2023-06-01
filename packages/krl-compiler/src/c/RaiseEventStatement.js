module.exports = function (ast, comp, e) {
  // TODO ?? for_rid: ast.for_rid ? comp(ast.for_rid) : e('nil')
  const attrs = ast.event_attrs ? comp(ast.event_attrs) : e('nil')

  if (ast.event_domainAndType) {
    // TODO
    return e('block', [
      e(
        'let',
        e('id', '$parts'),
        e(
          'call',
          e(
            '.',
            e(
              'call',
              e(
                '.',
                e('call', e('id', '$ctx.krl.toString'), [
                  comp(ast.event_domainAndType)
                ]),
                e('id', 'replace')
              ),
              [
                {
                  type: 'Literal',
                  regex: {
                    pattern: '\\s+',
                    flags: 'g'
                  }
                },
                e('str', '')
              ]
            ),
            e('id', 'split')
          ),
          [e('str', ':')]
        )
      ),
      e(
        ';',
        e('acall', e('id', '$ctx.rsCtx.raiseEvent'), [
          e('get', e('id', '$parts'), e('num', 0)),
          e(
            'call',
            e(
              '.',
              e('call', e('.', e('id', '$parts'), e('id', 'slice')), [
                e('num', 1)
              ]),
              e('id', 'join')
            ),
            [e('str', ':')]
          ),
          attrs
        ])
      )
    ])
  }

  return e(
    ';',
    e('acall', e('id', '$ctx.rsCtx.raiseEvent'), [
      e('string', ast.event_domain.value, ast.event_domain.loc),
      comp(ast.event_type),
      attrs
    ])
  )
}
