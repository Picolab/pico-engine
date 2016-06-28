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
      }
    },
    'and_op': {
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
              'state_0'
            ],
            [
              'expr_1',
              'state_1'
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
          ],
          'state_0': [
            [
              'expr_1',
              'end'
            ],
            [
              [
                'not',
                'expr_1'
              ],
              'state_0'
            ]
          ],
          'state_1': [
            [
              'expr_0',
              'end'
            ],
            [
              [
                'not',
                'expr_0'
              ],
              'state_1'
            ]
          ]
        }
      }
    },
    'and_or': {
      'select': {
        'graph': {
          'echo': {
            'a': { 'expr_0': true },
            'b': { 'expr_1': true },
            'c': { 'expr_2': true }
          }
        },
        'eventexprs': {
          'expr_0': function (ctx, callback) {
            callback(undefined, ctx.event.domain === 'echo' && ctx.event.type === 'a');
          },
          'expr_1': function (ctx, callback) {
            callback(undefined, ctx.event.domain === 'echo' && ctx.event.type === 'b');
          },
          'expr_2': function (ctx, callback) {
            callback(undefined, ctx.event.domain === 'echo' && ctx.event.type === 'c');
          }
        },
        'state_machine': {
          'start': [
            [
              'expr_0',
              'state_0'
            ],
            [
              'expr_1',
              'state_1'
            ],
            [
              'expr_2',
              'end'
            ],
            [
              [
                'not',
                [
                  'or',
                  'expr_0',
                  [
                    'or',
                    'expr_1',
                    'expr_2'
                  ]
                ]
              ],
              'start'
            ]
          ],
          'state_0': [
            [
              'expr_1',
              'end'
            ],
            [
              [
                'not',
                'expr_1'
              ],
              'state_0'
            ]
          ],
          'state_1': [
            [
              'expr_0',
              'end'
            ],
            [
              [
                'not',
                'expr_0'
              ],
              'state_1'
            ]
          ]
        }
      }
    }
  }
};
