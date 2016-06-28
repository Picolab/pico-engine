var read = function (obj) {
  return 'TODO';
};
module.exports = {
  'name': 'io.picolabs.persistent',
  'meta': { 'shares': { 'read': read } },
  'rules': {
    'store_my_name': {
      'select': {
        'graph': { 'echo': { 'hello': { 'expr_0': true } } },
        'eventexprs': {
          'expr_0': function (ctx, callback) {
            var matches = [];
            var m;
            m = new RegExp('^(.*)$', '').exec(ctx.event.attrs.$name$);
            if (!m)
              return callback(undefined, false);
            if (m.length > 1)
              matches.push(m[1]);
            ctx.vars.my_name = matches[0];
            callback(undefined, true);
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
        'actions': [function (ctx, callback) {
            callback(undefined, {
              'type': 'directive',
              'name': 'store_name',
              'options': { 'name': ctx.vars.my_name }
            });
          }]
      }
    }
  }
};
