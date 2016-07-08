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
                new ctx.krl.RegExp('^(.*)$', '')
              ]]);
            if (!matches)
              return false;
            ctx.scope.set('my_name', new ctx.krl.String(matches[0]));
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
                new ctx.krl.RegExp('^(.*)$', '')
              ]]);
            if (!matches)
              return false;
            ctx.scope.set('my_appvar', new ctx.krl.String(matches[0]));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJ1bGVzZXQgaW8ucGljb2xhYnMucGVyc2lzdGVudCB7XG4gIG1ldGEge1xuICAgIHNoYXJlcyBnZXROYW1lLCBnZXRBcHBWYXJcbiAgfVxuICBnbG9iYWwge1xuICAgIGdldE5hbWUgPSBmdW5jdGlvbigpe1xuICAgICAgZW50Om5hbWVcbiAgICB9XG4gICAgZ2V0QXBwVmFyID0gZnVuY3Rpb24oKXtcbiAgICAgIGFwcDphcHB2YXJcbiAgICB9XG4gIH1cbiAgcnVsZSBzdG9yZV9teV9uYW1lIHtcbiAgICBzZWxlY3Qgd2hlbiBzdG9yZSBuYW1lIG5hbWUgcmUjXiguKikkIyBzZXR0aW5nKG15X25hbWUpO1xuXG4gICAgc2VuZF9kaXJlY3RpdmUoXCJzdG9yZV9uYW1lXCIpIHdpdGhcbiAgICAgIG5hbWUgPSBteV9uYW1lXG5cbiAgICBhbHdheXMge1xuICAgICAgZW50Om5hbWUgPSBteV9uYW1lXG4gICAgfVxuICB9XG4gIHJ1bGUgc3RvcmVfYXBwdmFyIHtcbiAgICBzZWxlY3Qgd2hlbiBzdG9yZSBhcHB2YXIgYXBwdmFyIHJlI14oLiopJCMgc2V0dGluZyhteV9hcHB2YXIpO1xuXG4gICAgc2VuZF9kaXJlY3RpdmUoXCJzdG9yZV9hcHB2YXJcIikgd2l0aFxuICAgICAgYXBwdmFyID0gbXlfYXBwdmFyXG5cbiAgICBhbHdheXMge1xuICAgICAgYXBwOmFwcHZhciA9IG15X2FwcHZhclxuICAgIH1cbiAgfVxufSIsImlvLnBpY29sYWJzLnBlcnNpc3RlbnQiLCJzaGFyZXMiLCJzaGFyZXMgZ2V0TmFtZSwgZ2V0QXBwVmFyIiwiZ2V0TmFtZSIsImdldEFwcFZhciIsImdldE5hbWUgPSBmdW5jdGlvbigpe1xuICAgICAgZW50Om5hbWVcbiAgICB9IiwiZnVuY3Rpb24oKXtcbiAgICAgIGVudDpuYW1lXG4gICAgfSIsImVudDpuYW1lIiwiZ2V0QXBwVmFyID0gZnVuY3Rpb24oKXtcbiAgICAgIGFwcDphcHB2YXJcbiAgICB9IiwiZnVuY3Rpb24oKXtcbiAgICAgIGFwcDphcHB2YXJcbiAgICB9IiwiYXBwOmFwcHZhciIsInJ1bGUgc3RvcmVfbXlfbmFtZSB7XG4gICAgc2VsZWN0IHdoZW4gc3RvcmUgbmFtZSBuYW1lIHJlI14oLiopJCMgc2V0dGluZyhteV9uYW1lKTtcblxuICAgIHNlbmRfZGlyZWN0aXZlKFwic3RvcmVfbmFtZVwiKSB3aXRoXG4gICAgICBuYW1lID0gbXlfbmFtZVxuXG4gICAgYWx3YXlzIHtcbiAgICAgIGVudDpuYW1lID0gbXlfbmFtZVxuICAgIH1cbiAgfSIsInN0b3JlX215X25hbWUiLCJzZWxlY3Qgd2hlbiBzdG9yZSBuYW1lIG5hbWUgcmUjXiguKikkIyBzZXR0aW5nKG15X25hbWUpIiwic3RvcmUgbmFtZSBuYW1lIHJlI14oLiopJCMgc2V0dGluZyhteV9uYW1lKSIsIm5hbWUgcmUjXiguKikkIyIsIm5hbWUiLCJyZSNeKC4qKSQjIiwibXlfbmFtZSIsInNlbmRfZGlyZWN0aXZlKFwic3RvcmVfbmFtZVwiKSB3aXRoXG4gICAgICBuYW1lID0gbXlfbmFtZSIsImFsd2F5cyB7XG4gICAgICBlbnQ6bmFtZSA9IG15X25hbWVcbiAgICB9IiwiZW50Om5hbWUgPSBteV9uYW1lIiwicnVsZSBzdG9yZV9hcHB2YXIge1xuICAgIHNlbGVjdCB3aGVuIHN0b3JlIGFwcHZhciBhcHB2YXIgcmUjXiguKikkIyBzZXR0aW5nKG15X2FwcHZhcik7XG5cbiAgICBzZW5kX2RpcmVjdGl2ZShcInN0b3JlX2FwcHZhclwiKSB3aXRoXG4gICAgICBhcHB2YXIgPSBteV9hcHB2YXJcblxuICAgIGFsd2F5cyB7XG4gICAgICBhcHA6YXBwdmFyID0gbXlfYXBwdmFyXG4gICAgfVxuICB9Iiwic3RvcmVfYXBwdmFyIiwic2VsZWN0IHdoZW4gc3RvcmUgYXBwdmFyIGFwcHZhciByZSNeKC4qKSQjIHNldHRpbmcobXlfYXBwdmFyKSIsInN0b3JlIGFwcHZhciBhcHB2YXIgcmUjXiguKikkIyBzZXR0aW5nKG15X2FwcHZhcikiLCJhcHB2YXIgcmUjXiguKikkIyIsImFwcHZhciIsIm15X2FwcHZhciIsInNlbmRfZGlyZWN0aXZlKFwic3RvcmVfYXBwdmFyXCIpIHdpdGhcbiAgICAgIGFwcHZhciA9IG15X2FwcHZhciIsImFsd2F5cyB7XG4gICAgICBhcHA6YXBwdmFyID0gbXlfYXBwdmFyXG4gICAgfSIsImFwcDphcHB2YXIgPSBteV9hcHB2YXIiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0cyIsImN0eCIsInNjb3BlIiwic2V0Iiwia3JsIiwiQ2xvc3VyZSIsInBlcnNpc3RlbnQiLCJnZXRFbnQiLCJnZXRBcHAiLCJtYXRjaGVzIiwiZXZlbnQiLCJhdHRycyIsImdldE1hdGNoZXMiLCJSZWdFeHAiLCJTdHJpbmciLCJnZXQiLCJ1bmRlZmluZWQiLCJwdXRFbnQiLCJwdXRBcHAiXSwibWFwcGluZ3MiOiJBQUFBQSxNQUFBLENBQUFDLE9BQUE7QUFBQSxFLFFDQVEsd0JEQVI7QUFBQSxFLFFBQUE7QUFBQSxJRUVJLFFDQUE7QUFBQSxNQ0FPLFNEQVA7QUFBQSxNRUFnQixXRkFoQjtBQUFBLEtIRko7QUFBQTtBQUFBLEUsVUFBQSxVQUFBQyxHQUFBO0FBQUEsSU1LSUEsR0FBQSxDQUFBQyxLQUFBLENBQUFDLEdBQUEsQ0ZBQSxTRUFBLEVDQVVGLEdBQUEsQ0FBQUcsR0FBQSxDQUFBQyxPQUFBLENBQUFKLEdBQUEsWUFBQUEsR0FBQTtBQUFBLGFDQ1JBLEdBQUEsQ0FBQUssVUFBQSxDQUFBQyxNQUFBLFFERFE7QUFBQSxNREFWLEVOTEo7QUFBQSxJU1FJTixHQUFBLENBQUFDLEtBQUEsQ0FBQUMsR0FBQSxDSkFBLFdJQUEsRUNBWUYsR0FBQSxDQUFBRyxHQUFBLENBQUFDLE9BQUEsQ0FBQUosR0FBQSxZQUFBQSxHQUFBO0FBQUEsYUNDVkEsR0FBQSxDQUFBSyxVQUFBLENBQUFFLE1BQUEsVUREVTtBQUFBLE1EQVosRVRSSjtBQUFBO0FBQUEsRSxTQUFBO0FBQUEsSSxpQllZRTtBQUFBLE0sUUNBSyxlREFMO0FBQUEsTSxVRUNFO0FBQUEsUSxTQUFBLEUsU0FBQSxFLFFBQUEsRSxVQUFBO0FBQUEsUSxjQUFBO0FBQUEsVSxVQ0FZLFVBQUFQLEdBQUE7QUFBQSxnQkFBQVEsT0FBQSxHQUFBUixHQUFBLENBQUFTLEtBQUEsQ0FBQUMsS0FBQSxDQUFBQyxVQUFBLEVDQVc7QUFBQSxnQkNBQSxNREFBO0FBQUEsZ0JFQUssSUFBQVgsR0FBQSxDQUFBRyxHQUFBLENBQUFTLE1BQUEsY0ZBTDtBQUFBLGVEQVg7QUFBQSxpQkFBQUosT0FBQTtBQUFBO0FBQUEsWUlBbUNSLEdBQUEsQ0FBQUMsS0FBQSxDQUFBQyxHQUFBLFlKQW5DLElBQUFGLEdBQUEsQ0FBQUcsR0FBQSxDQUFBVSxNQUFBLENJQW1DTCxPQUFBLEdKQW5DLENJQW1DLEVKQW5DO0FBQUE7QUFBQSxXREFaO0FBQUE7QUFBQSxRLGlCQUFBO0FBQUEsVTs7Y0FBQSxRO2NBQUEsSzs7OztnQkFBQSxLO2dCQUFBLFE7O2NBQUEsTzs7V0FBQTtBQUFBO0FBQUEsT0ZERjtBQUFBLE0sZ0JRR0U7QUFBQSxRLFdBQUEsV0FBQVIsR0FBQTtBQUFBO0FBQUEsYyxRQUFBO0FBQUEsYyxRQUFBO0FBQUEsYyxXQUFBLEUsUURDU0EsR0FBQSxDQUFBQyxLQUFBLENBQUFhLEdBQUEsV0NEVDtBQUFBO0FBQUE7QUFBQSxPUkhGO0FBQUEsTSxZU01FO0FBQUEsUSxTQUFBQyxTQUFBO0FBQUEsUSxZQUFBQSxTQUFBO0FBQUEsUSxVQUFBLFVBQUFmLEdBQUE7QUFBQSxVQ0NFQSxHQUFBLENBQUFLLFVBQUEsQ0FBQVcsTUFBQSxDZEFBLE1jQUEsRUhBV2hCLEdBQUEsQ0FBQUMsS0FBQSxDQUFBYSxHQUFBLFdHQVgsRURERjtBQUFBO0FBQUEsT1RORjtBQUFBLEtaWkY7QUFBQSxJLGdCdUJzQkU7QUFBQSxNLFFDQUssY0RBTDtBQUFBLE0sVUVDRTtBQUFBLFEsU0FBQSxFLFNBQUEsRSxVQUFBLEUsVUFBQTtBQUFBLFEsY0FBQTtBQUFBLFUsVUNBWSxVQUFBZCxHQUFBO0FBQUEsZ0JBQUFRLE9BQUEsR0FBQVIsR0FBQSxDQUFBUyxLQUFBLENBQUFDLEtBQUEsQ0FBQUMsVUFBQSxFQ0FhO0FBQUEsZ0JDQUEsUURBQTtBQUFBLGdCVEFPLElBQUFYLEdBQUEsQ0FBQUcsR0FBQSxDQUFBUyxNQUFBLGNTQVA7QUFBQSxlREFiO0FBQUEsaUJBQUFKLE9BQUE7QUFBQTtBQUFBLFlHQXVDUixHQUFBLENBQUFDLEtBQUEsQ0FBQUMsR0FBQSxjSEF2QyxJQUFBRixHQUFBLENBQUFHLEdBQUEsQ0FBQVUsTUFBQSxDR0F1Q0wsT0FBQSxHSEF2QyxDR0F1QyxFSEF2QztBQUFBO0FBQUEsV0RBWjtBQUFBO0FBQUEsUSxpQkFBQTtBQUFBLFU7O2NBQUEsUTtjQUFBLEs7Ozs7Z0JBQUEsSztnQkFBQSxROztjQUFBLE87O1dBQUE7QUFBQTtBQUFBLE9GREY7QUFBQSxNLGdCT0dFO0FBQUEsUSxXQUFBLFdBQUFSLEdBQUE7QUFBQTtBQUFBLGMsUUFBQTtBQUFBLGMsUUFBQTtBQUFBLGMsV0FBQSxFLFVEQ1dBLEdBQUEsQ0FBQUMsS0FBQSxDQUFBYSxHQUFBLGFDRFg7QUFBQTtBQUFBO0FBQUEsT1BIRjtBQUFBLE0sWVFNRTtBQUFBLFEsU0FBQUMsU0FBQTtBQUFBLFEsWUFBQUEsU0FBQTtBQUFBLFEsVUFBQSxVQUFBZixHQUFBO0FBQUEsVUNDRUEsR0FBQSxDQUFBSyxVQUFBLENBQUFZLE1BQUEsQ3JCQUEsUXFCQUEsRUhBYWpCLEdBQUEsQ0FBQUMsS0FBQSxDQUFBYSxHQUFBLGFHQWIsRURERjtBQUFBO0FBQUEsT1JORjtBQUFBLEt2QnRCRjtBQUFBO0FBQUEiLCJzb3VyY2VzQ29udGVudCI6W251bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsXX0=
