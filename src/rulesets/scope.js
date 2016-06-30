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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJ1bGVzZXQgaW8ucGljb2xhYnMuc2NvcGUge1xuICBtZXRhIHtcbiAgICBuYW1lIFwidGVzdGluZyBzY29wZVwiXG4gIH1cbiAgZ2xvYmFsIHtcbiAgICBnMCA9IFwiZ2xvYmFsIDBcIiBcbiAgICBnZXRWYWxzID0gZnVuY3Rpb24oKXtcbiAgICAgIHtcbiAgICAgICAgXCJuYW1lXCI6IGVudDplbnRfdmFyX25hbWUsXG4gICAgICAgIFwicDBcIjogZW50OmVudF92YXJfcDAsXG4gICAgICAgIFwicDFcIjogZW50OmVudF92YXJfcDFcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcnVsZSBldmVudGV4IHtcbiAgICBzZWxlY3Qgd2hlblxuICAgICAgc2NvcGUgZXZlbnQwIG5hbWUgcmUjXiguKikkIyBzZXR0aW5nKG15X25hbWUpXG4gICAgICBvclxuICAgICAgc2NvcGUgZXZlbnQxO1xuICAgIHNlbmRfZGlyZWN0aXZlKFwic2F5XCIpIHdpdGhcbiAgICAgIG5hbWUgPSBteV9uYW1lXG4gIH1cbiAgcnVsZSBwcmVsdWRlX3Njb3BlIHtcbiAgICBzZWxlY3Qgd2hlbiBzY29wZSBwcmVsdWRlIG5hbWUgcmUjXiguKikkIyBzZXR0aW5nKG5hbWUpO1xuXG4gICAgcHJlIHtcbiAgICAgIHAwID0gXCJwcmVsdWRlIDBcIlxuICAgICAgcDEgPSBcInByZWx1ZGUgMVwiXG4gICAgfVxuXG4gICAgc2VuZF9kaXJlY3RpdmUoXCJzYXlcIikgd2l0aFxuICAgICAgbmFtZSA9IG5hbWVcbiAgICAgIHAwID0gcDBcbiAgICAgIHAxID0gcDFcblxuICAgIGFsd2F5cyB7XG4gICAgICBlbnQ6ZW50X3Zhcl9uYW1lID0gbmFtZTtcbiAgICAgIGVudDplbnRfdmFyX3AwID0gcDA7XG4gICAgICBlbnQ6ZW50X3Zhcl9wMSA9IHAxXG4gICAgfVxuICB9XG59IiwiaW8ucGljb2xhYnMuc2NvcGUiLCJuYW1lIiwibmFtZSBcInRlc3Rpbmcgc2NvcGVcIiIsIlwidGVzdGluZyBzY29wZVwiIiwiZzAgPSBcImdsb2JhbCAwXCIiLCJnMCIsIlwiZ2xvYmFsIDBcIiIsImdldFZhbHMgPSBmdW5jdGlvbigpe1xuICAgICAge1xuICAgICAgICBcIm5hbWVcIjogZW50OmVudF92YXJfbmFtZSxcbiAgICAgICAgXCJwMFwiOiBlbnQ6ZW50X3Zhcl9wMCxcbiAgICAgICAgXCJwMVwiOiBlbnQ6ZW50X3Zhcl9wMVxuICAgICAgfVxuICAgIH0iLCJnZXRWYWxzIiwiZnVuY3Rpb24oKXtcbiAgICAgIHtcbiAgICAgICAgXCJuYW1lXCI6IGVudDplbnRfdmFyX25hbWUsXG4gICAgICAgIFwicDBcIjogZW50OmVudF92YXJfcDAsXG4gICAgICAgIFwicDFcIjogZW50OmVudF92YXJfcDFcbiAgICAgIH1cbiAgICB9Iiwie1xuICAgICAgICBcIm5hbWVcIjogZW50OmVudF92YXJfbmFtZSxcbiAgICAgICAgXCJwMFwiOiBlbnQ6ZW50X3Zhcl9wMCxcbiAgICAgICAgXCJwMVwiOiBlbnQ6ZW50X3Zhcl9wMVxuICAgICAgfSIsIlwibmFtZVwiIiwiXCJuYW1lXCI6IGVudDplbnRfdmFyX25hbWUiLCJlbnQ6ZW50X3Zhcl9uYW1lIiwiXCJwMFwiIiwiXCJwMFwiOiBlbnQ6ZW50X3Zhcl9wMCIsImVudDplbnRfdmFyX3AwIiwiXCJwMVwiIiwiXCJwMVwiOiBlbnQ6ZW50X3Zhcl9wMSIsImVudDplbnRfdmFyX3AxIiwicnVsZSBldmVudGV4IHtcbiAgICBzZWxlY3Qgd2hlblxuICAgICAgc2NvcGUgZXZlbnQwIG5hbWUgcmUjXiguKikkIyBzZXR0aW5nKG15X25hbWUpXG4gICAgICBvclxuICAgICAgc2NvcGUgZXZlbnQxO1xuICAgIHNlbmRfZGlyZWN0aXZlKFwic2F5XCIpIHdpdGhcbiAgICAgIG5hbWUgPSBteV9uYW1lXG4gIH0iLCJldmVudGV4Iiwic2VsZWN0IHdoZW5cbiAgICAgIHNjb3BlIGV2ZW50MCBuYW1lIHJlI14oLiopJCMgc2V0dGluZyhteV9uYW1lKVxuICAgICAgb3JcbiAgICAgIHNjb3BlIGV2ZW50MSIsInNjb3BlIGV2ZW50MCBuYW1lIHJlI14oLiopJCMgc2V0dGluZyhteV9uYW1lKSIsIm5hbWUgcmUjXiguKikkIyIsInJlI14oLiopJCMiLCJteV9uYW1lIiwic2NvcGUgZXZlbnQxIiwic2VuZF9kaXJlY3RpdmUoXCJzYXlcIikgd2l0aFxuICAgICAgbmFtZSA9IG15X25hbWUiLCJydWxlIHByZWx1ZGVfc2NvcGUge1xuICAgIHNlbGVjdCB3aGVuIHNjb3BlIHByZWx1ZGUgbmFtZSByZSNeKC4qKSQjIHNldHRpbmcobmFtZSk7XG5cbiAgICBwcmUge1xuICAgICAgcDAgPSBcInByZWx1ZGUgMFwiXG4gICAgICBwMSA9IFwicHJlbHVkZSAxXCJcbiAgICB9XG5cbiAgICBzZW5kX2RpcmVjdGl2ZShcInNheVwiKSB3aXRoXG4gICAgICBuYW1lID0gbmFtZVxuICAgICAgcDAgPSBwMFxuICAgICAgcDEgPSBwMVxuXG4gICAgYWx3YXlzIHtcbiAgICAgIGVudDplbnRfdmFyX25hbWUgPSBuYW1lO1xuICAgICAgZW50OmVudF92YXJfcDAgPSBwMDtcbiAgICAgIGVudDplbnRfdmFyX3AxID0gcDFcbiAgICB9XG4gIH0iLCJwcmVsdWRlX3Njb3BlIiwic2VsZWN0IHdoZW4gc2NvcGUgcHJlbHVkZSBuYW1lIHJlI14oLiopJCMgc2V0dGluZyhuYW1lKSIsInNjb3BlIHByZWx1ZGUgbmFtZSByZSNeKC4qKSQjIHNldHRpbmcobmFtZSkiLCJwMCA9IFwicHJlbHVkZSAwXCIiLCJwMCIsIlwicHJlbHVkZSAwXCIiLCJwMSA9IFwicHJlbHVkZSAxXCIiLCJwMSIsIlwicHJlbHVkZSAxXCIiLCJzZW5kX2RpcmVjdGl2ZShcInNheVwiKSB3aXRoXG4gICAgICBuYW1lID0gbmFtZVxuICAgICAgcDAgPSBwMFxuICAgICAgcDEgPSBwMSIsImFsd2F5cyB7XG4gICAgICBlbnQ6ZW50X3Zhcl9uYW1lID0gbmFtZTtcbiAgICAgIGVudDplbnRfdmFyX3AwID0gcDA7XG4gICAgICBlbnQ6ZW50X3Zhcl9wMSA9IHAxXG4gICAgfSIsImVudDplbnRfdmFyX25hbWUgPSBuYW1lIiwiZW50OmVudF92YXJfcDAgPSBwMCIsImVudDplbnRfdmFyX3AxID0gcDEiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0cyIsImN0eCIsInNjb3BlIiwic2V0IiwiZGIiLCJnZXRFbnRWYXJGdXR1cmUiLCJwaWNvIiwiaWQiLCJ3YWl0IiwibWF0Y2hlcyIsIm0iLCJSZWdFeHAiLCJleGVjIiwiZXZlbnQiLCJhdHRycyIsImxlbmd0aCIsInB1c2giLCJnZXQiLCJ1bmRlZmluZWQiLCJwdXRFbnRWYXJGdXR1cmUiXSwibWFwcGluZ3MiOiJBQUFBQSxNQUFBLENBQUFDLE9BQUE7QUFBQSxFLFFDQVEsbUJEQVI7QUFBQSxFLFFBQUEsRUVFSSxNQ0FBLEVDQUssZUpGVDtBQUFBLEUsVUFBQSxVQUFBQyxHQUFBO0FBQUEsSUtLSUEsR0FBQSxDQUFBQyxLQUFBLENBQUFDLEdBQUEsQ0NBQSxJREFBLEVFQUssVUZBTCxFTExKO0FBQUEsSVFNSUYsR0FBQSxDQUFBQyxLQUFBLENBQUFDLEdBQUEsQ0NBQSxTREFBLEVFQVUsVUFBQUYsR0FBQTtBQUFBLGFDQ1I7QUFBQSxRQ0NFLE1DQUEsRUNBUUEsR0FBQSxDQUFBRyxFQUFBLENBQUFDLGVBQUEsQ0FBQUosR0FBQSxDQUFBSyxJQUFBLENBQUFDLEVBQUEsa0JBQUFDLElBQUEsRUhEVjtBQUFBLFFJRUUsSUNBQSxFQ0FNUCxHQUFBLENBQUFHLEVBQUEsQ0FBQUMsZUFBQSxDQUFBSixHQUFBLENBQUFLLElBQUEsQ0FBQUMsRUFBQSxnQkFBQUMsSUFBQSxFTkZSO0FBQUEsUU9HRSxJQ0FBLEVDQU1QLEdBQUEsQ0FBQUcsRUFBQSxDQUFBQyxlQUFBLENBQUFKLEdBQUEsQ0FBQUssSUFBQSxDQUFBQyxFQUFBLGdCQUFBQyxJQUFBLEVUSFI7QUFBQSxPRERRO0FBQUEsS0ZBVixFUk5KO0FBQUE7QUFBQSxFLFNBQUE7QUFBQSxJLFdxQmNFO0FBQUEsTSxRQ0FLLFNEQUw7QUFBQSxNLFVFQ0U7QUFBQSxR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QSxDQUFBZSxHQUFBLFF3Q0FuQixFQUFBVCxJQUFBLEdEREY7QUFBQSxVRUVFUCxHQUFBLENBQUFHLEVBQUEsQ0FBQWUsZUFBQSxDQUFBbEIsR0FBQSxDQUFBSyxJQUFBLENBQUFDLEVBQUEsRTFCQUEsWTBCQUEsRVJBaUJOLEdBQUEsQ0FBQUMsS0FBQSxDQUFBZSxHQUFBLE1RQWpCLEVBQUFULElBQUEsR0ZGRjtBQUFBLFVHR0VQLEdBQUEsQ0FBQUcsRUFBQSxDQUFBZSxlQUFBLENBQUFsQixHQUFBLENBQUFLLElBQUEsQ0FBQUMsRUFBQSxFeEJBQSxZd0JBQSxFTkFpQk4sR0FBQSxDQUFBQyxLQUFBLENBQUFlLEdBQUEsTU1BakIsRUFBQVQsSUFBQSxHSEhGO0FBQUE7QUFBQSxPWGJGO0FBQUEsSzlCdEJGO0FBQUE7QUFBQSIsInNvdXJjZXNDb250ZW50IjpbbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGxdfQ==
