var getName = function (ctx) {
  return ctx.db.getEntVarFuture(ctx.pico.id, 'name').wait();
};
var getAppVar = function (ctx) {
  return ctx.db.getAppVarFuture(ctx.rid, 'appvar').wait();
};
module.exports = {
  'name': 'io.picolabs.persistent',
  'meta': {
    'shares': {
      'getName': getName,
      'getAppVar': getAppVar
    }
  },
  'rules': {
    'store_my_name': {
      'name': 'store_my_name',
      'select': {
        'graph': { 'store': { 'name': { 'expr_0': true } } },
        'eventexprs': {
          'expr_0': function (ctx) {
            var matches = [];
            var m;
            m = new RegExp('^(.*)$', '').exec(ctx.event.attrs['name']);
            if (!m)
              return false;
            if (m.length > 1)
              matches.push(m[1]);
            ctx.vars.my_name = matches[0];
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
              'options': { 'name': ctx.vars.my_name }
            };
          }]
      },
      'postlude': {
        'fired': undefined,
        'notfired': undefined,
        'always': function (ctx) {
          return ctx.db.putEntVarFuture(ctx.pico.id, 'name', ctx.vars.my_name).wait();
        }
      }
    },
    'store_appvar': {
      'name': 'store_appvar',
      'select': {
        'graph': { 'store': { 'appvar': { 'expr_0': true } } },
        'eventexprs': {
          'expr_0': function (ctx) {
            var matches = [];
            var m;
            m = new RegExp('^(.*)$', '').exec(ctx.event.attrs['appvar']);
            if (!m)
              return false;
            if (m.length > 1)
              matches.push(m[1]);
            ctx.vars.my_name = matches[0];
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
              'options': { 'appvar': ctx.vars.my_name }
            };
          }]
      },
      'postlude': {
        'fired': undefined,
        'notfired': undefined,
        'always': function (ctx) {
          return ctx.db.putAppVarFuture(ctx.rid, 'appvar', ctx.vars.my_name).wait();
        }
      }
    }
  }
};
