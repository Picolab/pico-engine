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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJ1bGVzZXQgaW8ucGljb2xhYnMucGVyc2lzdGVudCB7XG4gIG1ldGEge1xuICAgIHNoYXJlcyBnZXROYW1lLCBnZXRBcHBWYXJcbiAgfVxuICBnbG9iYWwge1xuICAgIGdldE5hbWUgPSBmdW5jdGlvbigpe1xuICAgICAgZW50Om5hbWVcbiAgICB9XG4gICAgZ2V0QXBwVmFyID0gZnVuY3Rpb24oKXtcbiAgICAgIGFwcDphcHB2YXJcbiAgICB9XG4gIH1cbiAgcnVsZSBzdG9yZV9teV9uYW1lIHtcbiAgICBzZWxlY3Qgd2hlbiBzdG9yZSBuYW1lIG5hbWUgcmUjXiguKikkIyBzZXR0aW5nKG15X25hbWUpO1xuXG4gICAgc2VuZF9kaXJlY3RpdmUoXCJzdG9yZV9uYW1lXCIpIHdpdGhcbiAgICAgIG5hbWUgPSBteV9uYW1lXG5cbiAgICBhbHdheXMge1xuICAgICAgZW50Om5hbWUgPSBteV9uYW1lXG4gICAgfVxuICB9XG4gIHJ1bGUgc3RvcmVfYXBwdmFyIHtcbiAgICBzZWxlY3Qgd2hlbiBzdG9yZSBhcHB2YXIgYXBwdmFyIHJlI14oLiopJCMgc2V0dGluZyhteV9uYW1lKTtcblxuICAgIHNlbmRfZGlyZWN0aXZlKFwic3RvcmVfYXBwdmFyXCIpIHdpdGhcbiAgICAgIGFwcHZhciA9IG15X25hbWVcblxuICAgIGFsd2F5cyB7XG4gICAgICBhcHA6YXBwdmFyID0gbXlfbmFtZVxuICAgIH1cbiAgfVxufSIsImlvLnBpY29sYWJzLnBlcnNpc3RlbnQiLCJzaGFyZXMiLCJzaGFyZXMgZ2V0TmFtZSwgZ2V0QXBwVmFyIiwiZ2V0TmFtZSIsImdldEFwcFZhciIsImdldE5hbWUgPSBmdW5jdGlvbigpe1xuICAgICAgZW50Om5hbWVcbiAgICB9IiwiZnVuY3Rpb24oKXtcbiAgICAgIGVudDpuYW1lXG4gICAgfSIsImVudDpuYW1lIiwiZ2V0QXBwVmFyID0gZnVuY3Rpb24oKXtcbiAgICAgIGFwcDphcHB2YXJcbiAgICB9IiwiZnVuY3Rpb24oKXtcbiAgICAgIGFwcDphcHB2YXJcbiAgICB9IiwiYXBwOmFwcHZhciIsInJ1bGUgc3RvcmVfbXlfbmFtZSB7XG4gICAgc2VsZWN0IHdoZW4gc3RvcmUgbmFtZSBuYW1lIHJlI14oLiopJCMgc2V0dGluZyhteV9uYW1lKTtcblxuICAgIHNlbmRfZGlyZWN0aXZlKFwic3RvcmVfbmFtZVwiKSB3aXRoXG4gICAgICBuYW1lID0gbXlfbmFtZVxuXG4gICAgYWx3YXlzIHtcbiAgICAgIGVudDpuYW1lID0gbXlfbmFtZVxuICAgIH1cbiAgfSIsInN0b3JlX215X25hbWUiLCJzZWxlY3Qgd2hlbiBzdG9yZSBuYW1lIG5hbWUgcmUjXiguKikkIyBzZXR0aW5nKG15X25hbWUpIiwic3RvcmUgbmFtZSBuYW1lIHJlI14oLiopJCMgc2V0dGluZyhteV9uYW1lKSIsIm5hbWUgcmUjXiguKikkIyIsInJlI14oLiopJCMiLCJuYW1lIiwibXlfbmFtZSIsInNlbmRfZGlyZWN0aXZlKFwic3RvcmVfbmFtZVwiKSB3aXRoXG4gICAgICBuYW1lID0gbXlfbmFtZSIsImFsd2F5cyB7XG4gICAgICBlbnQ6bmFtZSA9IG15X25hbWVcbiAgICB9IiwiZW50Om5hbWUgPSBteV9uYW1lIiwicnVsZSBzdG9yZV9hcHB2YXIge1xuICAgIHNlbGVjdCB3aGVuIHN0b3JlIGFwcHZhciBhcHB2YXIgcmUjXiguKikkIyBzZXR0aW5nKG15X25hbWUpO1xuXG4gICAgc2VuZF9kaXJlY3RpdmUoXCJzdG9yZV9hcHB2YXJcIikgd2l0aFxuICAgICAgYXBwdmFyID0gbXlfbmFtZVxuXG4gICAgYWx3YXlzIHtcbiAgICAgIGFwcDphcHB2YXIgPSBteV9uYW1lXG4gICAgfVxuICB9Iiwic3RvcmVfYXBwdmFyIiwic2VsZWN0IHdoZW4gc3RvcmUgYXBwdmFyIGFwcHZhciByZSNeKC4qKSQjIHNldHRpbmcobXlfbmFtZSkiLCJzdG9yZSBhcHB2YXIgYXBwdmFyIHJlI14oLiopJCMgc2V0dGluZyhteV9uYW1lKSIsImFwcHZhciByZSNeKC4qKSQjIiwiYXBwdmFyIiwic2VuZF9kaXJlY3RpdmUoXCJzdG9yZV9hcHB2YXJcIikgd2l0aFxuICAgICAgYXBwdmFyID0gbXlfbmFtZSIsImFsd2F5cyB7XG4gICAgICBhcHA6YXBwdmFyID0gbXlfbmFtZVxuICAgIH0iLCJhcHA6YXBwdmFyID0gbXlfbmFtZSJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnRzIiwiY3R4Iiwic2NvcGUiLCJzZXQiLCJkYiIsImdldEVudFZhckZ1dHVyZSIsInBpY28iLCJpZCIsIndhaXQiLCJnZXRBcHBWYXJGdXR1cmUiLCJyaWQiLCJtYXRjaGVzIiwibSIsIlJlZ0V4cCIsImV4ZWMiLCJldmVudCIsImF0dHJzIiwibGVuZ3RoIiwicHVzaCIsImdldCIsInVuZGVmaW5lZCIsInB1dEVudFZhckZ1dHVyZSIsInB1dEFwcFZhckZ1dHVyZSJdLCJtYXBwaW5ncyI6IkFBQUFBLE1BQUEsQ0FBQUMsT0FBQTtBQUFBLEUsUUNBUSx3QkRBUjtBQUFBLEUsUUFBQTtBQUFBLElFRUksUUNBQTtBQUFBLE1DQU8sU0RBUDtBQUFBLE1FQWdCLFdGQWhCO0FBQUEsS0hGSjtBQUFBO0FBQUEsRSxVQUFBLFVBQUFDLEdBQUE7QUFBQSxJTUtJQSxHQUFBLENBQUFDLEtBQUEsQ0FBQUMsR0FBQSxDRkFBLFNFQUEsRUNBVSxVQUFBRixHQUFBO0FBQUEsYUNDUkEsR0FBQSxDQUFBRyxFQUFBLENBQUFDLGVBQUEsQ0FBQUosR0FBQSxDQUFBSyxJQUFBLENBQUFDLEVBQUEsVUFBQUMsSUFBQSxFRERRO0FBQUEsS0RBVixFTkxKO0FBQUEsSVNRSVAsR0FBQSxDQUFBQyxLQUFBLENBQUFDLEdBQUEsQ0pBQSxXSUFBLEVDQVksVUFBQUYsR0FBQTtBQUFBLGFDQ1ZBLEdBQUEsQ0FBQUcsRUFBQSxDQUFBSyxlQUFBLENBQUFSLEdBQUEsQ0FBQVMsR0FBQSxZQUFBRixJQUFBLEVERFU7QUFBQSxLREFaLEVUUko7QUFBQTtBQUFBLEUsU0FBQTtBQUFBLEksaUJZWUU7QUFBQSxNLFFDQUssZURBTDtBQUFBLE0sVUVDRTtBQUFBLFEsU0FBQSxFLFNBQUEsRSxRQUFBLEUsVUFBQTtBQUFBLFEsY0FBQTtBQUFBLFUsVUNBWSxVQUFBUCxHQUFBO0FBQUEsZ0JBQUFVLE9BQUE7QUFBQSxnQkFBQUMsQ0FBQTtBQUFBLFlDQVdBLENBQUEsR0NBSyxJQUFBQyxNQUFBLGVBQUFDLElGQWhCLENHQVdiLEdBQUEsQ0FBQWMsS0FBQSxDQUFBQyxLQUFBLFFIQVgsQ0NBVyxDREFYO0FBQUEsWUNBVyxLQUFBSixDQUFBO0FBQUEsMkJEQVg7QUFBQSxZQ0FXLElBQUFBLENBQUEsQ0FBQUssTUFBQTtBQUFBLGNBQUFOLE9BQUEsQ0FBQU8sSUFBQSxDQUFBTixDQUFBLEtEQVg7QUFBQSxZSUFtQ1gsR0FBQSxDQUFBQyxLQUFBLENBQUFDLEdBQUEsWUFBQVEsT0FBQSxLSkFuQztBQUFBO0FBQUEsV0RBWjtBQUFBO0FBQUEsUSxpQkFBQTtBQUFBLFU7O2NBQUEsUTtjQUFBLEs7Ozs7Z0JBQUEsSztnQkFBQSxROztjQUFBLE87O1dBQUE7QUFBQTtBQUFBLE9GREY7QUFBQSxNLGdCUUdFO0FBQUEsUSxXQUFBLFdBQUFWLEdBQUE7QUFBQTtBQUFBLGMsUUFBQTtBQUFBLGMsUUFBQTtBQUFBLGMsV0FBQSxFLFFEQ1NBLEdBQUEsQ0FBQUMsS0FBQSxDQUFBaUIsR0FBQSxXQ0RUO0FBQUE7QUFBQTtBQUFBLE9SSEY7QUFBQSxNLFlTTUU7QUFBQSxRLFNBQUFDLFNBQUE7QUFBQSxRLFlBQUFBLFNBQUE7QUFBQSxRLFVBQUEsVUFBQW5CLEdBQUE7QUFBQSxVQ0NFQSxHQUFBLENBQUFHLEVBQUEsQ0FBQWlCLGVBQUEsQ0FBQXBCLEdBQUEsQ0FBQUssSUFBQSxDQUFBQyxFQUFBLEVkQUEsTWNBQSxFSEFXTixHQUFBLENBQUFDLEtBQUEsQ0FBQWlCLEdBQUEsV0dBWCxFQUFBWCxJQUFBLEdEREY7QUFBQTtBQUFBLE9UTkY7QUFBQSxLWlpGO0FBQUEsSSxnQnVCc0JFO0FBQUEsTSxRQ0FLLGNEQUw7QUFBQSxNLFVFQ0U7QUFBQSxRLFNBQUEsRSxTQUFBLEUsVUFBQSxFLFVBQUE7QUFBQSxRLGNBQUE7QUFBQSxVLFVDQVksVUFBQVAsR0FBQTtBQUFBLGdCQUFBVSxPQUFBO0FBQUEsZ0JBQUFDLENBQUE7QUFBQSxZQ0FhQSxDQUFBLEdWQU8sSUFBQUMsTUFBQSxlQUFBQyxJU0FwQixDRUFhYixHQUFBLENBQUFjLEtBQUEsQ0FBQUMsS0FBQSxVRkFiLENDQWEsQ0RBYjtBQUFBLFlDQWEsS0FBQUosQ0FBQTtBQUFBLDJCREFiO0FBQUEsWUNBYSxJQUFBQSxDQUFBLENBQUFLLE1BQUE7QUFBQSxjQUFBTixPQUFBLENBQUFPLElBQUEsQ0FBQU4sQ0FBQSxLREFiO0FBQUEsWVBBdUNYLEdBQUEsQ0FBQUMsS0FBQSxDQUFBQyxHQUFBLFlBQUFRLE9BQUEsS09BdkM7QUFBQTtBQUFBLFdEQVo7QUFBQTtBQUFBLFEsaUJBQUE7QUFBQSxVOztjQUFBLFE7Y0FBQSxLOzs7O2dCQUFBLEs7Z0JBQUEsUTs7Y0FBQSxPOztXQUFBO0FBQUE7QUFBQSxPRkRGO0FBQUEsTSxnQk1HRTtBQUFBLFEsV0FBQSxXQUFBVixHQUFBO0FBQUE7QUFBQSxjLFFBQUE7QUFBQSxjLFFBQUE7QUFBQSxjLFdBQUEsRSxVVkNXQSxHQUFBLENBQUFDLEtBQUEsQ0FBQWlCLEdBQUEsV1VEWDtBQUFBO0FBQUE7QUFBQSxPTkhGO0FBQUEsTSxZT01FO0FBQUEsUSxTQUFBQyxTQUFBO0FBQUEsUSxZQUFBQSxTQUFBO0FBQUEsUSxVQUFBLFVBQUFuQixHQUFBO0FBQUEsVUNDRUEsR0FBQSxDQUFBRyxFQUFBLENBQUFrQixlQUFBLENBQUFyQixHQUFBLENBQUFTLEdBQUEsRXBCQUEsUW9CQUEsRVpBYVQsR0FBQSxDQUFBQyxLQUFBLENBQUFpQixHQUFBLFdZQWIsRUFBQVgsSUFBQSxHRERGO0FBQUE7QUFBQSxPUE5GO0FBQUEsS3ZCdEJGO0FBQUE7QUFBQSIsInNvdXJjZXNDb250ZW50IjpbbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsXX0=
