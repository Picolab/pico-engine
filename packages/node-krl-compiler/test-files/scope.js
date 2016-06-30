module.exports = {
  'name': 'io.picolabs.scope',
  'meta': { 'name': 'testing scope' },
  'global': function (ctx) {
    ctx.scope.set('g0', 'global 0');
    ctx.scope.set('getVals', function (ctx) {
      return {
        'name': ctx.db.getEntVarFuture(ctx.pico.id, 'ent_var_name').wait(),
        'p0': ctx.db.getEntVarFuture(ctx.pico.id, 'ent_var_p0').wait(),
        'p1': ctx.db.getEntVarFuture(ctx.pico.id, 'ent_var_p1').wait()
      };
    });
  },
  'rules': {
    'eventex': {
      'name': 'eventex',
      'select': {
        'graph': {
          'scope': {
            'event0': { 'expr_0': true },
            'event1': { 'expr_1': true }
          }
        },
        'eventexprs': {
          'expr_0': function (ctx) {
            var matches = [];
            var m;
            m = new RegExp('^(.*)$', '').exec(ctx.event.attrs['name']);
            if (!m)
              return false;
            if (m.length > 1)
              matches.push(m[1]);
            ctx.scope.set('my_name', matches[0]);
            return true;
          },
          'expr_1': function (ctx) {
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
      'action_block': {
        'actions': [function (ctx) {
            return {
              'type': 'directive',
              'name': 'say',
              'options': { 'name': ctx.scope.get('my_name') }
            };
          }]
      }
    },
    'prelude_scope': {
      'name': 'prelude_scope',
      'select': {
        'graph': { 'scope': { 'prelude': { 'expr_0': true } } },
        'eventexprs': {
          'expr_0': function (ctx) {
            var matches = [];
            var m;
            m = new RegExp('^(.*)$', '').exec(ctx.event.attrs['name']);
            if (!m)
              return false;
            if (m.length > 1)
              matches.push(m[1]);
            ctx.scope.set('name', matches[0]);
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
      'prelude': function (ctx) {
        ctx.scope.set('p0', 'prelude 0');
        ctx.scope.set('p1', 'prelude 1');
      },
      'action_block': {
        'actions': [function (ctx) {
            return {
              'type': 'directive',
              'name': 'say',
              'options': {
                'name': ctx.scope.get('name'),
                'p0': ctx.scope.get('p0'),
                'p1': ctx.scope.get('p1')
              }
            };
          }]
      },
      'postlude': {
        'fired': undefined,
        'notfired': undefined,
        'always': function (ctx) {
          ctx.db.putEntVarFuture(ctx.pico.id, 'ent_var_name', ctx.scope.get('name')).wait();
          ctx.db.putEntVarFuture(ctx.pico.id, 'ent_var_p0', ctx.scope.get('p0')).wait();
          ctx.db.putEntVarFuture(ctx.pico.id, 'ent_var_p1', ctx.scope.get('p1')).wait();
        }
      }
    }
  }
};
