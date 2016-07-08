module.exports = {
  'name': 'io.picolabs.persistent',
  'meta': {
    'shares': [
      'getName',
      'getAppVar'
    ]
  },
  'global': function (ctx) {
    ctx.scope.set('getName', ctx.krl.Closure(ctx, function (ctx) {
      return ctx.persistent.getEnt('name');
    }));
    ctx.scope.set('getAppVar', ctx.krl.Closure(ctx, function (ctx) {
      return ctx.persistent.getApp('appvar');
    }));
  },
  'rules': {
    'store_my_name': {
      'name': 'store_my_name',
      'select': {
        'graph': { 'store': { 'name': { 'expr_0': true } } },
        'eventexprs': {
          'expr_0': function (ctx) {
            var matches = ctx.event.getAttrMatches([[
                'name',
                new RegExp('^(.*)$', '')
              ]]);
            if (!matches)
              return false;
            ctx.scope.set('my_name', matches[0]);
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
              'name': 'store_name',
              'options': { 'name': ctx.scope.get('my_name') }
            };
          }]
      },
      'postlude': {
        'fired': undefined,
        'notfired': undefined,
        'always': function (ctx) {
          ctx.persistent.putEnt('name', ctx.scope.get('my_name'));
        }
      }
    },
    'store_appvar': {
      'name': 'store_appvar',
      'select': {
        'graph': { 'store': { 'appvar': { 'expr_0': true } } },
        'eventexprs': {
          'expr_0': function (ctx) {
            var matches = ctx.event.getAttrMatches([[
                'appvar',
                new RegExp('^(.*)$', '')
              ]]);
            if (!matches)
              return false;
            ctx.scope.set('my_appvar', matches[0]);
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
              'name': 'store_appvar',
              'options': { 'appvar': ctx.scope.get('my_appvar') }
            };
          }]
      },
      'postlude': {
        'fired': undefined,
        'notfired': undefined,
        'always': function (ctx) {
          ctx.persistent.putApp('appvar', ctx.scope.get('my_appvar'));
        }
      }
    }
  }
};