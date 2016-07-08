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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJ1bGVzZXQgaW8ucGljb2xhYnMuc2NvcGUge1xuICBtZXRhIHtcbiAgICBuYW1lIFwidGVzdGluZyBzY29wZVwiXG4gICAgc2hhcmVzIGcwLCBnMSwgZ2V0VmFscywgYWRkXG4gIH1cbiAgZ2xvYmFsIHtcbiAgICBnMCA9IFwiZ2xvYmFsIDBcIiBcbiAgICBnMSA9IDFcbiAgICBnZXRWYWxzID0gZnVuY3Rpb24oKXtcbiAgICAgIHtcbiAgICAgICAgXCJuYW1lXCI6IGVudDplbnRfdmFyX25hbWUsXG4gICAgICAgIFwicDBcIjogZW50OmVudF92YXJfcDAsXG4gICAgICAgIFwicDFcIjogZW50OmVudF92YXJfcDFcbiAgICAgIH1cbiAgICB9XG4gICAgYWRkID0gZnVuY3Rpb24oYSwgYil7XG4gICAgICBhICsgYlxuICAgIH1cbiAgICBpbmNCeU4gPSBmdW5jdGlvbihuKXtcbiAgICAgIGZ1bmN0aW9uKGEpe1xuICAgICAgICBhICsgblxuICAgICAgfVxuICAgIH1cbiAgfVxuICBydWxlIGV2ZW50ZXgge1xuICAgIHNlbGVjdCB3aGVuXG4gICAgICBzY29wZSBldmVudDAgbmFtZSByZSNeKC4qKSQjIHNldHRpbmcobXlfbmFtZSlcbiAgICAgIG9yXG4gICAgICBzY29wZSBldmVudDE7XG4gICAgc2VuZF9kaXJlY3RpdmUoXCJzYXlcIikgd2l0aFxuICAgICAgbmFtZSA9IG15X25hbWVcbiAgfVxuICBydWxlIHByZWx1ZGVfc2NvcGUge1xuICAgIHNlbGVjdCB3aGVuIHNjb3BlIHByZWx1ZGUgbmFtZSByZSNeKC4qKSQjIHNldHRpbmcobmFtZSk7XG5cbiAgICBwcmUge1xuICAgICAgcDAgPSBcInByZWx1ZGUgMFwiXG4gICAgICBwMSA9IFwicHJlbHVkZSAxXCJcbiAgICB9XG5cbiAgICBzZW5kX2RpcmVjdGl2ZShcInNheVwiKSB3aXRoXG4gICAgICBuYW1lID0gbmFtZVxuICAgICAgcDAgPSBwMFxuICAgICAgcDEgPSBwMVxuICAgICAgZzAgPSBnMFxuXG4gICAgYWx3YXlzIHtcbiAgICAgIGVudDplbnRfdmFyX25hbWUgPSBuYW1lO1xuICAgICAgZW50OmVudF92YXJfcDAgPSBwMDtcbiAgICAgIGVudDplbnRfdmFyX3AxID0gcDFcbiAgICB9XG4gIH1cbiAgcnVsZSBmdW5jdGlvbnMge1xuICAgIHNlbGVjdCB3aGVuIHNjb3BlIGZ1bmN0aW9ucztcblxuICAgIHByZSB7XG4gICAgICBnMCA9IFwib3ZlcnJpZGVkIGcwIVwiXG4gICAgICBpbmM1ID0gaW5jQnlOKDUpXG4gICAgfVxuXG4gICAgc2VuZF9kaXJlY3RpdmUoXCJzYXlcIikgd2l0aFxuICAgICAgYWRkX29uZV90d28gPSBhZGQoMSwgMilcbiAgICAgIGluYzVfMyA9IGluYzUoMylcbiAgICAgIGcwID0gZzBcbiAgfVxufSIsImlvLnBpY29sYWJzLnNjb3BlIiwibmFtZSIsIm5hbWUgXCJ0ZXN0aW5nIHNjb3BlXCIiLCJcInRlc3Rpbmcgc2NvcGVcIiIsInNoYXJlcyIsInNoYXJlcyBnMCwgZzEsIGdldFZhbHMsIGFkZCIsImcwIiwiZzEiLCJnZXRWYWxzIiwiYWRkIiwiZzAgPSBcImdsb2JhbCAwXCIiLCJcImdsb2JhbCAwXCIiLCJnMSA9IDEiLCIxIiwiZ2V0VmFscyA9IGZ1bmN0aW9uKCl7XG4gICAgICB7XG4gICAgICAgIFwibmFtZVwiOiBlbnQ6ZW50X3Zhcl9uYW1lLFxuICAgICAgICBcInAwXCI6IGVudDplbnRfdmFyX3AwLFxuICAgICAgICBcInAxXCI6IGVudDplbnRfdmFyX3AxXG4gICAgICB9XG4gICAgfSIsImZ1bmN0aW9uKCl7XG4gICAgICB7XG4gICAgICAgIFwibmFtZVwiOiBlbnQ6ZW50X3Zhcl9uYW1lLFxuICAgICAgICBcInAwXCI6IGVudDplbnRfdmFyX3AwLFxuICAgICAgICBcInAxXCI6IGVudDplbnRfdmFyX3AxXG4gICAgICB9XG4gICAgfSIsIntcbiAgICAgICAgXCJuYW1lXCI6IGVudDplbnRfdmFyX25hbWUsXG4gICAgICAgIFwicDBcIjogZW50OmVudF92YXJfcDAsXG4gICAgICAgIFwicDFcIjogZW50OmVudF92YXJfcDFcbiAgICAgIH0iLCJcIm5hbWVcIiIsIlwibmFtZVwiOiBlbnQ6ZW50X3Zhcl9uYW1lIiwiZW50OmVudF92YXJfbmFtZSIsIlwicDBcIiIsIlwicDBcIjogZW50OmVudF92YXJfcDAiLCJlbnQ6ZW50X3Zhcl9wMCIsIlwicDFcIiIsIlwicDFcIjogZW50OmVudF92YXJfcDEiLCJlbnQ6ZW50X3Zhcl9wMSIsImFkZCA9IGZ1bmN0aW9uKGEsIGIpe1xuICAgICAgYSArIGJcbiAgICB9IiwiZnVuY3Rpb24oYSwgYil7XG4gICAgICBhICsgYlxuICAgIH0iLCJhIiwiYiIsImEgKyBiIiwiaW5jQnlOID0gZnVuY3Rpb24obil7XG4gICAgICBmdW5jdGlvbihhKXtcbiAgICAgICAgYSArIG5cbiAgICAgIH1cbiAgICB9IiwiaW5jQnlOIiwiZnVuY3Rpb24obil7XG4gICAgICBmdW5jdGlvbihhKXtcbiAgICAgICAgYSArIG5cbiAgICAgIH1cbiAgICB9IiwibiIsImZ1bmN0aW9uKGEpe1xuICAgICAgICBhICsgblxuICAgICAgfSIsImEgKyBuIiwicnVsZSBldmVudGV4IHtcbiAgICBzZWxlY3Qgd2hlblxuICAgICAgc2NvcGUgZXZlbnQwIG5hbWUgcmUjXiguKikkIyBzZXR0aW5nKG15X25hbWUpXG4gICAgICBvclxuICAgICAgc2NvcGUgZXZlbnQxO1xuICAgIHNlbmRfZGlyZWN0aXZlKFwic2F5XCIpIHdpdGhcbiAgICAgIG5hbWUgPSBteV9uYW1lXG4gIH0iLCJldmVudGV4Iiwic2VsZWN0IHdoZW5cbiAgICAgIHNjb3BlIGV2ZW50MCBuYW1lIHJlI14oLiopJCMgc2V0dGluZyhteV9uYW1lKVxuICAgICAgb3JcbiAgICAgIHNjb3BlIGV2ZW50MSIsInNjb3BlIGV2ZW50MCBuYW1lIHJlI14oLiopJCMgc2V0dGluZyhteV9uYW1lKSIsIm5hbWUgcmUjXiguKikkIyIsInJlI14oLiopJCMiLCJteV9uYW1lIiwic2NvcGUgZXZlbnQxIiwic2VuZF9kaXJlY3RpdmUoXCJzYXlcIikgd2l0aFxuICAgICAgbmFtZSA9IG15X25hbWUiLCJydWxlIHByZWx1ZGVfc2NvcGUge1xuICAgIHNlbGVjdCB3aGVuIHNjb3BlIHByZWx1ZGUgbmFtZSByZSNeKC4qKSQjIHNldHRpbmcobmFtZSk7XG5cbiAgICBwcmUge1xuICAgICAgcDAgPSBcInByZWx1ZGUgMFwiXG4gICAgICBwMSA9IFwicHJlbHVkZSAxXCJcbiAgICB9XG5cbiAgICBzZW5kX2RpcmVjdGl2ZShcInNheVwiKSB3aXRoXG4gICAgICBuYW1lID0gbmFtZVxuICAgICAgcDAgPSBwMFxuICAgICAgcDEgPSBwMVxuICAgICAgZzAgPSBnMFxuXG4gICAgYWx3YXlzIHtcbiAgICAgIGVudDplbnRfdmFyX25hbWUgPSBuYW1lO1xuICAgICAgZW50OmVudF92YXJfcDAgPSBwMDtcbiAgICAgIGVudDplbnRfdmFyX3AxID0gcDFcbiAgICB9XG4gIH0iLCJwcmVsdWRlX3Njb3BlIiwic2VsZWN0IHdoZW4gc2NvcGUgcHJlbHVkZSBuYW1lIHJlI14oLiopJCMgc2V0dGluZyhuYW1lKSIsInNjb3BlIHByZWx1ZGUgbmFtZSByZSNeKC4qKSQjIHNldHRpbmcobmFtZSkiLCJwMCA9IFwicHJlbHVkZSAwXCIiLCJwMCIsIlwicHJlbHVkZSAwXCIiLCJwMSA9IFwicHJlbHVkZSAxXCIiLCJwMSIsIlwicHJlbHVkZSAxXCIiLCJzZW5kX2RpcmVjdGl2ZShcInNheVwiKSB3aXRoXG4gICAgICBuYW1lID0gbmFtZVxuICAgICAgcDAgPSBwMFxuICAgICAgcDEgPSBwMVxuICAgICAgZzAgPSBnMCIsImFsd2F5cyB7XG4gICAgICBlbnQ6ZW50X3Zhcl9uYW1lID0gbmFtZTtcbiAgICAgIGVudDplbnRfdmFyX3AwID0gcDA7XG4gICAgICBlbnQ6ZW50X3Zhcl9wMSA9IHAxXG4gICAgfSIsImVudDplbnRfdmFyX25hbWUgPSBuYW1lIiwiZW50OmVudF92YXJfcDAgPSBwMCIsImVudDplbnRfdmFyX3AxID0gcDEiLCJydWxlIGZ1bmN0aW9ucyB7XG4gICAgc2VsZWN0IHdoZW4gc2NvcGUgZnVuY3Rpb25zO1xuXG4gICAgcHJlIHtcbiAgICAgIGcwID0gXCJvdmVycmlkZWQgZzAhXCJcbiAgICAgIGluYzUgPSBpbmNCeU4oNSlcbiAgICB9XG5cbiAgICBzZW5kX2RpcmVjdGl2ZShcInNheVwiKSB3aXRoXG4gICAgICBhZGRfb25lX3R3byA9IGFkZCgxLCAyKVxuICAgICAgaW5jNV8zID0gaW5jNSgzKVxuICAgICAgZzAgPSBnMFxuICB9IiwiZnVuY3Rpb25zIiwic2VsZWN0IHdoZW4gc2NvcGUgZnVuY3Rpb25zIiwic2NvcGUgZnVuY3Rpb25zIiwiZzAgPSBcIm92ZXJyaWRlZCBnMCFcIiIsIlwib3ZlcnJpZGVkIGcwIVwiIiwiaW5jNSA9IGluY0J5Tig1KSIsImluYzUiLCJpbmNCeU4oNSkiLCI1Iiwic2VuZF9kaXJlY3RpdmUoXCJzYXlcIikgd2l0aFxuICAgICAgYWRkX29uZV90d28gPSBhZGQoMSwgMilcbiAgICAgIGluYzVfMyA9IGluYzUoMylcbiAgICAgIGcwID0gZzAiLCJhZGQoMSwgMikiLCIyIiwiaW5jNSgzKSIsIjMiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0cyIsImN0eCIsInNjb3BlIiwic2V0Iiwia3JsIiwiU3RyaW5nIiwiTnVtYmVyIiwiQ2xvc3VyZSIsInBlcnNpc3RlbnQiLCJnZXRFbnQiLCJnZXRBcmciLCJhcmdzIiwic3RkbGliIiwiZ2V0IiwibWF0Y2hlcyIsImV2ZW50IiwiYXR0cnMiLCJnZXRNYXRjaGVzIiwiUmVnRXhwIiwidW5kZWZpbmVkIiwicHV0RW50Il0sIm1hcHBpbmdzIjoiQUFBQUEsTUFBQSxDQUFBQyxPQUFBO0FBQUEsRSxRQ0FRLG1CREFSO0FBQUEsRSxRQUFBO0FBQUEsSUVFSSxNQ0FBLEVDQUssZUpGVDtBQUFBLElLR0ksUUNBQTtBQUFBLE1DQU8sSURBUDtBQUFBLE1FQVcsSUZBWDtBQUFBLE1HQWUsU0hBZjtBQUFBLE1JQXdCLEtKQXhCO0FBQUEsS05ISjtBQUFB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REFMO0FBQUEsTSxVRUNFO0FBQUEsUSxTQUFBLEUsU0FBQSxFLGFBQUEsRSxVQUFBO0FBQUEsUSxjQUFBO0FBQUEsVSxVQ0FZLFVBQUFaLEdBQUE7QUFBQTtBQUFBLFdEQVo7QUFBQTtBQUFBLFEsaUJBQUE7QUFBQSxVOztjQUFBLFE7Y0FBQSxLOzs7O2dCQUFBLEs7Z0JBQUEsUTs7Y0FBQSxPOztXQUFBO0FBQUE7QUFBQSxPRkRGO0FBQUEsTSxXQUFBLFVBQUFBLEdBQUE7QUFBQSxRSUlJQSxHQUFBLENBQUFDLEtBQUEsQ0FBQUMsR0FBQSxDM0RBQSxJMkRBQSxFQ0FLLElBQUFGLEdBQUEsQ0FBQUcsR0FBQSxDQUFBQyxNQUFBLGlCREFMLEVKSko7QUFBQSxRTUtJSixHQUFBLENBQUFDLEtBQUEsQ0FBQUMsR0FBQSxDQ0FBLE1EQUEsRW5DQU9GLEdBQUEsQ0FBQUMsS0FBQSxDQUFBVyxHQUFBLFVxQ0FBLENBQUFaLEdBQUEsR0NBTyxJQUFBQSxHQUFBLENBQUFHLEdBQUEsQ0FBQUUsTUFBQSxHREFQLEVGQVAsRU5MSjtBQUFBO0FBQUEsTSxnQlVRRTtBQUFBLFEsV0FBQSxXQUFBTCxHQUFBO0FBQUE7QUFBQSxjLFFBQUE7QUFBQSxjLFFBQUE7QUFBQSxjLFdBQUE7QUFBQSxnQixlOURDZ0JBLEdBQUEsQ0FBQUMsS0FBQSxDQUFBVyxHQUFBLE8rREFBLENBQUFaLEdBQUE7QUFBQSxrQjNEQUksSUFBQUEsR0FBQSxDQUFBRyxHQUFBLENBQUFFLE1BQUEsRzJEQUo7QUFBQSxrQkNBTyxJQUFBTCxHQUFBLENBQUFHLEdBQUEsQ0FBQUUsTUFBQSxHREFQO0FBQUEsa0JERGhCO0FBQUEsZ0IsVUhFV0wsR0FBQSxDQUFBQyxLQUFBLENBQUFXLEdBQUEsUU1BQSxDQUFBWixHQUFBLEdDQUssSUFBQUEsR0FBQSxDQUFBRyxHQUFBLENBQUFFLE1BQUEsR0RBTCxFSEZYO0FBQUEsZ0IsTWpFR09MLEdBQUEsQ0FBQUMsS0FBQSxDQUFBVyxHQUFBLE1pRUhQO0FBQUE7QUFBQTtBQUFBO0FBQUEsT1ZSRjtBQUFBLEs5RHBERjtBQUFBO0FBQUEiLCJzb3VyY2VzQ29udGVudCI6W251bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbF19
