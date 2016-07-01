module.exports = {
  'name': 'io.picolabs.scope',
  'meta': {
    'name': 'testing scope',
    'shares': [
      'getVals',
      'g0'
    ]
  },
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
    }
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJ1bGVzZXQgaW8ucGljb2xhYnMuc2NvcGUge1xuICBtZXRhIHtcbiAgICBuYW1lIFwidGVzdGluZyBzY29wZVwiXG4gICAgc2hhcmVzIGdldFZhbHMsIGcwXG4gIH1cbiAgZ2xvYmFsIHtcbiAgICBnMCA9IFwiZ2xvYmFsIDBcIiBcbiAgICBnZXRWYWxzID0gZnVuY3Rpb24oKXtcbiAgICAgIHtcbiAgICAgICAgXCJuYW1lXCI6IGVudDplbnRfdmFyX25hbWUsXG4gICAgICAgIFwicDBcIjogZW50OmVudF92YXJfcDAsXG4gICAgICAgIFwicDFcIjogZW50OmVudF92YXJfcDFcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcnVsZSBldmVudGV4IHtcbiAgICBzZWxlY3Qgd2hlblxuICAgICAgc2NvcGUgZXZlbnQwIG5hbWUgcmUjXiguKikkIyBzZXR0aW5nKG15X25hbWUpXG4gICAgICBvclxuICAgICAgc2NvcGUgZXZlbnQxO1xuICAgIHNlbmRfZGlyZWN0aXZlKFwic2F5XCIpIHdpdGhcbiAgICAgIG5hbWUgPSBteV9uYW1lXG4gIH1cbiAgcnVsZSBwcmVsdWRlX3Njb3BlIHtcbiAgICBzZWxlY3Qgd2hlbiBzY29wZSBwcmVsdWRlIG5hbWUgcmUjXiguKikkIyBzZXR0aW5nKG5hbWUpO1xuXG4gICAgcHJlIHtcbiAgICAgIHAwID0gXCJwcmVsdWRlIDBcIlxuICAgICAgcDEgPSBcInByZWx1ZGUgMVwiXG4gICAgfVxuXG4gICAgc2VuZF9kaXJlY3RpdmUoXCJzYXlcIikgd2l0aFxuICAgICAgbmFtZSA9IG5hbWVcbiAgICAgIHAwID0gcDBcbiAgICAgIHAxID0gcDFcbiAgICAgIGcwID0gZzBcblxuICAgIGFsd2F5cyB7XG4gICAgICBlbnQ6ZW50X3Zhcl9uYW1lID0gbmFtZTtcbiAgICAgIGVudDplbnRfdmFyX3AwID0gcDA7XG4gICAgICBlbnQ6ZW50X3Zhcl9wMSA9IHAxXG4gICAgfVxuICB9XG59IiwiaW8ucGljb2xhYnMuc2NvcGUiLCJuYW1lIiwibmFtZSBcInRlc3Rpbmcgc2NvcGVcIiIsIlwidGVzdGluZyBzY29wZVwiIiwic2hhcmVzIiwic2hhcmVzIGdldFZhbHMsIGcwIiwiZ2V0VmFscyIsImcwIiwiZzAgPSBcImdsb2JhbCAwXCIiLCJcImdsb2JhbCAwXCIiLCJnZXRWYWxzID0gZnVuY3Rpb24oKXtcbiAgICAgIHtcbiAgICAgICAgXCJuYW1lXCI6IGVudDplbnRfdmFyX25hbWUsXG4gICAgICAgIFwicDBcIjogZW50OmVudF92YXJfcDAsXG4gICAgICAgIFwicDFcIjogZW50OmVudF92YXJfcDFcbiAgICAgIH1cbiAgICB9IiwiZnVuY3Rpb24oKXtcbiAgICAgIHtcbiAgICAgICAgXCJuYW1lXCI6IGVudDplbnRfdmFyX25hbWUsXG4gICAgICAgIFwicDBcIjogZW50OmVudF92YXJfcDAsXG4gICAgICAgIFwicDFcIjogZW50OmVudF92YXJfcDFcbiAgICAgIH1cbiAgICB9Iiwie1xuICAgICAgICBcIm5hbWVcIjogZW50OmVudF92YXJfbmFtZSxcbiAgICAgICAgXCJwMFwiOiBlbnQ6ZW50X3Zhcl9wMCxcbiAgICAgICAgXCJwMVwiOiBlbnQ6ZW50X3Zhcl9wMVxuICAgICAgfSIsIlwibmFtZVwiIiwiXCJuYW1lXCI6IGVudDplbnRfdmFyX25hbWUiLCJlbnQ6ZW50X3Zhcl9uYW1lIiwiXCJwMFwiIiwiXCJwMFwiOiBlbnQ6ZW50X3Zhcl9wMCIsImVudDplbnRfdmFyX3AwIiwiXCJwMVwiIiwiXCJwMVwiOiBlbnQ6ZW50X3Zhcl9wMSIsImVudDplbnRfdmFyX3AxIiwicnVsZSBldmVudGV4IHtcbiAgICBzZWxlY3Qgd2hlblxuICAgICAgc2NvcGUgZXZlbnQwIG5hbWUgcmUjXiguKikkIyBzZXR0aW5nKG15X25hbWUpXG4gICAgICBvclxuICAgICAgc2NvcGUgZXZlbnQxO1xuICAgIHNlbmRfZGlyZWN0aXZlKFwic2F5XCIpIHdpdGhcbiAgICAgIG5hbWUgPSBteV9uYW1lXG4gIH0iLCJldmVudGV4Iiwic2VsZWN0IHdoZW5cbiAgICAgIHNjb3BlIGV2ZW50MCBuYW1lIHJlI14oLiopJCMgc2V0dGluZyhteV9uYW1lKVxuICAgICAgb3JcbiAgICAgIHNjb3BlIGV2ZW50MSIsInNjb3BlIGV2ZW50MCBuYW1lIHJlI14oLiopJCMgc2V0dGluZyhteV9uYW1lKSIsIm5hbWUgcmUjXiguKikkIyIsInJlI14oLiopJCMiLCJteV9uYW1lIiwic2NvcGUgZXZlbnQxIiwic2VuZF9kaXJlY3RpdmUoXCJzYXlcIikgd2l0aFxuICAgICAgbmFtZSA9IG15X25hbWUiLCJydWxlIHByZWx1ZGVfc2NvcGUge1xuICAgIHNlbGVjdCB3aGVuIHNjb3BlIHByZWx1ZGUgbmFtZSByZSNeKC4qKSQjIHNldHRpbmcobmFtZSk7XG5cbiAgICBwcmUge1xuICAgICAgcDAgPSBcInByZWx1ZGUgMFwiXG4gICAgICBwMSA9IFwicHJlbHVkZSAxXCJcbiAgICB9XG5cbiAgICBzZW5kX2RpcmVjdGl2ZShcInNheVwiKSB3aXRoXG4gICAgICBuYW1lID0gbmFtZVxuICAgICAgcDAgPSBwMFxuICAgICAgcDEgPSBwMVxuICAgICAgZzAgPSBnMFxuXG4gICAgYWx3YXlzIHtcbiAgICAgIGVudDplbnRfdmFyX25hbWUgPSBuYW1lO1xuICAgICAgZW50OmVudF92YXJfcDAgPSBwMDtcbiAgICAgIGVudDplbnRfdmFyX3AxID0gcDFcbiAgICB9XG4gIH0iLCJwcmVsdWRlX3Njb3BlIiwic2VsZWN0IHdoZW4gc2NvcGUgcHJlbHVkZSBuYW1lIHJlI14oLiopJCMgc2V0dGluZyhuYW1lKSIsInNjb3BlIHByZWx1ZGUgbmFtZSByZSNeKC4qKSQjIHNldHRpbmcobmFtZSkiLCJwMCA9IFwicHJlbHVkZSAwXCIiLCJwMCIsIlwicHJlbHVkZSAwXCIiLCJwMSA9IFwicHJlbHVkZSAxXCIiLCJwMSIsIlwicHJlbHVkZSAxXCIiLCJzZW5kX2RpcmVjdGl2ZShcInNheVwiKSB3aXRoXG4gICAgICBuYW1lID0gbmFtZVxuICAgICAgcDAgPSBwMFxuICAgICAgcDEgPSBwMVxuICAgICAgZzAgPSBnMCIsImFsd2F5cyB7XG4gICAgICBlbnQ6ZW50X3Zhcl9uYW1lID0gbmFtZTtcbiAgICAgIGVudDplbnRfdmFyX3AwID0gcDA7XG4gICAgICBlbnQ6ZW50X3Zhcl9wMSA9IHAxXG4gICAgfSIsImVudDplbnRfdmFyX25hbWUgPSBuYW1lIiwiZW50OmVudF92YXJfcDAgPSBwMCIsImVudDplbnRfdmFyX3AxID0gcDEiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0cyIsImN0eCIsInNjb3BlIiwic2V0IiwiZGIiLCJnZXRFbnRWYXJGdXR1cmUiLCJwaWNvIiwiaWQiLCJ3YWl0IiwibWF0Y2hlcyIsIm0iLCJSZWdFeHAiLCJleGVjIiwiZXZlbnQiLCJhdHRycyIsImxlbmd0aCIsInB1c2giLCJnZXQiLCJ1bmRlZmluZWQiLCJwdXRFbnRWYXJGdXR1cmUiXSwibWFwcGluZ3MiOiJBQUFBQSxNQUFBLENBQUFDLE9BQUE7QUFBQSxFLFFDQVEsbUJEQVI7QUFBQSxFLFFBQUE7QUFBQSxJRUVJLE1DQUEsRUNBSyxlSkZUO0FBQUEsSUtHSSxRQ0FBO0FBQUEsTUNBTyxTREFQO0FBQUEsTUVBZ0IsSUZBaEI7QUFBQSxLTkhKO0FBQUE7QUFBQSxFLFVBQUEsVUFBQUMsR0FBQTtBQUFBLElTTUlBLEdBQUEsQ0FBQUMsS0FBQSxDQUFBQyxHQUFBLENEQUEsSUNBQSxFQ0FLLFVEQUwsRVROSjtBQUFBLElXT0lGLEdBQUEsQ0FBQUMsS0FBQSxDQUFBQyxHQUFBLENKQUEsU0lBQSxFQ0FVLFVBQUFGLEdBQUE7QUFBQSxhQ0NSO0FBQUEsUUNDRSxNQ0FBLEVDQVFBLEdBQUEsQ0FBQUcsRUFBQSxDQUFBQyxlQUFBLENBQUFKLEdBQUEsQ0FBQUssSUFBQSxDQUFBQyxFQUFBLGtCQUFBQyxJQUFBLEVIRFY7QUFBQSxRSUVFLElDQUEsRUNBTVAsR0FBQSxDQUFBRyxFQUFBLENBQUFDLGVBQUEsQ0FBQUosR0FBQSxDQUFBSyxJQUFBLENBQUFDLEVBQUEsZ0JBQUFDLElBQUEsRU5GUjtBQUFBLFFPR0UsSUNBQSxFQ0FNUCxH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LEdBQUEsTWtDSlA7QUFBQTtBQUFBO0FBQUE7QUFBQSxPVlJGO0FBQUEsTSxZV2NFO0FBQUEsUSxTQUFBQyxTQUFBO0FBQUEsUSxZQUFBQSxTQUFBO0FBQUEsUSxVQUFBLFVBQUFqQixHQUFBO0FBQUEsVUNDRUEsR0FBQSxDQUFBRyxFQUFBLENBQUFlLGVBQUEsQ0FBQWxCLEdBQUEsQ0FBQUssSUFBQSxDQUFBQyxFQUFBLEU1QkFBLGM0QkFBLEUxQ0FtQk4sR0FBQSxDQUFBQyxLQUFBLENBQUFlLEdBQUEsUTBDQW5CLEVBQUFULElBQUEsR0RERjtBQUFBLFVFRUVQLEdBQUEsQ0FBQUcsRUFBQSxDQUFBZSxlQUFBLENBQUFsQixHQUFBLENBQUFLLElBQUEsQ0FBQUMsRUFBQSxFMUJBQSxZMEJBQSxFUkFpQk4sR0FBQSxDQUFBQyxLQUFBLENBQUFlLEdBQUEsTVFBakIsRUFBQVQsSUFBQSxHRkZGO0FBQUEsVUdHRVAsR0FBQSxDQUFBRyxFQUFBLENBQUFlLGVBQUEsQ0FBQWxCLEdBQUEsQ0FBQUssSUFBQSxDQUFBQyxFQUFBLEV4QkFBLFl3QkFBLEVOQWlCTixHQUFBLENBQUFDLEtBQUEsQ0FBQWUsR0FBQSxNTUFqQixFQUFBVCxJQUFBLEdISEY7QUFBQTtBQUFBLE9YZEY7QUFBQSxLaEN2QkY7QUFBQTtBQUFBIiwic291cmNlc0NvbnRlbnQiOltudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGxdfQ==
