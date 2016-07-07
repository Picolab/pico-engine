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
    ctx.scope.set('g0', ctx.krl.String('global 0'));
    ctx.scope.set('g1', 1);
    ctx.scope.set('getVals', ctx.krl.Closure(ctx, function (ctx) {
      return {
        'name': ctx.krl.toKRL(ctx.db.getEntVarFuture(ctx.pico.id, 'ent_var_name').wait()),
        'p0': ctx.krl.toKRL(ctx.db.getEntVarFuture(ctx.pico.id, 'ent_var_p0').wait()),
        'p1': ctx.krl.toKRL(ctx.db.getEntVarFuture(ctx.pico.id, 'ent_var_p1').wait())
      };
    }));
    ctx.scope.set('add', ctx.krl.Closure(ctx, function (ctx) {
      ctx.scope.set('a', ctx.getArg(ctx.args, 'a', 0));
      ctx.scope.set('b', ctx.getArg(ctx.args, 'b', 1));
      return ctx.scope.get('a') + ctx.scope.get('b');
    }));
    ctx.scope.set('incByN', ctx.krl.Closure(ctx, function (ctx) {
      ctx.scope.set('n', ctx.getArg(ctx.args, 'n', 0));
      return ctx.krl.Closure(ctx, function (ctx) {
        ctx.scope.set('a', ctx.getArg(ctx.args, 'a', 0));
        return ctx.scope.get('a') + ctx.scope.get('n');
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
            var matches = [];
            var m;
            m = new RegExp('^(.*)$', '').exec(ctx.event.attrs['name'] || '');
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
            m = new RegExp('^(.*)$', '').exec(ctx.event.attrs['name'] || '');
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
        ctx.scope.set('p0', ctx.krl.String('prelude 0'));
        ctx.scope.set('p1', ctx.krl.String('prelude 1'));
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
          ctx.db.putEntVarFuture(ctx.pico.id, 'ent_var_name', ctx.krl.toJS(ctx.scope.get('name'))).wait();
          ctx.db.putEntVarFuture(ctx.pico.id, 'ent_var_p0', ctx.krl.toJS(ctx.scope.get('p0'))).wait();
          ctx.db.putEntVarFuture(ctx.pico.id, 'ent_var_p1', ctx.krl.toJS(ctx.scope.get('p1'))).wait();
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
        ctx.scope.set('g0', ctx.krl.String('overrided g0!'));
        ctx.scope.set('inc5', ctx.scope.get('incByN')(ctx, [5]));
      },
      'action_block': {
        'actions': [function (ctx) {
            return {
              'type': 'directive',
              'name': 'say',
              'options': {
                'add_one_two': ctx.scope.get('add')(ctx, [
                  1,
                  2
                ]),
                'inc5_3': ctx.scope.get('inc5')(ctx, [3]),
                'g0': ctx.scope.get('g0')
              }
            };
          }]
      }
    }
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJ1bGVzZXQgaW8ucGljb2xhYnMuc2NvcGUge1xuICBtZXRhIHtcbiAgICBuYW1lIFwidGVzdGluZyBzY29wZVwiXG4gICAgc2hhcmVzIGcwLCBnMSwgZ2V0VmFscywgYWRkXG4gIH1cbiAgZ2xvYmFsIHtcbiAgICBnMCA9IFwiZ2xvYmFsIDBcIiBcbiAgICBnMSA9IDFcbiAgICBnZXRWYWxzID0gZnVuY3Rpb24oKXtcbiAgICAgIHtcbiAgICAgICAgXCJuYW1lXCI6IGVudDplbnRfdmFyX25hbWUsXG4gICAgICAgIFwicDBcIjogZW50OmVudF92YXJfcDAsXG4gICAgICAgIFwicDFcIjogZW50OmVudF92YXJfcDFcbiAgICAgIH1cbiAgICB9XG4gICAgYWRkID0gZnVuY3Rpb24oYSwgYil7XG4gICAgICBhICsgYlxuICAgIH1cbiAgICBpbmNCeU4gPSBmdW5jdGlvbihuKXtcbiAgICAgIGZ1bmN0aW9uKGEpe1xuICAgICAgICBhICsgblxuICAgICAgfVxuICAgIH1cbiAgfVxuICBydWxlIGV2ZW50ZXgge1xuICAgIHNlbGVjdCB3aGVuXG4gICAgICBzY29wZSBldmVudDAgbmFtZSByZSNeKC4qKSQjIHNldHRpbmcobXlfbmFtZSlcbiAgICAgIG9yXG4gICAgICBzY29wZSBldmVudDE7XG4gICAgc2VuZF9kaXJlY3RpdmUoXCJzYXlcIikgd2l0aFxuICAgICAgbmFtZSA9IG15X25hbWVcbiAgfVxuICBydWxlIHByZWx1ZGVfc2NvcGUge1xuICAgIHNlbGVjdCB3aGVuIHNjb3BlIHByZWx1ZGUgbmFtZSByZSNeKC4qKSQjIHNldHRpbmcobmFtZSk7XG5cbiAgICBwcmUge1xuICAgICAgcDAgPSBcInByZWx1ZGUgMFwiXG4gICAgICBwMSA9IFwicHJlbHVkZSAxXCJcbiAgICB9XG5cbiAgICBzZW5kX2RpcmVjdGl2ZShcInNheVwiKSB3aXRoXG4gICAgICBuYW1lID0gbmFtZVxuICAgICAgcDAgPSBwMFxuICAgICAgcDEgPSBwMVxuICAgICAgZzAgPSBnMFxuXG4gICAgYWx3YXlzIHtcbiAgICAgIGVudDplbnRfdmFyX25hbWUgPSBuYW1lO1xuICAgICAgZW50OmVudF92YXJfcDAgPSBwMDtcbiAgICAgIGVudDplbnRfdmFyX3AxID0gcDFcbiAgICB9XG4gIH1cbiAgcnVsZSBmdW5jdGlvbnMge1xuICAgIHNlbGVjdCB3aGVuIHNjb3BlIGZ1bmN0aW9ucztcblxuICAgIHByZSB7XG4gICAgICBnMCA9IFwib3ZlcnJpZGVkIGcwIVwiXG4gICAgICBpbmM1ID0gaW5jQnlOKDUpXG4gICAgfVxuXG4gICAgc2VuZF9kaXJlY3RpdmUoXCJzYXlcIikgd2l0aFxuICAgICAgYWRkX29uZV90d28gPSBhZGQoMSwgMilcbiAgICAgIGluYzVfMyA9IGluYzUoMylcbiAgICAgIGcwID0gZzBcbiAgfVxufSIsImlvLnBpY29sYWJzLnNjb3BlIiwibmFtZSIsIm5hbWUgXCJ0ZXN0aW5nIHNjb3BlXCIiLCJcInRlc3Rpbmcgc2NvcGVcIiIsInNoYXJlcyIsInNoYXJlcyBnMCwgZzEsIGdldFZhbHMsIGFkZCIsImcwIiwiZzEiLCJnZXRWYWxzIiwiYWRkIiwiZzAgPSBcImdsb2JhbCAwXCIiLCJcImdsb2JhbCAwXCIiLCJnMSA9IDEiLCIxIiwiZ2V0VmFscyA9IGZ1bmN0aW9uKCl7XG4gICAgICB7XG4gICAgICAgIFwibmFtZVwiOiBlbnQ6ZW50X3Zhcl9uYW1lLFxuICAgICAgICBcInAwXCI6IGVudDplbnRfdmFyX3AwLFxuICAgICAgICBcInAxXCI6IGVudDplbnRfdmFyX3AxXG4gICAgICB9XG4gICAgfSIsImZ1bmN0aW9uKCl7XG4gICAgICB7XG4gICAgICAgIFwibmFtZVwiOiBlbnQ6ZW50X3Zhcl9uYW1lLFxuICAgICAgICBcInAwXCI6IGVudDplbnRfdmFyX3AwLFxuICAgICAgICBcInAxXCI6IGVudDplbnRfdmFyX3AxXG4gICAgICB9XG4gICAgfSIsIntcbiAgICAgICAgXCJuYW1lXCI6IGVudDplbnRfdmFyX25hbWUsXG4gICAgICAgIFwicDBcIjogZW50OmVudF92YXJfcDAsXG4gICAgICAgIFwicDFcIjogZW50OmVudF92YXJfcDFcbiAgICAgIH0iLCJcIm5hbWVcIiIsIlwibmFtZVwiOiBlbnQ6ZW50X3Zhcl9uYW1lIiwiZW50OmVudF92YXJfbmFtZSIsIlwicDBcIiIsIlwicDBcIjogZW50OmVudF92YXJfcDAiLCJlbnQ6ZW50X3Zhcl9wMCIsIlwicDFcIiIsIlwicDFcIjogZW50OmVudF92YXJfcDEiLCJlbnQ6ZW50X3Zhcl9wMSIsImFkZCA9IGZ1bmN0aW9uKGEsIGIpe1xuICAgICAgYSArIGJcbiAgICB9IiwiZnVuY3Rpb24oYSwgYil7XG4gICAgICBhICsgYlxuICAgIH0iLCJhIiwiYiIsImEgKyBiIiwiaW5jQnlOID0gZnVuY3Rpb24obil7XG4gICAgICBmdW5jdGlvbihhKXtcbiAgICAgICAgYSArIG5cbiAgICAgIH1cbiAgICB9IiwiaW5jQnlOIiwiZnVuY3Rpb24obil7XG4gICAgICBmdW5jdGlvbihhKXtcbiAgICAgICAgYSArIG5cbiAgICAgIH1cbiAgICB9IiwibiIsImZ1bmN0aW9uKGEpe1xuICAgICAgICBhICsgblxuICAgICAgfSIsImEgKyBuIiwicnVsZSBldmVudGV4IHtcbiAgICBzZWxlY3Qgd2hlblxuICAgICAgc2NvcGUgZXZlbnQwIG5hbWUgcmUjXiguKikkIyBzZXR0aW5nKG15X25hbWUpXG4gICAgICBvclxuICAgICAgc2NvcGUgZXZlbnQxO1xuICAgIHNlbmRfZGlyZWN0aXZlKFwic2F5XCIpIHdpdGhcbiAgICAgIG5hbWUgPSBteV9uYW1lXG4gIH0iLCJldmVudGV4Iiwic2VsZWN0IHdoZW5cbiAgICAgIHNjb3BlIGV2ZW50MCBuYW1lIHJlI14oLiopJCMgc2V0dGluZyhteV9uYW1lKVxuICAgICAgb3JcbiAgICAgIHNjb3BlIGV2ZW50MSIsInNjb3BlIGV2ZW50MCBuYW1lIHJlI14oLiopJCMgc2V0dGluZyhteV9uYW1lKSIsIm5hbWUgcmUjXiguKikkIyIsInJlI14oLiopJCMiLCJteV9uYW1lIiwic2NvcGUgZXZlbnQxIiwic2VuZF9kaXJlY3RpdmUoXCJzYXlcIikgd2l0aFxuICAgICAgbmFtZSA9IG15X25hbWUiLCJydWxlIHByZWx1ZGVfc2NvcGUge1xuICAgIHNlbGVjdCB3aGVuIHNjb3BlIHByZWx1ZGUgbmFtZSByZSNeKC4qKSQjIHNldHRpbmcobmFtZSk7XG5cbiAgICBwcmUge1xuICAgICAgcDAgPSBcInByZWx1ZGUgMFwiXG4gICAgICBwMSA9IFwicHJlbHVkZSAxXCJcbiAgICB9XG5cbiAgICBzZW5kX2RpcmVjdGl2ZShcInNheVwiKSB3aXRoXG4gICAgICBuYW1lID0gbmFtZVxuICAgICAgcDAgPSBwMFxuICAgICAgcDEgPSBwMVxuICAgICAgZzAgPSBnMFxuXG4gICAgYWx3YXlzIHtcbiAgICAgIGVudDplbnRfdmFyX25hbWUgPSBuYW1lO1xuICAgICAgZW50OmVudF92YXJfcDAgPSBwMDtcbiAgICAgIGVudDplbnRfdmFyX3AxID0gcDFcbiAgICB9XG4gIH0iLCJwcmVsdWRlX3Njb3BlIiwic2VsZWN0IHdoZW4gc2NvcGUgcHJlbHVkZSBuYW1lIHJlI14oLiopJCMgc2V0dGluZyhuYW1lKSIsInNjb3BlIHByZWx1ZGUgbmFtZSByZSNeKC4qKSQjIHNldHRpbmcobmFtZSkiLCJwMCA9IFwicHJlbHVkZSAwXCIiLCJwMCIsIlwicHJlbHVkZSAwXCIiLCJwMSA9IFwicHJlbHVkZSAxXCIiLCJwMSIsIlwicHJlbHVkZSAxXCIiLCJzZW5kX2RpcmVjdGl2ZShcInNheVwiKSB3aXRoXG4gICAgICBuYW1lID0gbmFtZVxuICAgICAgcDAgPSBwMFxuICAgICAgcDEgPSBwMVxuICAgICAgZzAgPSBnMCIsImFsd2F5cyB7XG4gICAgICBlbnQ6ZW50X3Zhcl9uYW1lID0gbmFtZTtcbiAgICAgIGVudDplbnRfdmFyX3AwID0gcDA7XG4gICAgICBlbnQ6ZW50X3Zhcl9wMSA9IHAxXG4gICAgfSIsImVudDplbnRfdmFyX25hbWUgPSBuYW1lIiwiZW50OmVudF92YXJfcDAgPSBwMCIsImVudDplbnRfdmFyX3AxID0gcDEiLCJydWxlIGZ1bmN0aW9ucyB7XG4gICAgc2VsZWN0IHdoZW4gc2NvcGUgZnVuY3Rpb25zO1xuXG4gICAgcHJlIHtcbiAgICAgIGcwID0gXCJvdmVycmlkZWQgZzAhXCJcbiAgICAgIGluYzUgPSBpbmNCeU4oNSlcbiAgICB9XG5cbiAgICBzZW5kX2RpcmVjdGl2ZShcInNheVwiKSB3aXRoXG4gICAgICBhZGRfb25lX3R3byA9IGFkZCgxLCAyKVxuICAgICAgaW5jNV8zID0gaW5jNSgzKVxuICAgICAgZzAgPSBnMFxuICB9IiwiZnVuY3Rpb25zIiwic2VsZWN0IHdoZW4gc2NvcGUgZnVuY3Rpb25zIiwic2NvcGUgZnVuY3Rpb25zIiwiZzAgPSBcIm92ZXJyaWRlZCBnMCFcIiIsIlwib3ZlcnJpZGVkIGcwIVwiIiwiaW5jNSA9IGluY0J5Tig1KSIsImluYzUiLCJpbmNCeU4oNSkiLCI1Iiwic2VuZF9kaXJlY3RpdmUoXCJzYXlcIikgd2l0aFxuICAgICAgYWRkX29uZV90d28gPSBhZGQoMSwgMilcbiAgICAgIGluYzVfMyA9IGluYzUoMylcbiAgICAgIGcwID0gZzAiLCJhZGQoMSwgMikiLCIyIiwiaW5jNSgzKSIsIjMiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0cyIsImN0eCIsInNjb3BlIiwic2V0Iiwia3JsIiwiU3RyaW5nIiwiQ2xvc3VyZSIsImRiIiwiZ2V0RW50VmFyRnV0dXJlIiwicGljbyIsImlkIiwid2FpdCIsImdldEFyZyIsImFyZ3MiLCJnZXQiLCJtYXRjaGVzIiwibSIsIlJlZ0V4cCIsImV4ZWMiLCJldmVudCIsImF0dHJzIiwibGVuZ3RoIiwicHVzaCIsInVuZGVmaW5lZCIsInB1dEVudFZhckZ1dHVyZSJdLCJtYXBwaW5ncyI6IkFBQUFBLE1BQUEsQ0FBQUMsT0FBQTtBQUFBLEUsUUNBUSxtQkRBUjtBQUFBLEUsUUFBQTtBQUFBLElFRUksTUNBQSxFQ0FLLGVKRlQ7QUFBQSxJS0dJLFFDQUE7QUFBQSxNQ0FPLElEQVA7QUFBQSxNRUFXLElGQVg7QUFBQSxNR0FlLFNIQWY7QUFBQSxN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QSxHQUFBLENBQUFDLEtBQUEsQ0FBQVksR0FBQSxNaUVIUDtBQUFBO0FBQUE7QUFBQTtBQUFBLE9WUkY7QUFBQSxLOURwREY7QUFBQTtBQUFBIiwic291cmNlc0NvbnRlbnQiOltudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGxdfQ==
