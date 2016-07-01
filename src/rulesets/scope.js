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
    ctx.scope.set('getVals', function (ctx) {
      return {
        'name': ctx.db.getEntVarFuture(ctx.pico.id, 'ent_var_name').wait(),
        'p0': ctx.db.getEntVarFuture(ctx.pico.id, 'ent_var_p0').wait(),
        'p1': ctx.db.getEntVarFuture(ctx.pico.id, 'ent_var_p1').wait()
      };
    });
    ctx.scope.set('add', function (ctx) {
      ctx.scope.set('a', ctx.getArg('a', 0));
      ctx.scope.set('b', ctx.getArg('b', 1));
      return ctx.scope.get('a') + ctx.scope.get('b');
    });
    ctx.scope.set('incByN', function (ctx) {
      ctx.scope.set('n', ctx.getArg('n', 0));
      return function (ctx) {
        ctx.scope.set('a', ctx.getArg('a', 0));
        return ctx.scope.get('a') + ctx.scope.get('n');
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
        ctx.scope.set('inc5', ctx.scope.get('incByN')(5));
      },
      'action_block': {
        'actions': [function (ctx) {
            return {
              'type': 'directive',
              'name': 'say',
              'options': {
                'add_one_two': ctx.scope.get('add')(1, 2),
                'inc5_3': ctx.scope.get('inc5')(3),
                'g0': ctx.scope.get('g0')
              }
            };
          }]
      }
    }
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJ1bGVzZXQgaW8ucGljb2xhYnMuc2NvcGUge1xuICBtZXRhIHtcbiAgICBuYW1lIFwidGVzdGluZyBzY29wZVwiXG4gICAgc2hhcmVzIGcwLCBnMSwgZ2V0VmFscywgYWRkXG4gIH1cbiAgZ2xvYmFsIHtcbiAgICBnMCA9IFwiZ2xvYmFsIDBcIiBcbiAgICBnMSA9IDFcbiAgICBnZXRWYWxzID0gZnVuY3Rpb24oKXtcbiAgICAgIHtcbiAgICAgICAgXCJuYW1lXCI6IGVudDplbnRfdmFyX25hbWUsXG4gICAgICAgIFwicDBcIjogZW50OmVudF92YXJfcDAsXG4gICAgICAgIFwicDFcIjogZW50OmVudF92YXJfcDFcbiAgICAgIH1cbiAgICB9XG4gICAgYWRkID0gZnVuY3Rpb24oYSwgYil7XG4gICAgICBhICsgYlxuICAgIH1cbiAgICBpbmNCeU4gPSBmdW5jdGlvbihuKXtcbiAgICAgIGZ1bmN0aW9uKGEpe1xuICAgICAgICBhICsgblxuICAgICAgfVxuICAgIH1cbiAgfVxuICBydWxlIGV2ZW50ZXgge1xuICAgIHNlbGVjdCB3aGVuXG4gICAgICBzY29wZSBldmVudDAgbmFtZSByZSNeKC4qKSQjIHNldHRpbmcobXlfbmFtZSlcbiAgICAgIG9yXG4gICAgICBzY29wZSBldmVudDE7XG4gICAgc2VuZF9kaXJlY3RpdmUoXCJzYXlcIikgd2l0aFxuICAgICAgbmFtZSA9IG15X25hbWVcbiAgfVxuICBydWxlIHByZWx1ZGVfc2NvcGUge1xuICAgIHNlbGVjdCB3aGVuIHNjb3BlIHByZWx1ZGUgbmFtZSByZSNeKC4qKSQjIHNldHRpbmcobmFtZSk7XG5cbiAgICBwcmUge1xuICAgICAgcDAgPSBcInByZWx1ZGUgMFwiXG4gICAgICBwMSA9IFwicHJlbHVkZSAxXCJcbiAgICB9XG5cbiAgICBzZW5kX2RpcmVjdGl2ZShcInNheVwiKSB3aXRoXG4gICAgICBuYW1lID0gbmFtZVxuICAgICAgcDAgPSBwMFxuICAgICAgcDEgPSBwMVxuICAgICAgZzAgPSBnMFxuXG4gICAgYWx3YXlzIHtcbiAgICAgIGVudDplbnRfdmFyX25hbWUgPSBuYW1lO1xuICAgICAgZW50OmVudF92YXJfcDAgPSBwMDtcbiAgICAgIGVudDplbnRfdmFyX3AxID0gcDFcbiAgICB9XG4gIH1cbiAgcnVsZSBmdW5jdGlvbnMge1xuICAgIHNlbGVjdCB3aGVuIHNjb3BlIGZ1bmN0aW9ucztcblxuICAgIHByZSB7XG4gICAgICBnMCA9IFwib3ZlcnJpZGVkIGcwIVwiXG4gICAgICBpbmM1ID0gaW5jQnlOKDUpXG4gICAgfVxuXG4gICAgc2VuZF9kaXJlY3RpdmUoXCJzYXlcIikgd2l0aFxuICAgICAgYWRkX29uZV90d28gPSBhZGQoMSwgMilcbiAgICAgIGluYzVfMyA9IGluYzUoMylcbiAgICAgIGcwID0gZzBcbiAgfVxufSIsImlvLnBpY29sYWJzLnNjb3BlIiwibmFtZSIsIm5hbWUgXCJ0ZXN0aW5nIHNjb3BlXCIiLCJcInRlc3Rpbmcgc2NvcGVcIiIsInNoYXJlcyIsInNoYXJlcyBnMCwgZzEsIGdldFZhbHMsIGFkZCIsImcwIiwiZzEiLCJnZXRWYWxzIiwiYWRkIiwiZzAgPSBcImdsb2JhbCAwXCIiLCJcImdsb2JhbCAwXCIiLCJnMSA9IDEiLCIxIiwiZ2V0VmFscyA9IGZ1bmN0aW9uKCl7XG4gICAgICB7XG4gICAgICAgIFwibmFtZVwiOiBlbnQ6ZW50X3Zhcl9uYW1lLFxuICAgICAgICBcInAwXCI6IGVudDplbnRfdmFyX3AwLFxuICAgICAgICBcInAxXCI6IGVudDplbnRfdmFyX3AxXG4gICAgICB9XG4gICAgfSIsImZ1bmN0aW9uKCl7XG4gICAgICB7XG4gICAgICAgIFwibmFtZVwiOiBlbnQ6ZW50X3Zhcl9uYW1lLFxuICAgICAgICBcInAwXCI6IGVudDplbnRfdmFyX3AwLFxuICAgICAgICBcInAxXCI6IGVudDplbnRfdmFyX3AxXG4gICAgICB9XG4gICAgfSIsIntcbiAgICAgICAgXCJuYW1lXCI6IGVudDplbnRfdmFyX25hbWUsXG4gICAgICAgIFwicDBcIjogZW50OmVudF92YXJfcDAsXG4gICAgICAgIFwicDFcIjogZW50OmVudF92YXJfcDFcbiAgICAgIH0iLCJcIm5hbWVcIiIsIlwibmFtZVwiOiBlbnQ6ZW50X3Zhcl9uYW1lIiwiZW50OmVudF92YXJfbmFtZSIsIlwicDBcIiIsIlwicDBcIjogZW50OmVudF92YXJfcDAiLCJlbnQ6ZW50X3Zhcl9wMCIsIlwicDFcIiIsIlwicDFcIjogZW50OmVudF92YXJfcDEiLCJlbnQ6ZW50X3Zhcl9wMSIsImFkZCA9IGZ1bmN0aW9uKGEsIGIpe1xuICAgICAgYSArIGJcbiAgICB9IiwiZnVuY3Rpb24oYSwgYil7XG4gICAgICBhICsgYlxuICAgIH0iLCJhIiwiYiIsImEgKyBiIiwiaW5jQnlOID0gZnVuY3Rpb24obil7XG4gICAgICBmdW5jdGlvbihhKXtcbiAgICAgICAgYSArIG5cbiAgICAgIH1cbiAgICB9IiwiaW5jQnlOIiwiZnVuY3Rpb24obil7XG4gICAgICBmdW5jdGlvbihhKXtcbiAgICAgICAgYSArIG5cbiAgICAgIH1cbiAgICB9IiwibiIsImZ1bmN0aW9uKGEpe1xuICAgICAgICBhICsgblxuICAgICAgfSIsImEgKyBuIiwicnVsZSBldmVudGV4IHtcbiAgICBzZWxlY3Qgd2hlblxuICAgICAgc2NvcGUgZXZlbnQwIG5hbWUgcmUjXiguKikkIyBzZXR0aW5nKG15X25hbWUpXG4gICAgICBvclxuICAgICAgc2NvcGUgZXZlbnQxO1xuICAgIHNlbmRfZGlyZWN0aXZlKFwic2F5XCIpIHdpdGhcbiAgICAgIG5hbWUgPSBteV9uYW1lXG4gIH0iLCJldmVudGV4Iiwic2VsZWN0IHdoZW5cbiAgICAgIHNjb3BlIGV2ZW50MCBuYW1lIHJlI14oLiopJCMgc2V0dGluZyhteV9uYW1lKVxuICAgICAgb3JcbiAgICAgIHNjb3BlIGV2ZW50MSIsInNjb3BlIGV2ZW50MCBuYW1lIHJlI14oLiopJCMgc2V0dGluZyhteV9uYW1lKSIsIm5hbWUgcmUjXiguKikkIyIsInJlI14oLiopJCMiLCJteV9uYW1lIiwic2NvcGUgZXZlbnQxIiwic2VuZF9kaXJlY3RpdmUoXCJzYXlcIikgd2l0aFxuICAgICAgbmFtZSA9IG15X25hbWUiLCJydWxlIHByZWx1ZGVfc2NvcGUge1xuICAgIHNlbGVjdCB3aGVuIHNjb3BlIHByZWx1ZGUgbmFtZSByZSNeKC4qKSQjIHNldHRpbmcobmFtZSk7XG5cbiAgICBwcmUge1xuICAgICAgcDAgPSBcInByZWx1ZGUgMFwiXG4gICAgICBwMSA9IFwicHJlbHVkZSAxXCJcbiAgICB9XG5cbiAgICBzZW5kX2RpcmVjdGl2ZShcInNheVwiKSB3aXRoXG4gICAgICBuYW1lID0gbmFtZVxuICAgICAgcDAgPSBwMFxuICAgICAgcDEgPSBwMVxuICAgICAgZzAgPSBnMFxuXG4gICAgYWx3YXlzIHtcbiAgICAgIGVudDplbnRfdmFyX25hbWUgPSBuYW1lO1xuICAgICAgZW50OmVudF92YXJfcDAgPSBwMDtcbiAgICAgIGVudDplbnRfdmFyX3AxID0gcDFcbiAgICB9XG4gIH0iLCJwcmVsdWRlX3Njb3BlIiwic2VsZWN0IHdoZW4gc2NvcGUgcHJlbHVkZSBuYW1lIHJlI14oLiopJCMgc2V0dGluZyhuYW1lKSIsInNjb3BlIHByZWx1ZGUgbmFtZSByZSNeKC4qKSQjIHNldHRpbmcobmFtZSkiLCJwMCA9IFwicHJlbHVkZSAwXCIiLCJwMCIsIlwicHJlbHVkZSAwXCIiLCJwMSA9IFwicHJlbHVkZSAxXCIiLCJwMSIsIlwicHJlbHVkZSAxXCIiLCJzZW5kX2RpcmVjdGl2ZShcInNheVwiKSB3aXRoXG4gICAgICBuYW1lID0gbmFtZVxuICAgICAgcDAgPSBwMFxuICAgICAgcDEgPSBwMVxuICAgICAgZzAgPSBnMCIsImFsd2F5cyB7XG4gICAgICBlbnQ6ZW50X3Zhcl9uYW1lID0gbmFtZTtcbiAgICAgIGVudDplbnRfdmFyX3AwID0gcDA7XG4gICAgICBlbnQ6ZW50X3Zhcl9wMSA9IHAxXG4gICAgfSIsImVudDplbnRfdmFyX25hbWUgPSBuYW1lIiwiZW50OmVudF92YXJfcDAgPSBwMCIsImVudDplbnRfdmFyX3AxID0gcDEiLCJydWxlIGZ1bmN0aW9ucyB7XG4gICAgc2VsZWN0IHdoZW4gc2NvcGUgZnVuY3Rpb25zO1xuXG4gICAgcHJlIHtcbiAgICAgIGcwID0gXCJvdmVycmlkZWQgZzAhXCJcbiAgICAgIGluYzUgPSBpbmNCeU4oNSlcbiAgICB9XG5cbiAgICBzZW5kX2RpcmVjdGl2ZShcInNheVwiKSB3aXRoXG4gICAgICBhZGRfb25lX3R3byA9IGFkZCgxLCAyKVxuICAgICAgaW5jNV8zID0gaW5jNSgzKVxuICAgICAgZzAgPSBnMFxuICB9IiwiZnVuY3Rpb25zIiwic2VsZWN0IHdoZW4gc2NvcGUgZnVuY3Rpb25zIiwic2NvcGUgZnVuY3Rpb25zIiwiZzAgPSBcIm92ZXJyaWRlZCBnMCFcIiIsIlwib3ZlcnJpZGVkIGcwIVwiIiwiaW5jNSA9IGluY0J5Tig1KSIsImluYzUiLCJpbmNCeU4oNSkiLCI1Iiwic2VuZF9kaXJlY3RpdmUoXCJzYXlcIikgd2l0aFxuICAgICAgYWRkX29uZV90d28gPSBhZGQoMSwgMilcbiAgICAgIGluYzVfMyA9IGluYzUoMylcbiAgICAgIGcwID0gZzAiLCJhZGQoMSwgMikiLCIyIiwiaW5jNSgzKSIsIjMiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0cyIsImN0eCIsInNjb3BlIiwic2V0IiwiZGIiLCJnZXRFbnRWYXJGdXR1cmUiLCJwaWNvIiwiaWQiLCJ3YWl0IiwiZ2V0QXJnIiwiZ2V0IiwibWF0Y2hlcyIsIm0iLCJSZWdFeHAiLCJleGVjIiwiZXZlbnQiLCJhdHRycyIsImxlbmd0aCIsInB1c2giLCJ1bmRlZmluZWQiLCJwdXRFbnRWYXJGdXR1cmUiXSwibWFwcGluZ3MiOiJBQUFBQSxNQUFBLENBQUFDLE9BQUE7QUFBQSxFLFFDQVEsbUJEQVI7QUFBQSxFLFFBQUE7QUFBQSxJRUVJLE1DQUEsRUNBSyxlSkZUO0FBQUEsSUtHSSxRQ0FBO0FBQUEsTUNBTyxJREFQO0FBQUEsTUVBVyxJRkFYO0FBQUEsTUdBZSxTSEFmO0FBQUEsTUlBd0IsS0pBeEI7QUFBQSxLTkhKO0FBQUE7QUFBQSxF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QUFBLE87O1dBQUE7QUFBQTtBQUFBLE9GREY7QUFBQSxNLFdBQUEsVUFBQUEsR0FBQTtBQUFBLFFJSUlBLEdBQUEsQ0FBQUMsS0FBQSxDQUFBQyxHQUFBLEMzREFBLEkyREFBLEVDQUssZURBTCxFSkpKO0FBQUEsUU1LSUYsR0FBQSxDQUFBQyxLQUFBLENBQUFDLEdBQUEsQ0NBQSxNREFBLEVuQ0FPRixHQUFBLENBQUFDLEtBQUEsQ0FBQVEsR0FBQSxVcUNBQSxDQ0FPLENEQVAsQ0ZBUCxFTkxKO0FBQUE7QUFBQSxNLGdCVVFFO0FBQUEsUSxXQUFBLFdBQUFULEdBQUE7QUFBQTtBQUFBLGMsUUFBQTtBQUFBLGMsUUFBQTtBQUFBLGMsV0FBQTtBQUFBLGdCLGU5RENnQkEsR0FBQSxDQUFBQyxLQUFBLENBQUFRLEdBQUEsTytEQUEsQzNEQUksQzJEQUosRUNBTyxDREFQLENERGhCO0FBQUEsZ0IsVUhFV1QsR0FBQSxDQUFBQyxLQUFBLENBQUFRLEdBQUEsUU1BQSxDQ0FLLENEQUwsQ0hGWDtBQUFBLGdCLE1qRUdPVCxHQUFBLENBQUFDLEtBQUEsQ0FBQVEsR0FBQSxNaUVIUDtBQUFBO0FBQUE7QUFBQTtBQUFBLE9WUkY7QUFBQSxLOURwREY7QUFBQTtBQUFBIiwic291cmNlc0NvbnRlbnQiOltudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGxdfQ==
