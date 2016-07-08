module.exports = {
  'name': 'io.picolabs.scope',
  'meta': {
    'name': 'testing scope',
    'shares': [
      'g0',
      'g1',
      'getVals',
      'add'
    ]
  },
  'global': function (ctx) {
    ctx.scope.set('g0', new ctx.krl.String('global 0'));
    ctx.scope.set('g1', new ctx.krl.Number(1));
    ctx.scope.set('getVals', ctx.krl.Closure(ctx, function (ctx) {
      return {
        'name': ctx.persistent.getEnt('ent_var_name'),
        'p0': ctx.persistent.getEnt('ent_var_p0'),
        'p1': ctx.persistent.getEnt('ent_var_p1')
      };
    }));
    ctx.scope.set('add', ctx.krl.Closure(ctx, function (ctx) {
      ctx.scope.set('a', ctx.getArg(ctx.args, 'a', 0));
      ctx.scope.set('b', ctx.getArg(ctx.args, 'b', 1));
      return ctx.krl.stdlib['+'](ctx.scope.get('a'), ctx.scope.get('b'));
    }));
    ctx.scope.set('incByN', ctx.krl.Closure(ctx, function (ctx) {
      ctx.scope.set('n', ctx.getArg(ctx.args, 'n', 0));
      return ctx.krl.Closure(ctx, function (ctx) {
        ctx.scope.set('a', ctx.getArg(ctx.args, 'a', 0));
        return ctx.krl.stdlib['+'](ctx.scope.get('a'), ctx.scope.get('n'));
      });
    }));
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
            var matches = ctx.event.getAttrMatches([[
                'name',
                new ctx.krl.RegExp('^(.*)$', '')
              ]]);
            if (!matches)
              return false;
            ctx.scope.set('my_name', new ctx.krl.String(matches[0]));
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
            var matches = ctx.event.getAttrMatches([[
                'name',
                new ctx.krl.RegExp('^(.*)$', '')
              ]]);
            if (!matches)
              return false;
            ctx.scope.set('name', new ctx.krl.String(matches[0]));
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
        ctx.scope.set('p0', new ctx.krl.String('prelude 0'));
        ctx.scope.set('p1', new ctx.krl.String('prelude 1'));
      },
      'action_block': {
        'actions': [function (ctx) {
            return {
              'type': 'directive',
              'name': 'say',
              'options': {
                'name': ctx.scope.get('name'),
                'p0': ctx.scope.get('p0'),
                'p1': ctx.scope.get('p1'),
                'g0': ctx.scope.get('g0')
              }
            };
          }]
      },
      'postlude': {
        'fired': undefined,
        'notfired': undefined,
        'always': function (ctx) {
          ctx.persistent.putEnt('ent_var_name', ctx.scope.get('name'));
          ctx.persistent.putEnt('ent_var_p0', ctx.scope.get('p0'));
          ctx.persistent.putEnt('ent_var_p1', ctx.scope.get('p1'));
        }
      }
    },
    'functions': {
      'name': 'functions',
      'select': {
        'graph': { 'scope': { 'functions': { 'expr_0': true } } },
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
      'prelude': function (ctx) {
        ctx.scope.set('g0', new ctx.krl.String('overrided g0!'));
        ctx.scope.set('inc5', ctx.scope.get('incByN')(ctx, [new ctx.krl.Number(5)]));
      },
      'action_block': {
        'actions': [function (ctx) {
            return {
              'type': 'directive',
              'name': 'say',
              'options': {
                'add_one_two': ctx.scope.get('add')(ctx, [
                  new ctx.krl.Number(1),
                  new ctx.krl.Number(2)
                ]),
                'inc5_3': ctx.scope.get('inc5')(ctx, [new ctx.krl.Number(3)]),
                'g0': ctx.scope.get('g0')
              }
            };
          }]
      }
    }
  }
};
