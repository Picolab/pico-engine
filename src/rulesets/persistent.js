var getName = function (ctx) {
  return ctx.db.getEntVarFuture(ctx.pico.id, 'name').wait();
};
var getAppVar = function (ctx) {
  return ctx.db.getAppVarFuture(ctx.rid, 'appvar').wait();
};
module.exports = {
  'name': 'io.picolabs.persistent',
  'meta': {
    'shares': {
      'getName': getName,
      'getAppVar': getAppVar
    }
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
            ctx.vars.my_name = matches[0];
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
              'options': { 'name': ctx.vars.my_name }
            };
          }]
      },
      'postlude': {
        'fired': undefined,
        'notfired': undefined,
        'always': function (ctx) {
          ctx.db.putEntVarFuture(ctx.pico.id, 'name', ctx.vars.my_name).wait();
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
            ctx.vars.my_name = matches[0];
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
              'options': { 'appvar': ctx.vars.my_name }
            };
          }]
      },
      'postlude': {
        'fired': undefined,
        'notfired': undefined,
        'always': function (ctx) {
          ctx.db.putAppVarFuture(ctx.rid, 'appvar', ctx.vars.my_name).wait();
        }
      }
    }
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImdldE5hbWUgPSBmdW5jdGlvbigpe1xuICAgICAgZW50Om5hbWVcbiAgICB9IiwiZ2V0TmFtZSIsImZ1bmN0aW9uKCl7XG4gICAgICBlbnQ6bmFtZVxuICAgIH0iLCJlbnQ6bmFtZSIsInJ1bGVzZXQgaW8ucGljb2xhYnMucGVyc2lzdGVudCB7XG4gIG1ldGEge1xuICAgIHNoYXJlcyBnZXROYW1lLCBnZXRBcHBWYXJcbiAgfVxuICBnbG9iYWwge1xuICAgIGdldE5hbWUgPSBmdW5jdGlvbigpe1xuICAgICAgZW50Om5hbWVcbiAgICB9XG4gICAgZ2V0QXBwVmFyID0gZnVuY3Rpb24oKXtcbiAgICAgIGFwcDphcHB2YXJcbiAgICB9XG4gIH1cbiAgcnVsZSBzdG9yZV9teV9uYW1lIHtcbiAgICBzZWxlY3Qgd2hlbiBzdG9yZSBuYW1lIG5hbWUgcmUjXiguKikkIyBzZXR0aW5nKG15X25hbWUpO1xuXG4gICAgc2VuZF9kaXJlY3RpdmUoXCJzdG9yZV9uYW1lXCIpIHdpdGhcbiAgICAgIG5hbWUgPSBteV9uYW1lXG5cbiAgICBhbHdheXMge1xuICAgICAgc2V0IGVudDpuYW1lIG15X25hbWVcbiAgICB9XG4gIH1cbiAgcnVsZSBzdG9yZV9hcHB2YXIge1xuICAgIHNlbGVjdCB3aGVuIHN0b3JlIGFwcHZhciBhcHB2YXIgcmUjXiguKikkIyBzZXR0aW5nKG15X25hbWUpO1xuXG4gICAgc2VuZF9kaXJlY3RpdmUoXCJzdG9yZV9hcHB2YXJcIikgd2l0aFxuICAgICAgYXBwdmFyID0gbXlfbmFtZVxuXG4gICAgYWx3YXlzIHtcbiAgICAgIHNldCBhcHA6YXBwdmFyIG15X25hbWVcbiAgICB9XG4gIH1cbn0iLCJnZXRBcHBWYXIgPSBmdW5jdGlvbigpe1xuICAgICAgYXBwOmFwcHZhclxuICAgIH0iLCJnZXRBcHBWYXIiLCJmdW5jdGlvbigpe1xuICAgICAgYXBwOmFwcHZhclxuICAgIH0iLCJhcHA6YXBwdmFyIiwiaW8ucGljb2xhYnMucGVyc2lzdGVudCIsInNoYXJlcyIsInNoYXJlcyBnZXROYW1lLCBnZXRBcHBWYXIiLCJydWxlIHN0b3JlX215X25hbWUge1xuICAgIHNlbGVjdCB3aGVuIHN0b3JlIG5hbWUgbmFtZSByZSNeKC4qKSQjIHNldHRpbmcobXlfbmFtZSk7XG5cbiAgICBzZW5kX2RpcmVjdGl2ZShcInN0b3JlX25hbWVcIikgd2l0aFxuICAgICAgbmFtZSA9IG15X25hbWVcblxuICAgIGFsd2F5cyB7XG4gICAgICBzZXQgZW50Om5hbWUgbXlfbmFtZVxuICAgIH1cbiAgfSIsInN0b3JlX215X25hbWUiLCJzZWxlY3Qgd2hlbiBzdG9yZSBuYW1lIG5hbWUgcmUjXiguKikkIyBzZXR0aW5nKG15X25hbWUpIiwic3RvcmUgbmFtZSBuYW1lIHJlI14oLiopJCMgc2V0dGluZyhteV9uYW1lKSIsIm5hbWUgcmUjXiguKikkIyIsInJlI14oLiopJCMiLCJuYW1lIiwibXlfbmFtZSIsInNlbmRfZGlyZWN0aXZlKFwic3RvcmVfbmFtZVwiKSB3aXRoXG4gICAgICBuYW1lID0gbXlfbmFtZSIsImFsd2F5cyB7XG4gICAgICBzZXQgZW50Om5hbWUgbXlfbmFtZVxuICAgIH0iLCJzZXQgZW50Om5hbWUgbXlfbmFtZSIsInJ1bGUgc3RvcmVfYXBwdmFyIHtcbiAgICBzZWxlY3Qgd2hlbiBzdG9yZSBhcHB2YXIgYXBwdmFyIHJlI14oLiopJCMgc2V0dGluZyhteV9uYW1lKTtcblxuICAgIHNlbmRfZGlyZWN0aXZlKFwic3RvcmVfYXBwdmFyXCIpIHdpdGhcbiAgICAgIGFwcHZhciA9IG15X25hbWVcblxuICAgIGFsd2F5cyB7XG4gICAgICBzZXQgYXBwOmFwcHZhciBteV9uYW1lXG4gICAgfVxuICB9Iiwic3RvcmVfYXBwdmFyIiwic2VsZWN0IHdoZW4gc3RvcmUgYXBwdmFyIGFwcHZhciByZSNeKC4qKSQjIHNldHRpbmcobXlfbmFtZSkiLCJzdG9yZSBhcHB2YXIgYXBwdmFyIHJlI14oLiopJCMgc2V0dGluZyhteV9uYW1lKSIsImFwcHZhciByZSNeKC4qKSQjIiwiYXBwdmFyIiwic2VuZF9kaXJlY3RpdmUoXCJzdG9yZV9hcHB2YXJcIikgd2l0aFxuICAgICAgYXBwdmFyID0gbXlfbmFtZSIsImFsd2F5cyB7XG4gICAgICBzZXQgYXBwOmFwcHZhciBteV9uYW1lXG4gICAgfSIsInNldCBhcHA6YXBwdmFyIG15X25hbWUiXSwibmFtZXMiOlsiZ2V0TmFtZSIsImN0eCIsImRiIiwiZ2V0RW50VmFyRnV0dXJlIiwicGljbyIsImlkIiwid2FpdCIsImdldEFwcFZhciIsImdldEFwcFZhckZ1dHVyZSIsInJpZCIsIm1vZHVsZSIsImV4cG9ydHMiLCJtYXRjaGVzIiwibSIsIlJlZ0V4cCIsImV4ZWMiLCJldmVudCIsImF0dHJzIiwibGVuZ3RoIiwicHVzaCIsInZhcnMiLCJteV9uYW1lIiwidW5kZWZpbmVkIiwicHV0RW50VmFyRnV0dXJlIiwicHV0QXBwVmFyRnV0dXJlIl0sIm1hcHBpbmdzIjoiQUFLSSxJQ0FBQSxPREFBLEdFQVUsVUFBQUMsR0FBQTtBQUFBLFNDQ1JBLEdBQUEsQ0FBQUMsRUFBQSxDQUFBQyxlQUFBLENBQUFGLEdBQUEsQ0FBQUcsSUFBQSxDQUFBQyxFQUFBLFVBQUFDLElBQUEsRUREUTtBQUFBLENGQVYsQ0lMSjtBQ1FJLElDQUFDLFNEQUEsR0VBWSxVQUFBTixHQUFBO0FBQUEsU0NDVkEsR0FBQSxDQUFBQyxFQUFBLENBQUFNLGVBQUEsQ0FBQVAsR0FBQSxDQUFBUSxHQUFBLFlBQUFILElBQUEsRUREVTtBQUFBLENGQVosQ0RSSjtBQUFBSSxNQUFBLENBQUFDLE9BQUE7QUFBQSxFLFFLQVEsd0JMQVI7QUFBQSxFLFFBQUE7QUFBQSxJTUVJLFFDQUE7QUFBQSxNVkFPLFNVQVAsRVZBT1gsT1VBUDtBQUFBLE1MQWdCLFdLQWhCLEVMQWdCTyxTS0FoQjtBQUFBLEtQRko7QUFBQTtBQUFBLEUsU0FBQTtBQUFBLEksaUJRWUU7QUFBQSxNLFFDQUssZURBTDtBQUFBLE0sVUVDRTtBQUFBLFEsU0FBQSxFLFNBQUEsRSxRQUFBLEUsVUFBQTtBQUFBLFEsY0FBQTtBQUFBLFUsVUNBWSxVQUFBTixHQUFBO0FBQUEsZ0JBQUFXLE9BQUE7QUFBQSxnQkFBQUMsQ0FBQTtBQUFBLFlDQVdBLENBQUEsR0NBSyxJQUFBQyxNQUFBLGVBQUFDLElGQWhCLENHQVdkLEdBQUEsQ0FBQWUsS0FBQSxDQUFBQyxLQUFBLFFIQVgsQ0NBVyxDREFYO0FBQUEsWUNBVyxLQUFBSixDQUFBO0FBQUEsMkJEQVg7QUFBQSxZQ0FXLElBQUFBLENBQUEsQ0FBQUssTUFBQTtBQUFBLGNBQUFOLE9BQUEsQ0FBQU8sSUFBQSxDQUFBTixDQUFBLEtEQVg7QUFBQSxZSUFtQ1osR0FBQSxDQUFBbUIsSUFBQSxDQUFBQyxPQUFBLEdBQUFULE9BQUEsSUpBbkM7QUFBQTtBQUFBLFdEQVo7QUFBQTtBQUFBLFEsaUJBQUE7QUFBQSxVOztjQUFBLFE7Y0FBQSxLOzs7O2dCQUFBLEs7Z0JBQUEsUTs7Y0FBQSxPOztXQUFBO0FBQUE7QUFBQSxPRkRGO0FBQUEsTSxnQlFHRTtBQUFBLFEsV0FBQSxXQUFBWCxHQUFBO0FBQUE7QUFBQSxjLFFBQUE7QUFBQSxjLFFBQUE7QUFBQSxjLFdBQUEsRSxRRENTQSxHQUFBLENBQUFtQixJQUFBLENBQUFDLE9DRFQ7QUFBQTtBQUFBO0FBQUEsT1JIRjtBQUFBLE0sWVNNRTtBQUFBLFEsU0FBQUMsU0FBQTtBQUFBLFEsWUFBQUEsU0FBQTtBQUFBLFEsVUFBQSxVQUFBckIsR0FBQTtBQUFBLFVDQ0VBLEdBQUEsQ0FBQUMsRUFBQSxDQUFBcUIsZUFBQSxDQUFBdEIsR0FBQSxDQUFBRyxJQUFBLENBQUFDLEVBQUEsRW5CQUksTW1CQUosRUhBYUosR0FBQSxDQUFBbUIsSUFBQSxDQUFBQyxPR0FiLEVBQUFmLElBQUEsR0RERjtBQUFBO0FBQUEsT1RORjtBQUFBLEtSWkY7QUFBQSxJLGdCbUJzQkU7QUFBQSxNLFFDQUssY0RBTDtBQUFBLE0sVUVDRTtBQUFBLFEsU0FBQSxFLFNBQUEsRSxVQUFBLEUsVUFBQTtBQUFBLFEsY0FBQTtBQUFBLFUsVUNBWSxVQUFBTCxHQUFBO0FBQUEsZ0JBQUFXLE9BQUE7QUFBQSxnQkFBQUMsQ0FBQTtBQUFBLFlDQWFBLENBQUEsR1ZBTyxJQUFBQyxNQUFBLGVBQUFDLElTQXBCLENFQWFkLEdBQUEsQ0FBQWUsS0FBQSxDQUFBQyxLQUFBLFVGQWIsQ0NBYSxDREFiO0FBQUEsWUNBYSxLQUFBSixDQUFBO0FBQUEsMkJEQWI7QUFBQSxZQ0FhLElBQUFBLENBQUEsQ0FBQUssTUFBQTtBQUFBLGNBQUFOLE9BQUEsQ0FBQU8sSUFBQSxDQUFBTixDQUFBLEtEQWI7QUFBQSxZUEF1Q1osR0FBQSxDQUFBbUIsSUFBQSxDQUFBQyxPQUFBLEdBQUFULE9BQUEsSU9BdkM7QUFBQTtBQUFBLFdEQVo7QUFBQTtBQUFBLFEsaUJBQUE7QUFBQSxVOztjQUFBLFE7Y0FBQSxLOzs7O2dCQUFBLEs7Z0JBQUEsUTs7Y0FBQSxPOztXQUFBO0FBQUE7QUFBQSxPRkRGO0FBQUEsTSxnQk1HRTtBQUFBLFEsV0FBQSxXQUFBWCxHQUFBO0FBQUE7QUFBQSxjLFFBQUE7QUFBQSxjLFFBQUE7QUFBQSxjLFdBQUEsRSxVVkNXQSxHQUFBLENBQUFtQixJQUFBLENBQUFDLE9VRFg7QUFBQTtBQUFBO0FBQUEsT05IRjtBQUFBLE0sWU9NRTtBQUFBLFEsU0FBQUMsU0FBQTtBQUFBLFEsWUFBQUEsU0FBQTtBQUFBLFEsVUFBQSxVQUFBckIsR0FBQTtBQUFBLFVDQ0VBLEdBQUEsQ0FBQUMsRUFBQSxDQUFBc0IsZUFBQSxDQUFBdkIsR0FBQSxDQUFBUSxHQUFBLEV2QkFJLFF1QkFKLEVaQWVSLEdBQUEsQ0FBQW1CLElBQUEsQ0FBQUMsT1lBZixFQUFBZixJQUFBLEdEREY7QUFBQTtBQUFBLE9QTkY7QUFBQSxLbkJ0QkY7QUFBQTtBQUFBIiwic291cmNlc0NvbnRlbnQiOltudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGxdfQ==
