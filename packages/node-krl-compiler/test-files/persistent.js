var getName = function (ctx, callback) {
  ctx.db.getEntVar(ctx.pico.id, 'name', callback);
};
var getAppVar = function (ctx, callback) {
  ctx.db.getAppVar(ctx.rid, 'appvar', callback);
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
          'expr_0': function (ctx, callback) {
            var matches = [];
            var m;
            m = new RegExp('^(.*)$', '').exec(ctx.event.attrs['name']);
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
      },
      'postlude': {
        'fired': undefined,
        'notfired': undefined,
        'always': function (ctx, callback) {
          ctx.db.putEntVar(ctx.pico.id, 'name', ctx.vars.my_name, callback);
        }
      }
    },
    'store_appvar': {
      'name': 'store_appvar',
      'select': {
        'graph': { 'store': { 'appvar': { 'expr_0': true } } },
        'eventexprs': {
          'expr_0': function (ctx, callback) {
            var matches = [];
            var m;
            m = new RegExp('^(.*)$', '').exec(ctx.event.attrs['appvar']);
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
              'name': 'store_appvar',
              'options': { 'appvar': ctx.vars.my_name }
            });
          }]
      },
      'postlude': {
        'fired': undefined,
        'notfired': undefined,
        'always': function (ctx, callback) {
          ctx.db.putAppVar(ctx.rid, 'appvar', ctx.vars.my_name, callback);
        }
      }
    }
  }
};
