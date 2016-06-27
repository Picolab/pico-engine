module.exports = {
  'name': 'io.picolabs.events',
  'meta': {},
  'rules': {
    'or_op': {
      'select': {
        'graph': {
          'echo': { 'hello': { 'expr_0': true } },
          'say': { 'hello': { 'expr_1': true } }
        },
        'eventexprs': {
          'expr_0': function (ctx, callback) {
            callback(undefined, ctx.event.domain === 'echo' && ctx.event.type === 'hello');
          },
          'expr_1': function (ctx, callback) {
            callback(undefined, ctx.event.domain === 'say' && ctx.event.type === 'hello');
          }
        },
        'state_machine': {
          'start': [
            [
              'expr_0',
              'end'
            ],
            [
              'expr_1',
              'end'
            ],
            [
              [
                'not',
                [
                  'or',
                  'expr_0',
                  'expr_1'
                ]
              ],
              'start'
            ]
          ]
        }
      },
      'action': undefined
    }
  }
};
