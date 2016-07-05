module.exports = {
  'name': 'io.picolabs.methods',
  'meta': {},
  'rules': {
    'methods_capitalize': {
      'name': 'methods_capitalize',
      'select': {
        'graph': { 'methods': { 'capitalize': { 'expr_0': true } } },
        'eventexprs': {
          'expr_0': function (ctx) {
            return true;
          }
        },
        'state_machine': {
          'start': [
            [
              'expr_0',
              'end'
            ],
            [
              [
                'not',
                'expr_0'
              ],
              'start'
            ]
          ]
        }
      },
      'action_block': {
        'actions': [function (ctx) {
            return {
              'type': 'directive',
              'name': 'say',
              'options': { 'something': 'Hello World'['capitalize'](ctx, []) }
            };
          }]
      }
    }
  }
};
