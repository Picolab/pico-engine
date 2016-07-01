module.exports = {
  'name': 'io.picolabs.scope',
  'meta': {
    'name': 'testing scope',
    'shares': ['getVals']
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJ1bGVzZXQgaW8ucGljb2xhYnMuc2NvcGUge1xuICBtZXRhIHtcbiAgICBuYW1lIFwidGVzdGluZyBzY29wZVwiXG4gICAgc2hhcmVzIGdldFZhbHNcbiAgfVxuICBnbG9iYWwge1xuICAgIGcwID0gXCJnbG9iYWwgMFwiIFxuICAgIGdldFZhbHMgPSBmdW5jdGlvbigpe1xuICAgICAge1xuICAgICAgICBcIm5hbWVcIjogZW50OmVudF92YXJfbmFtZSxcbiAgICAgICAgXCJwMFwiOiBlbnQ6ZW50X3Zhcl9wMCxcbiAgICAgICAgXCJwMVwiOiBlbnQ6ZW50X3Zhcl9wMVxuICAgICAgfVxuICAgIH1cbiAgfVxuICBydWxlIGV2ZW50ZXgge1xuICAgIHNlbGVjdCB3aGVuXG4gICAgICBzY29wZSBldmVudDAgbmFtZSByZSNeKC4qKSQjIHNldHRpbmcobXlfbmFtZSlcbiAgICAgIG9yXG4gICAgICBzY29wZSBldmVudDE7XG4gICAgc2VuZF9kaXJlY3RpdmUoXCJzYXlcIikgd2l0aFxuICAgICAgbmFtZSA9IG15X25hbWVcbiAgfVxuICBydWxlIHByZWx1ZGVfc2NvcGUge1xuICAgIHNlbGVjdCB3aGVuIHNjb3BlIHByZWx1ZGUgbmFtZSByZSNeKC4qKSQjIHNldHRpbmcobmFtZSk7XG5cbiAgICBwcmUge1xuICAgICAgcDAgPSBcInByZWx1ZGUgMFwiXG4gICAgICBwMSA9IFwicHJlbHVkZSAxXCJcbiAgICB9XG5cbiAgICBzZW5kX2RpcmVjdGl2ZShcInNheVwiKSB3aXRoXG4gICAgICBuYW1lID0gbmFtZVxuICAgICAgcDAgPSBwMFxuICAgICAgcDEgPSBwMVxuICAgICAgZzAgPSBnMFxuXG4gICAgYWx3YXlzIHtcbiAgICAgIGVudDplbnRfdmFyX25hbWUgPSBuYW1lO1xuICAgICAgZW50OmVudF92YXJfcDAgPSBwMDtcbiAgICAgIGVudDplbnRfdmFyX3AxID0gcDFcbiAgICB9XG4gIH1cbn0iLCJpby5waWNvbGFicy5zY29wZSIsIm5hbWUiLCJuYW1lIFwidGVzdGluZyBzY29wZVwiIiwiXCJ0ZXN0aW5nIHNjb3BlXCIiLCJzaGFyZXMiLCJzaGFyZXMgZ2V0VmFscyIsImdldFZhbHMiLCJnMCA9IFwiZ2xvYmFsIDBcIiIsImcwIiwiXCJnbG9iYWwgMFwiIiwiZ2V0VmFscyA9IGZ1bmN0aW9uKCl7XG4gICAgICB7XG4gICAgICAgIFwibmFtZVwiOiBlbnQ6ZW50X3Zhcl9uYW1lLFxuICAgICAgICBcInAwXCI6IGVudDplbnRfdmFyX3AwLFxuICAgICAgICBcInAxXCI6IGVudDplbnRfdmFyX3AxXG4gICAgICB9XG4gICAgfSIsImZ1bmN0aW9uKCl7XG4gICAgICB7XG4gICAgICAgIFwibmFtZVwiOiBlbnQ6ZW50X3Zhcl9uYW1lLFxuICAgICAgICBcInAwXCI6IGVudDplbnRfdmFyX3AwLFxuICAgICAgICBcInAxXCI6IGVudDplbnRfdmFyX3AxXG4gICAgICB9XG4gICAgfSIsIntcbiAgICAgICAgXCJuYW1lXCI6IGVudDplbnRfdmFyX25hbWUsXG4gICAgICAgIFwicDBcIjogZW50OmVudF92YXJfcDAsXG4gICAgICAgIFwicDFcIjogZW50OmVudF92YXJfcDFcbiAgICAgIH0iLCJcIm5hbWVcIiIsIlwibmFtZVwiOiBlbnQ6ZW50X3Zhcl9uYW1lIiwiZW50OmVudF92YXJfbmFtZSIsIlwicDBcIiIsIlwicDBcIjogZW50OmVudF92YXJfcDAiLCJlbnQ6ZW50X3Zhcl9wMCIsIlwicDFcIiIsIlwicDFcIjogZW50OmVudF92YXJfcDEiLCJlbnQ6ZW50X3Zhcl9wMSIsInJ1bGUgZXZlbnRleCB7XG4gICAgc2VsZWN0IHdoZW5cbiAgICAgIHNjb3BlIGV2ZW50MCBuYW1lIHJlI14oLiopJCMgc2V0dGluZyhteV9uYW1lKVxuICAgICAgb3JcbiAgICAgIHNjb3BlIGV2ZW50MTtcbiAgICBzZW5kX2RpcmVjdGl2ZShcInNheVwiKSB3aXRoXG4gICAgICBuYW1lID0gbXlfbmFtZVxuICB9IiwiZXZlbnRleCIsInNlbGVjdCB3aGVuXG4gICAgICBzY29wZSBldmVudDAgbmFtZSByZSNeKC4qKSQjIHNldHRpbmcobXlfbmFtZSlcbiAgICAgIG9yXG4gICAgICBzY29wZSBldmVudDEiLCJzY29wZSBldmVudDAgbmFtZSByZSNeKC4qKSQjIHNldHRpbmcobXlfbmFtZSkiLCJuYW1lIHJlI14oLiopJCMiLCJyZSNeKC4qKSQjIiwibXlfbmFtZSIsInNjb3BlIGV2ZW50MSIsInNlbmRfZGlyZWN0aXZlKFwic2F5XCIpIHdpdGhcbiAgICAgIG5hbWUgPSBteV9uYW1lIiwicnVsZSBwcmVsdWRlX3Njb3BlIHtcbiAgICBzZWxlY3Qgd2hlbiBzY29wZSBwcmVsdWRlIG5hbWUgcmUjXiguKikkIyBzZXR0aW5nKG5hbWUpO1xuXG4gICAgcHJlIHtcbiAgICAgIHAwID0gXCJwcmVsdWRlIDBcIlxuICAgICAgcDEgPSBcInByZWx1ZGUgMVwiXG4gICAgfVxuXG4gICAgc2VuZF9kaXJlY3RpdmUoXCJzYXlcIikgd2l0aFxuICAgICAgbmFtZSA9IG5hbWVcbiAgICAgIHAwID0gcDBcbiAgICAgIHAxID0gcDFcbiAgICAgIGcwID0gZzBcblxuICAgIGFsd2F5cyB7XG4gICAgICBlbnQ6ZW50X3Zhcl9uYW1lID0gbmFtZTtcbiAgICAgIGVudDplbnRfdmFyX3AwID0gcDA7XG4gICAgICBlbnQ6ZW50X3Zhcl9wMSA9IHAxXG4gICAgfVxuICB9IiwicHJlbHVkZV9zY29wZSIsInNlbGVjdCB3aGVuIHNjb3BlIHByZWx1ZGUgbmFtZSByZSNeKC4qKSQjIHNldHRpbmcobmFtZSkiLCJzY29wZSBwcmVsdWRlIG5hbWUgcmUjXiguKikkIyBzZXR0aW5nKG5hbWUpIiwicDAgPSBcInByZWx1ZGUgMFwiIiwicDAiLCJcInByZWx1ZGUgMFwiIiwicDEgPSBcInByZWx1ZGUgMVwiIiwicDEiLCJcInByZWx1ZGUgMVwiIiwic2VuZF9kaXJlY3RpdmUoXCJzYXlcIikgd2l0aFxuICAgICAgbmFtZSA9IG5hbWVcbiAgICAgIHAwID0gcDBcbiAgICAgIHAxID0gcDFcbiAgICAgIGcwID0gZzAiLCJhbHdheXMge1xuICAgICAgZW50OmVudF92YXJfbmFtZSA9IG5hbWU7XG4gICAgICBlbnQ6ZW50X3Zhcl9wMCA9IHAwO1xuICAgICAgZW50OmVudF92YXJfcDEgPSBwMVxuICAgIH0iLCJlbnQ6ZW50X3Zhcl9uYW1lID0gbmFtZSIsImVudDplbnRfdmFyX3AwID0gcDAiLCJlbnQ6ZW50X3Zhcl9wMSA9IHAxIl0sIm5hbWVzIjpbIm1vZHVsZSIsImV4cG9ydHMiLCJjdHgiLCJzY29wZSIsInNldCIsImRiIiwiZ2V0RW50VmFyRnV0dXJlIiwicGljbyIsImlkIiwid2FpdCIsIm1hdGNoZXMiLCJtIiwiUmVnRXhwIiwiZXhlYyIsImV2ZW50IiwiYXR0cnMiLCJsZW5ndGgiLCJwdXNoIiwiZ2V0IiwidW5kZWZpbmVkIiwicHV0RW50VmFyRnV0dXJlIl0sIm1hcHBpbmdzIjoiQUFBQUEsTUFBQSxDQUFBQyxPQUFBO0FBQUEsRSxRQ0FRLG1CREFSO0FBQUEsRSxRQUFBO0FBQUEsSUVFSSxNQ0FBLEVDQUssZUpGVDtBQUFBLElLR0ksUUNBQSxHQ0FPLFNEQVAsQ05ISjtBQUFBO0FBQUEsRSxVQUFBLFVBQUFDLEdBQUE7QUFBQSxJUU1JQSxHQUFBLENBQUFDLEtBQUEsQ0FBQUMsR0FBQSxDQ0FBLElEQUEsRUVBSyxVRkFMLEVSTko7QUFBQSxJV09JRixHQUFBLENBQUFDLEtBQUEsQ0FBQUMsR0FBQSxDSkFBLFNJQUEsRUNBVSxVQUFBRixHQUFBO0FBQUEsYUNDUjtBQUFBLFFDQ0UsTUNBQSxFQ0FRQSxHQUFBLENBQUFHLEVBQUEsQ0FBQUMsZUFBQSxDQUFBSixHQUFBLENBQUFLLElBQUEsQ0FBQUMsRUFBQSxrQkFBQUMsSUFBQSxFSERWO0FBQUEsUUlFRSxJQ0FBLEVDQU1QLEdBQUEsQ0FBQUcsRUFBQSxDQUFBQyxlQUFBLENBQUFKLEdBQUEsQ0FBQUssSUFBQSxDQUFBQyxFQUFBLGdCQUFBQyxJQUFBLEVORlI7QUFBQSxRT0dFLElDQUEsRUNBTVAsR0FBQSxDQUFBRyxFQUFBLENBQUFDLGVBQUEsQ0FBQUosR0FB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RjtBQUFBLE0sWVdjRTtBQUFBLFEsU0FBQUMsU0FBQTtBQUFBLFEsWUFBQUEsU0FBQTtBQUFBLFEsVUFBQSxVQUFBakIsR0FBQTtBQUFBLFVDQ0VBLEdBQUEsQ0FBQUcsRUFBQSxDQUFBZSxlQUFBLENBQUFsQixHQUFBLENBQUFLLElBQUEsQ0FBQUMsRUFBQSxFNUJBQSxjNEJBQSxFMUNBbUJOLEdBQUEsQ0FBQUMsS0FBQSxDQUFBZSxHQUFBLFEwQ0FuQixFQUFBVCxJQUFBLEdEREY7QUFBQSxVRUVFUCxHQUFBLENBQUFHLEVBQUEsQ0FBQWUsZUFBQSxDQUFBbEIsR0FBQSxDQUFBSyxJQUFBLENBQUFDLEVBQUEsRTFCQUEsWTBCQUEsRVJBaUJOLEdBQUEsQ0FBQUMsS0FBQSxDQUFBZSxHQUFBLE1RQWpCLEVBQUFULElBQUEsR0ZGRjtBQUFBLFVHR0VQLEdBQUEsQ0FBQUcsRUFBQSxDQUFBZSxlQUFBLENBQUFsQixHQUFBLENBQUFLLElBQUEsQ0FBQUMsRUFBQSxFeEJBQSxZd0JBQSxFTkFpQk4sR0FBQSxDQUFBQyxLQUFBLENBQUFlLEdBQUEsTU1BakIsRUFBQVQsSUFBQSxHSEhGO0FBQUE7QUFBQSxPWGRGO0FBQUEsS2hDdkJGO0FBQUE7QUFBQSIsInNvdXJjZXNDb250ZW50IjpbbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsXX0=
