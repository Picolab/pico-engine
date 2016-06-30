module.exports = {
  'name': 'io.picolabs.persistent',
  'meta': {
    'shares': [
      'getName',
      'getAppVar'
    ]
  },
  'global': function (ctx) {
    ctx.scope.set('getName', function (ctx) {
      return ctx.db.getEntVarFuture(ctx.pico.id, 'name').wait();
    });
    ctx.scope.set('getAppVar', function (ctx) {
      return ctx.db.getAppVarFuture(ctx.rid, 'appvar').wait();
    });
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
            ctx.scope.set('my_name', matches[0]);
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
          ctx.db.putEntVarFuture(ctx.pico.id, 'name', ctx.scope.get('my_name')).wait();
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
            ctx.scope.set('my_name', matches[0]);
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
              'options': { 'appvar': ctx.scope.get('my_name') }
            };
          }]
      },
      'postlude': {
        'fired': undefined,
        'notfired': undefined,
        'always': function (ctx) {
          ctx.db.putAppVarFuture(ctx.rid, 'appvar', ctx.scope.get('my_name')).wait();
        }
      }
    }
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJ1bGVzZXQgaW8ucGljb2xhYnMucGVyc2lzdGVudCB7XG4gIG1ldGEge1xuICAgIHNoYXJlcyBnZXROYW1lLCBnZXRBcHBWYXJcbiAgfVxuICBnbG9iYWwge1xuICAgIGdldE5hbWUgPSBmdW5jdGlvbigpe1xuICAgICAgZW50Om5hbWVcbiAgICB9XG4gICAgZ2V0QXBwVmFyID0gZnVuY3Rpb24oKXtcbiAgICAgIGFwcDphcHB2YXJcbiAgICB9XG4gIH1cbiAgcnVsZSBzdG9yZV9teV9uYW1lIHtcbiAgICBzZWxlY3Qgd2hlbiBzdG9yZSBuYW1lIG5hbWUgcmUjXiguKikkIyBzZXR0aW5nKG15X25hbWUpO1xuXG4gICAgc2VuZF9kaXJlY3RpdmUoXCJzdG9yZV9uYW1lXCIpIHdpdGhcbiAgICAgIG5hbWUgPSBteV9uYW1lXG5cbiAgICBhbHdheXMge1xuICAgICAgc2V0IGVudDpuYW1lIG15X25hbWVcbiAgICB9XG4gIH1cbiAgcnVsZSBzdG9yZV9hcHB2YXIge1xuICAgIHNlbGVjdCB3aGVuIHN0b3JlIGFwcHZhciBhcHB2YXIgcmUjXiguKikkIyBzZXR0aW5nKG15X25hbWUpO1xuXG4gICAgc2VuZF9kaXJlY3RpdmUoXCJzdG9yZV9hcHB2YXJcIikgd2l0aFxuICAgICAgYXBwdmFyID0gbXlfbmFtZVxuXG4gICAgYWx3YXlzIHtcbiAgICAgIHNldCBhcHA6YXBwdmFyIG15X25hbWVcbiAgICB9XG4gIH1cbn0iLCJpby5waWNvbGFicy5wZXJzaXN0ZW50Iiwic2hhcmVzIiwic2hhcmVzIGdldE5hbWUsIGdldEFwcFZhciIsImdldE5hbWUiLCJnZXRBcHBWYXIiLCJnZXROYW1lID0gZnVuY3Rpb24oKXtcbiAgICAgIGVudDpuYW1lXG4gICAgfSIsImZ1bmN0aW9uKCl7XG4gICAgICBlbnQ6bmFtZVxuICAgIH0iLCJlbnQ6bmFtZSIsImdldEFwcFZhciA9IGZ1bmN0aW9uKCl7XG4gICAgICBhcHA6YXBwdmFyXG4gICAgfSIsImZ1bmN0aW9uKCl7XG4gICAgICBhcHA6YXBwdmFyXG4gICAgfSIsImFwcDphcHB2YXIiLCJydWxlIHN0b3JlX215X25hbWUge1xuICAgIHNlbGVjdCB3aGVuIHN0b3JlIG5hbWUgbmFtZSByZSNeKC4qKSQjIHNldHRpbmcobXlfbmFtZSk7XG5cbiAgICBzZW5kX2RpcmVjdGl2ZShcInN0b3JlX25hbWVcIikgd2l0aFxuICAgICAgbmFtZSA9IG15X25hbWVcblxuICAgIGFsd2F5cyB7XG4gICAgICBzZXQgZW50Om5hbWUgbXlfbmFtZVxuICAgIH1cbiAgfSIsInN0b3JlX215X25hbWUiLCJzZWxlY3Qgd2hlbiBzdG9yZSBuYW1lIG5hbWUgcmUjXiguKikkIyBzZXR0aW5nKG15X25hbWUpIiwic3RvcmUgbmFtZSBuYW1lIHJlI14oLiopJCMgc2V0dGluZyhteV9uYW1lKSIsIm5hbWUgcmUjXiguKikkIyIsInJlI14oLiopJCMiLCJuYW1lIiwibXlfbmFtZSIsInNlbmRfZGlyZWN0aXZlKFwic3RvcmVfbmFtZVwiKSB3aXRoXG4gICAgICBuYW1lID0gbXlfbmFtZSIsImFsd2F5cyB7XG4gICAgICBzZXQgZW50Om5hbWUgbXlfbmFtZVxuICAgIH0iLCJzZXQgZW50Om5hbWUgbXlfbmFtZSIsInJ1bGUgc3RvcmVfYXBwdmFyIHtcbiAgICBzZWxlY3Qgd2hlbiBzdG9yZSBhcHB2YXIgYXBwdmFyIHJlI14oLiopJCMgc2V0dGluZyhteV9uYW1lKTtcblxuICAgIHNlbmRfZGlyZWN0aXZlKFwic3RvcmVfYXBwdmFyXCIpIHdpdGhcbiAgICAgIGFwcHZhciA9IG15X25hbWVcblxuICAgIGFsd2F5cyB7XG4gICAgICBzZXQgYXBwOmFwcHZhciBteV9uYW1lXG4gICAgfVxuICB9Iiwic3RvcmVfYXBwdmFyIiwic2VsZWN0IHdoZW4gc3RvcmUgYXBwdmFyIGFwcHZhciByZSNeKC4qKSQjIHNldHRpbmcobXlfbmFtZSkiLCJzdG9yZSBhcHB2YXIgYXBwdmFyIHJlI14oLiopJCMgc2V0dGluZyhteV9uYW1lKSIsImFwcHZhciByZSNeKC4qKSQjIiwiYXBwdmFyIiwic2VuZF9kaXJlY3RpdmUoXCJzdG9yZV9hcHB2YXJcIikgd2l0aFxuICAgICAgYXBwdmFyID0gbXlfbmFtZSIsImFsd2F5cyB7XG4gICAgICBzZXQgYXBwOmFwcHZhciBteV9uYW1lXG4gICAgfSIsInNldCBhcHA6YXBwdmFyIG15X25hbWUiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0cyIsImN0eCIsInNjb3BlIiwic2V0IiwiZGIiLCJnZXRFbnRWYXJGdXR1cmUiLCJwaWNvIiwiaWQiLCJ3YWl0IiwiZ2V0QXBwVmFyRnV0dXJlIiwicmlkIiwibWF0Y2hlcyIsIm0iLCJSZWdFeHAiLCJleGVjIiwiZXZlbnQiLCJhdHRycyIsImxlbmd0aCIsInB1c2giLCJnZXQiLCJ1bmRlZmluZWQiLCJwdXRFbnRWYXJGdXR1cmUiLCJwdXRBcHBWYXJGdXR1cmUiXSwibWFwcGluZ3MiOiJBQUFBQSxNQUFBLENBQUFDLE9BQUE7QUFBQSxFLFFDQVEsd0JEQVI7QUFBQSxFLFFBQUE7QUFBQSxJRUVJLFFDQUE7QUFBQSxNQ0FPLFNEQVA7QUFBQSxNRUFnQixXRkFoQjtBQUFBLEtIRko7QUFBQTtBQUFBLEUsVUFBQSxVQUFBQyxHQUFBO0FBQUEsSU1LSUEsR0FBQSxDQUFBQyxLQUFBLENBQUFDLEdBQUEsQ0ZBQSxTRUFBLEVDQVUsVUFBQUYsR0FBQTtBQUFBLGFDQ1JBLEdBQUEsQ0FBQUcsRUFBQSxDQUFBQyxlQUFBLENBQUFKLEdBQUEsQ0FBQUssSUFBQSxDQUFBQyxFQUFBLFVBQUFDLElBQUEsRUREUTtBQUFBLEtEQVYsRU5MSjtBQUFBLElTUUlQLEdBQUEsQ0FBQUMsS0FBQSxDQUFBQyxHQUFBLENKQUEsV0lBQSxFQ0FZLFVBQUFGLEdBQUE7QUFBQSxhQ0NWQSxHQUFBLENBQUFHLEVBQUEsQ0FBQUssZUFBQSxDQUFBUixHQUFBLENBQUFTLEdBQUEsWUFBQUYsSUFBQSxFRERVO0FBQUEsS0RBWixFVFJKO0FBQUE7QUFBQSxFLFNBQUE7QUFBQSxJLGlCWVlFO0FBQUEsTSxRQ0FLLGVEQUw7QUFBQSxNLFVFQ0U7QUFBQSxRLFNBQUEsRSxTQUFBLEUsUUFBQSxFLFVBQUE7QUFBQSxRLGNBQUE7QUFBQSxVLFVDQVksVUFBQVAsR0FBQTtBQUFBLGdCQUFBVSxPQUFBO0FBQUEsZ0JBQUFDLENBQUE7QUFBQSxZQ0FXQSxDQUFBLEdDQUssSUFBQUMsTUFBQSxlQUFBQyxJRkFoQixDR0FXYixHQUFBLENBQUFjLEtBQUEsQ0FBQUMsS0FBQSxRSEFYLENDQVcsQ0RBWDtBQUFBLFlDQVcsS0FBQUosQ0FBQTtBQUFBLDJCREFYO0FBQUEsWUNBVyxJQUFBQSxDQUFBLENBQUFLLE1BQUE7QUFBQSxjQUFBTixPQUFBLENBQUFPLElBQUEsQ0FBQU4sQ0FBQSxLREFYO0FBQUEsWUlBbUNYLEdBQUEsQ0FBQUMsS0FBQSxDQUFBQyxHQUFBLFlBQUFRLE9BQUEsS0pBbkM7QUFBQTtBQUFBLFdEQVo7QUFBQTtBQUFBLFEsaUJBQUE7QUFBQSxVOztjQUFBLFE7Y0FBQSxLOzs7O2dCQUFBLEs7Z0JBQUEsUTs7Y0FBQSxPOztXQUFBO0FBQUE7QUFBQSxPRkRGO0FBQUEsTSxnQlFHRTtBQUFBLFEsV0FBQSxXQUFBVixHQUFBO0FBQUE7QUFBQSxjLFFBQUE7QUFBQSxjLFFBQUE7QUFBQSxjLFdBQUEsRSxRRENTQSxHQUFBLENBQUFDLEtBQUEsQ0FBQWlCLEdBQUEsV0NEVDtBQUFBO0FBQUE7QUFBQSxPUkhGO0FBQUEsTSxZU01FO0FBQUEsUSxTQUFBQyxTQUFBO0FBQUEsUSxZQUFBQSxTQUFBO0FBQUEsUSxVQUFBLFVBQUFuQixHQUFBO0FBQUEsVUNDRUEsR0FBQSxDQUFBRyxFQUFBLENBQUFpQixlQUFBLENBQUFwQixHQUFBLENBQUFLLElBQUEsQ0FBQUMsRUFBQSxFZEFJLE1jQUosRUhBYU4sR0FBQSxDQUFBQyxLQUFBLENBQUFpQixHQUFBLFdHQWIsRUFBQVgsSUFBQSxHRERGO0FBQUE7QUFBQSxPVE5GO0FBQUEsS1paRjtBQUFBLEksZ0J1QnNCRTtBQUFBLE0sUUNBSyxjREFMO0FBQUEsTSxVRUNFO0FBQUEsUSxTQUFBLEUsU0FBQSxFLFVBQUEsRSxVQUFBO0FBQUEsUSxjQUFBO0FBQUEsVSxVQ0FZLFVBQUFQLEdBQUE7QUFBQSxnQkFBQVUsT0FBQTtBQUFBLGdCQUFBQyxDQUFBO0FBQUEsWUNBYUEsQ0FBQSxHVkFPLElBQUFDLE1BQUEsZUFBQUMsSVNBcEIsQ0VBYWIsR0FBQSxDQUFBYyxLQUFBLENBQUFDLEtBQUEsVUZBYixDQ0FhLENEQWI7QUFBQSxZQ0FhLEtBQUFKLENBQUE7QUFBQSwyQkRBYjtBQUFBLFlDQWEsSUFBQUEsQ0FBQSxDQUFBSyxNQUFBO0FBQUEsY0FBQU4sT0FBQSxDQUFBTyxJQUFBLENBQUFOLENBQUEsS0RBYjtBQUFBLFlQQXVDWCxHQUFBLENBQUFDLEtBQUEsQ0FBQUMsR0FBQSxZQUFBUSxPQUFBLEtPQXZDO0FBQUE7QUFBQSxXREFaO0FBQUE7QUFBQSxRLGlCQUFBO0FBQUEsVTs7Y0FBQSxRO2NBQUEsSzs7OztnQkFBQSxLO2dCQUFBLFE7O2NBQUEsTzs7V0FBQTtBQUFBO0FBQUEsT0ZERjtBQUFBLE0sZ0JNR0U7QUFBQSxRLFdBQUEsV0FBQVYsR0FBQTtBQUFBO0FBQUEsYyxRQUFBO0FBQUEsYyxRQUFBO0FBQUEsYyxXQUFBLEUsVVZDV0EsR0FBQSxDQUFBQyxLQUFBLENBQUFpQixHQUFBLFdVRFg7QUFBQTtBQUFBO0FBQUEsT05IRjtBQUFBLE0sWU9NRTtBQUFBLFEsU0FBQUMsU0FBQTtBQUFBLFEsWUFBQUEsU0FBQTtBQUFBLFEsVUFBQSxVQUFBbkIsR0FBQTtBQUFBLFVDQ0VBLEdBQUEsQ0FBQUcsRUFBQSxDQUFBa0IsZUFBQSxDQUFBckIsR0FBQSxDQUFBUyxHQUFBLEVwQkFJLFFvQkFKLEVaQWVULEdBQUEsQ0FBQUMsS0FBQSxDQUFBaUIsR0FBQSxXWUFmLEVBQUFYLElBQUEsR0RERjtBQUFBO0FBQUEsT1BORjtBQUFBLEt2QnRCRjtBQUFBO0FBQUEiLCJzb3VyY2VzQ29udGVudCI6W251bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbF19
