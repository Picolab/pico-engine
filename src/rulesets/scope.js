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
    ctx.scope.set('g0', 'global 0');
    ctx.scope.set('g1', 1);
    ctx.scope.set('getVals', ctx.mk.Closure(ctx, function (ctx) {
      return {
        'name': ctx.db.getEntVarFuture(ctx.pico.id, 'ent_var_name').wait(),
        'p0': ctx.db.getEntVarFuture(ctx.pico.id, 'ent_var_p0').wait(),
        'p1': ctx.db.getEntVarFuture(ctx.pico.id, 'ent_var_p1').wait()
      };
    }));
    ctx.scope.set('add', ctx.mk.Closure(ctx, function (ctx) {
      ctx.scope.set('a', ctx.getArg(ctx.args, 'a', 0));
      ctx.scope.set('b', ctx.getArg(ctx.args, 'b', 1));
      return ctx.scope.get('a') + ctx.scope.get('b');
    }));
    ctx.scope.set('incByN', ctx.mk.Closure(ctx, function (ctx) {
      ctx.scope.set('n', ctx.getArg(ctx.args, 'n', 0));
      return ctx.mk.Closure(ctx, function (ctx) {
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
          ctx.db.putEntVarFuture(ctx.pico.id, 'ent_var_name', ctx.scope.get('name')).wait();
          ctx.db.putEntVarFuture(ctx.pico.id, 'ent_var_p0', ctx.scope.get('p0')).wait();
          ctx.db.putEntVarFuture(ctx.pico.id, 'ent_var_p1', ctx.scope.get('p1')).wait();
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
        ctx.scope.set('g0', 'overrided g0!');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJ1bGVzZXQgaW8ucGljb2xhYnMuc2NvcGUge1xuICBtZXRhIHtcbiAgICBuYW1lIFwidGVzdGluZyBzY29wZVwiXG4gICAgc2hhcmVzIGcwLCBnMSwgZ2V0VmFscywgYWRkXG4gIH1cbiAgZ2xvYmFsIHtcbiAgICBnMCA9IFwiZ2xvYmFsIDBcIiBcbiAgICBnMSA9IDFcbiAgICBnZXRWYWxzID0gZnVuY3Rpb24oKXtcbiAgICAgIHtcbiAgICAgICAgXCJuYW1lXCI6IGVudDplbnRfdmFyX25hbWUsXG4gICAgICAgIFwicDBcIjogZW50OmVudF92YXJfcDAsXG4gICAgICAgIFwicDFcIjogZW50OmVudF92YXJfcDFcbiAgICAgIH1cbiAgICB9XG4gICAgYWRkID0gZnVuY3Rpb24oYSwgYil7XG4gICAgICBhICsgYlxuICAgIH1cbiAgICBpbmNCeU4gPSBmdW5jdGlvbihuKXtcbiAgICAgIGZ1bmN0aW9uKGEpe1xuICAgICAgICBhICsgblxuICAgICAgfVxuICAgIH1cbiAgfVxuICBydWxlIGV2ZW50ZXgge1xuICAgIHNlbGVjdCB3aGVuXG4gICAgICBzY29wZSBldmVudDAgbmFtZSByZSNeKC4qKSQjIHNldHRpbmcobXlfbmFtZSlcbiAgICAgIG9yXG4gICAgICBzY29wZSBldmVudDE7XG4gICAgc2VuZF9kaXJlY3RpdmUoXCJzYXlcIikgd2l0aFxuICAgICAgbmFtZSA9IG15X25hbWVcbiAgfVxuICBydWxlIHByZWx1ZGVfc2NvcGUge1xuICAgIHNlbGVjdCB3aGVuIHNjb3BlIHByZWx1ZGUgbmFtZSByZSNeKC4qKSQjIHNldHRpbmcobmFtZSk7XG5cbiAgICBwcmUge1xuICAgICAgcDAgPSBcInByZWx1ZGUgMFwiXG4gICAgICBwMSA9IFwicHJlbHVkZSAxXCJcbiAgICB9XG5cbiAgICBzZW5kX2RpcmVjdGl2ZShcInNheVwiKSB3aXRoXG4gICAgICBuYW1lID0gbmFtZVxuICAgICAgcDAgPSBwMFxuICAgICAgcDEgPSBwMVxuICAgICAgZzAgPSBnMFxuXG4gICAgYWx3YXlzIHtcbiAgICAgIGVudDplbnRfdmFyX25hbWUgPSBuYW1lO1xuICAgICAgZW50OmVudF92YXJfcDAgPSBwMDtcbiAgICAgIGVudDplbnRfdmFyX3AxID0gcDFcbiAgICB9XG4gIH1cbiAgcnVsZSBmdW5jdGlvbnMge1xuICAgIHNlbGVjdCB3aGVuIHNjb3BlIGZ1bmN0aW9ucztcblxuICAgIHByZSB7XG4gICAgICBnMCA9IFwib3ZlcnJpZGVkIGcwIVwiXG4gICAgICBpbmM1ID0gaW5jQnlOKDUpXG4gICAgfVxuXG4gICAgc2VuZF9kaXJlY3RpdmUoXCJzYXlcIikgd2l0aFxuICAgICAgYWRkX29uZV90d28gPSBhZGQoMSwgMilcbiAgICAgIGluYzVfMyA9IGluYzUoMylcbiAgICAgIGcwID0gZzBcbiAgfVxufSIsImlvLnBpY29sYWJzLnNjb3BlIiwibmFtZSIsIm5hbWUgXCJ0ZXN0aW5nIHNjb3BlXCIiLCJcInRlc3Rpbmcgc2NvcGVcIiIsInNoYXJlcyIsInNoYXJlcyBnMCwgZzEsIGdldFZhbHMsIGFkZCIsImcwIiwiZzEiLCJnZXRWYWxzIiwiYWRkIiwiZzAgPSBcImdsb2JhbCAwXCIiLCJcImdsb2JhbCAwXCIiLCJnMSA9IDEiLCIxIiwiZ2V0VmFscyA9IGZ1bmN0aW9uKCl7XG4gICAgICB7XG4gICAgICAgIFwibmFtZVwiOiBlbnQ6ZW50X3Zhcl9uYW1lLFxuICAgICAgICBcInAwXCI6IGVudDplbnRfdmFyX3AwLFxuICAgICAgICBcInAxXCI6IGVudDplbnRfdmFyX3AxXG4gICAgICB9XG4gICAgfSIsImZ1bmN0aW9uKCl7XG4gICAgICB7XG4gICAgICAgIFwibmFtZVwiOiBlbnQ6ZW50X3Zhcl9uYW1lLFxuICAgICAgICBcInAwXCI6IGVudDplbnRfdmFyX3AwLFxuICAgICAgICBcInAxXCI6IGVudDplbnRfdmFyX3AxXG4gICAgICB9XG4gICAgfSIsIntcbiAgICAgICAgXCJuYW1lXCI6IGVudDplbnRfdmFyX25hbWUsXG4gICAgICAgIFwicDBcIjogZW50OmVudF92YXJfcDAsXG4gICAgICAgIFwicDFcIjogZW50OmVudF92YXJfcDFcbiAgICAgIH0iLCJcIm5hbWVcIiIsIlwibmFtZVwiOiBlbnQ6ZW50X3Zhcl9uYW1lIiwiZW50OmVudF92YXJfbmFtZSIsIlwicDBcIiIsIlwicDBcIjogZW50OmVudF92YXJfcDAiLCJlbnQ6ZW50X3Zhcl9wMCIsIlwicDFcIiIsIlwicDFcIjogZW50OmVudF92YXJfcDEiLCJlbnQ6ZW50X3Zhcl9wMSIsImFkZCA9IGZ1bmN0aW9uKGEsIGIpe1xuICAgICAgYSArIGJcbiAgICB9IiwiZnVuY3Rpb24oYSwgYil7XG4gICAgICBhICsgYlxuICAgIH0iLCJhIiwiYiIsImEgKyBiIiwiaW5jQnlOID0gZnVuY3Rpb24obil7XG4gICAgICBmdW5jdGlvbihhKXtcbiAgICAgICAgYSArIG5cbiAgICAgIH1cbiAgICB9IiwiaW5jQnlOIiwiZnVuY3Rpb24obil7XG4gICAgICBmdW5jdGlvbihhKXtcbiAgICAgICAgYSArIG5cbiAgICAgIH1cbiAgICB9IiwibiIsImZ1bmN0aW9uKGEpe1xuICAgICAgICBhICsgblxuICAgICAgfSIsImEgKyBuIiwicnVsZSBldmVudGV4IHtcbiAgICBzZWxlY3Qgd2hlblxuICAgICAgc2NvcGUgZXZlbnQwIG5hbWUgcmUjXiguKikkIyBzZXR0aW5nKG15X25hbWUpXG4gICAgICBvclxuICAgICAgc2NvcGUgZXZlbnQxO1xuICAgIHNlbmRfZGlyZWN0aXZlKFwic2F5XCIpIHdpdGhcbiAgICAgIG5hbWUgPSBteV9uYW1lXG4gIH0iLCJldmVudGV4Iiwic2VsZWN0IHdoZW5cbiAgICAgIHNjb3BlIGV2ZW50MCBuYW1lIHJlI14oLiopJCMgc2V0dGluZyhteV9uYW1lKVxuICAgICAgb3JcbiAgICAgIHNjb3BlIGV2ZW50MSIsInNjb3BlIGV2ZW50MCBuYW1lIHJlI14oLiopJCMgc2V0dGluZyhteV9uYW1lKSIsIm5hbWUgcmUjXiguKikkIyIsInJlI14oLiopJCMiLCJteV9uYW1lIiwic2NvcGUgZXZlbnQxIiwic2VuZF9kaXJlY3RpdmUoXCJzYXlcIikgd2l0aFxuICAgICAgbmFtZSA9IG15X25hbWUiLCJydWxlIHByZWx1ZGVfc2NvcGUge1xuICAgIHNlbGVjdCB3aGVuIHNjb3BlIHByZWx1ZGUgbmFtZSByZSNeKC4qKSQjIHNldHRpbmcobmFtZSk7XG5cbiAgICBwcmUge1xuICAgICAgcDAgPSBcInByZWx1ZGUgMFwiXG4gICAgICBwMSA9IFwicHJlbHVkZSAxXCJcbiAgICB9XG5cbiAgICBzZW5kX2RpcmVjdGl2ZShcInNheVwiKSB3aXRoXG4gICAgICBuYW1lID0gbmFtZVxuICAgICAgcDAgPSBwMFxuICAgICAgcDEgPSBwMVxuICAgICAgZzAgPSBnMFxuXG4gICAgYWx3YXlzIHtcbiAgICAgIGVudDplbnRfdmFyX25hbWUgPSBuYW1lO1xuICAgICAgZW50OmVudF92YXJfcDAgPSBwMDtcbiAgICAgIGVudDplbnRfdmFyX3AxID0gcDFcbiAgICB9XG4gIH0iLCJwcmVsdWRlX3Njb3BlIiwic2VsZWN0IHdoZW4gc2NvcGUgcHJlbHVkZSBuYW1lIHJlI14oLiopJCMgc2V0dGluZyhuYW1lKSIsInNjb3BlIHByZWx1ZGUgbmFtZSByZSNeKC4qKSQjIHNldHRpbmcobmFtZSkiLCJwMCA9IFwicHJlbHVkZSAwXCIiLCJwMCIsIlwicHJlbHVkZSAwXCIiLCJwMSA9IFwicHJlbHVkZSAxXCIiLCJwMSIsIlwicHJlbHVkZSAxXCIiLCJzZW5kX2RpcmVjdGl2ZShcInNheVwiKSB3aXRoXG4gICAgICBuYW1lID0gbmFtZVxuICAgICAgcDAgPSBwMFxuICAgICAgcDEgPSBwMVxuICAgICAgZzAgPSBnMCIsImFsd2F5cyB7XG4gICAgICBlbnQ6ZW50X3Zhcl9uYW1lID0gbmFtZTtcbiAgICAgIGVudDplbnRfdmFyX3AwID0gcDA7XG4gICAgICBlbnQ6ZW50X3Zhcl9wMSA9IHAxXG4gICAgfSIsImVudDplbnRfdmFyX25hbWUgPSBuYW1lIiwiZW50OmVudF92YXJfcDAgPSBwMCIsImVudDplbnRfdmFyX3AxID0gcDEiLCJydWxlIGZ1bmN0aW9ucyB7XG4gICAgc2VsZWN0IHdoZW4gc2NvcGUgZnVuY3Rpb25zO1xuXG4gICAgcHJlIHtcbiAgICAgIGcwID0gXCJvdmVycmlkZWQgZzAhXCJcbiAgICAgIGluYzUgPSBpbmNCeU4oNSlcbiAgICB9XG5cbiAgICBzZW5kX2RpcmVjdGl2ZShcInNheVwiKSB3aXRoXG4gICAgICBhZGRfb25lX3R3byA9IGFkZCgxLCAyKVxuICAgICAgaW5jNV8zID0gaW5jNSgzKVxuICAgICAgZzAgPSBnMFxuICB9IiwiZnVuY3Rpb25zIiwic2VsZWN0IHdoZW4gc2NvcGUgZnVuY3Rpb25zIiwic2NvcGUgZnVuY3Rpb25zIiwiZzAgPSBcIm92ZXJyaWRlZCBnMCFcIiIsIlwib3ZlcnJpZGVkIGcwIVwiIiwiaW5jNSA9IGluY0J5Tig1KSIsImluYzUiLCJpbmNCeU4oNSkiLCI1Iiwic2VuZF9kaXJlY3RpdmUoXCJzYXlcIikgd2l0aFxuICAgICAgYWRkX29uZV90d28gPSBhZGQoMSwgMilcbiAgICAgIGluYzVfMyA9IGluYzUoMylcbiAgICAgIGcwID0gZzAiLCJhZGQoMSwgMikiLCIyIiwiaW5jNSgzKSIsIjMiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0cyIsImN0eCIsInNjb3BlIiwic2V0IiwibWtfa3JsQ2xvc3VyZSIsImRiIiwiZ2V0RW50VmFyRnV0dXJlIiwicGljbyIsImlkIiwid2FpdCIsImdldEFyZyIsImdldCIsIm1hdGNoZXMiLCJtIiwiUmVnRXhwIiwiZXhlYyIsImV2ZW50IiwiYXR0cnMiLCJsZW5ndGgiLCJwdXNoIiwidW5kZWZpbmVkIiwicHV0RW50VmFyRnV0dXJlIl0sIm1hcHBpbmdzIjoiQUFBQUEsTUFBQSxDQUFBQyxPQUFBO0FBQUEsRSxRQ0FRLG1CREFSO0FBQUEsRSxRQUFBO0FBQUEsSUVFSSxNQ0FBLEVDQUssZUpGVDtBQUFBLElLR0ksUUNBQTtBQUFBLE1DQU8sSURBUDtBQUFBLE1FQVcsSUZBWDtBQUFBLE1HQWUsU0hBZjtBQUFBLE1JQXdCLEtKQXhCO0FBQUEs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QUEsRSxhQUFBLEUsVUFBQTtBQUFBLFEsY0FBQTtBQUFBLFUsVUNBWSxVQUFBUixHQUFBO0FBQUE7QUFBQSxXREFaO0FBQUE7QUFBQSxRLGlCQUFBO0FBQUEsVTs7Y0FBQSxRO2NBQUEsSzs7OztnQkFBQSxLO2dCQUFBLFE7O2NBQUEsTzs7V0FBQTtBQUFBO0FBQUEsT0ZERjtBQUFBLE0sV0FBQSxVQUFBQSxHQUFBO0FBQUEsUUlJSUEsR0FBQSxDQUFBQyxLQUFBLENBQUFDLEdBQUEsQzNEQUEsSTJEQUEsRUNBSyxlREFMLEVKSko7QUFBQSxRTUtJRixHQUFBLENBQUFDLEtBQUEsQ0FBQUMsR0FBQSxDQ0FBLE1EQUEsRW5DQU9GLEdBQUEsQ0FBQUMsS0FBQSxDQUFBUyxHQUFBLFVxQ0FBLENBQUFWLEdBQUEsR0NBTyxDREFQLEVGQVAsRU5MSjtBQUFBO0FBQUEsTSxnQlVRRTtBQUFBLFEsV0FBQSxXQUFBQSxHQUFBO0FBQUE7QUFBQSxjLFFBQUE7QUFBQSxjLFFBQUE7QUFBQSxjLFdBQUE7QUFBQSxnQixlOURDZ0JBLEdBQUEsQ0FBQUMsS0FBQSxDQUFBUyxHQUFBLE8rREFBLENBQUFWLEdBQUE7QUFBQSxrQjNEQUksQzJEQUo7QUFBQSxrQkNBTyxDREFQO0FBQUEsa0JERGhCO0FBQUEsZ0IsVUhFV0EsR0FBQSxDQUFBQyxLQUFBLENBQUFTLEdBQUEsUU1BQSxDQUFBVixHQUFBLEdDQUssQ0RBTCxFSEZYO0FBQUEsZ0IsTWpFR09BLEdBQUEsQ0FBQUMsS0FBQSxDQUFBUyxHQUFBLE1pRUhQO0FBQUE7QUFBQTtBQUFBO0FBQUEsT1ZSRjtBQUFBLEs5RHBERjtBQUFBO0FBQUEiLCJzb3VyY2VzQ29udGVudCI6W251bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbF19
