var getName = function (ctx, callback) {
  ctx.db.getEntVar(ctx.pico.id, 'name', callback);
};
var getAppVar = function (ctx, callback) {
  ctx.db.getAppVar(ctx.rid, 'appvar', callback);
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
          'expr_0': function (ctx, callback) {
            var matches = [];
            var m;
            m = new RegExp('^(.*)$', '').exec(ctx.event.attrs['name']);
            if (!m)
              return callback(undefined, false);
            if (m.length > 1)
              matches.push(m[1]);
            ctx.vars.my_name = matches[0];
            callback(undefined, true);
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
        'actions': [function (ctx, callback) {
            callback(undefined, {
              'type': 'directive',
              'name': 'store_name',
              'options': { 'name': ctx.vars.my_name }
            });
          }]
      },
      'postlude': {
        'fired': undefined,
        'notfired': undefined,
        'always': function (ctx, callback) {
          ctx.db.putEntVar(ctx.pico.id, 'name', ctx.vars.my_name, callback);
        }
      }
    },
    'store_appvar': {
      'name': 'store_appvar',
      'select': {
        'graph': { 'store': { 'appvar': { 'expr_0': true } } },
        'eventexprs': {
          'expr_0': function (ctx, callback) {
            var matches = [];
            var m;
            m = new RegExp('^(.*)$', '').exec(ctx.event.attrs['appvar']);
            if (!m)
              return callback(undefined, false);
            if (m.length > 1)
              matches.push(m[1]);
            ctx.vars.my_name = matches[0];
            callback(undefined, true);
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
        'actions': [function (ctx, callback) {
            callback(undefined, {
              'type': 'directive',
              'name': 'store_appvar',
              'options': { 'appvar': ctx.vars.my_name }
            });
          }]
      },
      'postlude': {
        'fired': undefined,
        'notfired': undefined,
        'always': function (ctx, callback) {
          ctx.db.putAppVar(ctx.rule.rid, 'appvar', ctx.vars.my_name, callback);
        }
      }
    }
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImdldE5hbWUgPSBmdW5jdGlvbigpe1xuICAgICAgZW50Om5hbWVcbiAgICB9IiwiZ2V0TmFtZSIsImZ1bmN0aW9uKCl7XG4gICAgICBlbnQ6bmFtZVxuICAgIH0iLCJlbnQ6bmFtZSIsInJ1bGVzZXQgaW8ucGljb2xhYnMucGVyc2lzdGVudCB7XG4gIG1ldGEge1xuICAgIHNoYXJlcyBnZXROYW1lLCBnZXRBcHBWYXJcbiAgfVxuICBnbG9iYWwge1xuICAgIGdldE5hbWUgPSBmdW5jdGlvbigpe1xuICAgICAgZW50Om5hbWVcbiAgICB9XG4gICAgZ2V0QXBwVmFyID0gZnVuY3Rpb24oKXtcbiAgICAgIGFwcDphcHB2YXJcbiAgICB9XG4gIH1cbiAgcnVsZSBzdG9yZV9teV9uYW1lIHtcbiAgICBzZWxlY3Qgd2hlbiBzdG9yZSBuYW1lIG5hbWUgcmUjXiguKikkIyBzZXR0aW5nKG15X25hbWUpO1xuXG4gICAgc2VuZF9kaXJlY3RpdmUoXCJzdG9yZV9uYW1lXCIpIHdpdGhcbiAgICAgIG5hbWUgPSBteV9uYW1lXG5cbiAgICBhbHdheXMge1xuICAgICAgc2V0IGVudDpuYW1lIG15X25hbWVcbiAgICB9XG4gIH1cbiAgcnVsZSBzdG9yZV9hcHB2YXIge1xuICAgIHNlbGVjdCB3aGVuIHN0b3JlIGFwcHZhciBhcHB2YXIgcmUjXiguKikkIyBzZXR0aW5nKG15X25hbWUpO1xuXG4gICAgc2VuZF9kaXJlY3RpdmUoXCJzdG9yZV9hcHB2YXJcIikgd2l0aFxuICAgICAgYXBwdmFyID0gbXlfbmFtZVxuXG4gICAgYWx3YXlzIHtcbiAgICAgIHNldCBhcHA6YXBwdmFyIG15X25hbWVcbiAgICB9XG4gIH1cbn0iLCJnZXRBcHBWYXIgPSBmdW5jdGlvbigpe1xuICAgICAgYXBwOmFwcHZhclxuICAgIH0iLCJnZXRBcHBWYXIiLCJmdW5jdGlvbigpe1xuICAgICAgYXBwOmFwcHZhclxuICAgIH0iLCJhcHA6YXBwdmFyIiwiaW8ucGljb2xhYnMucGVyc2lzdGVudCIsInNoYXJlcyIsInNoYXJlcyBnZXROYW1lLCBnZXRBcHBWYXIiLCJydWxlIHN0b3JlX215X25hbWUge1xuICAgIHNlbGVjdCB3aGVuIHN0b3JlIG5hbWUgbmFtZSByZSNeKC4qKSQjIHNldHRpbmcobXlfbmFtZSk7XG5cbiAgICBzZW5kX2RpcmVjdGl2ZShcInN0b3JlX25hbWVcIikgd2l0aFxuICAgICAgbmFtZSA9IG15X25hbWVcblxuICAgIGFsd2F5cyB7XG4gICAgICBzZXQgZW50Om5hbWUgbXlfbmFtZVxuICAgIH1cbiAgfSIsInN0b3JlX215X25hbWUiLCJzZWxlY3Qgd2hlbiBzdG9yZSBuYW1lIG5hbWUgcmUjXiguKikkIyBzZXR0aW5nKG15X25hbWUpIiwic3RvcmUgbmFtZSBuYW1lIHJlI14oLiopJCMgc2V0dGluZyhteV9uYW1lKSIsIm5hbWUgcmUjXiguKikkIyIsInJlI14oLiopJCMiLCJuYW1lIiwibXlfbmFtZSIsInNlbmRfZGlyZWN0aXZlKFwic3RvcmVfbmFtZVwiKSB3aXRoXG4gICAgICBuYW1lID0gbXlfbmFtZSIsImFsd2F5cyB7XG4gICAgICBzZXQgZW50Om5hbWUgbXlfbmFtZVxuICAgIH0iLCJzZXQgZW50Om5hbWUgbXlfbmFtZSIsInJ1bGUgc3RvcmVfYXBwdmFyIHtcbiAgICBzZWxlY3Qgd2hlbiBzdG9yZSBhcHB2YXIgYXBwdmFyIHJlI14oLiopJCMgc2V0dGluZyhteV9uYW1lKTtcblxuICAgIHNlbmRfZGlyZWN0aXZlKFwic3RvcmVfYXBwdmFyXCIpIHdpdGhcbiAgICAgIGFwcHZhciA9IG15X25hbWVcblxuICAgIGFsd2F5cyB7XG4gICAgICBzZXQgYXBwOmFwcHZhciBteV9uYW1lXG4gICAgfVxuICB9Iiwic3RvcmVfYXBwdmFyIiwic2VsZWN0IHdoZW4gc3RvcmUgYXBwdmFyIGFwcHZhciByZSNeKC4qKSQjIHNldHRpbmcobXlfbmFtZSkiLCJzdG9yZSBhcHB2YXIgYXBwdmFyIHJlI14oLiopJCMgc2V0dGluZyhteV9uYW1lKSIsImFwcHZhciByZSNeKC4qKSQjIiwiYXBwdmFyIiwic2VuZF9kaXJlY3RpdmUoXCJzdG9yZV9hcHB2YXJcIikgd2l0aFxuICAgICAgYXBwdmFyID0gbXlfbmFtZSIsImFsd2F5cyB7XG4gICAgICBzZXQgYXBwOmFwcHZhciBteV9uYW1lXG4gICAgfSIsInNldCBhcHA6YXBwdmFyIG15X25hbWUiXSwibmFtZXMiOlsiZ2V0TmFtZSIsImN0eCIsImRiIiwiZ2V0RW50VmFyIiwicGljbyIsImlkIiwiY2FsbGJhY2siLCJnZXRBcHBWYXIiLCJyaWQiLCJtb2R1bGUiLCJleHBvcnRzIiwibWF0Y2hlcyIsIm0iLCJSZWdFeHAiLCJleGVjIiwiZXZlbnQiLCJhdHRycyIsInVuZGVmaW5lZCIsImxlbmd0aCIsInB1c2giLCJ2YXJzIiwibXlfbmFtZSIsInB1dEVudFZhciIsInB1dEFwcFZhciIsInJ1bGUiXSwibWFwcGluZ3MiOiJBQUtJLElDQUFBLE8sR0NBVSxVLEdBQUEsRSxRQUFBLEU7RUNDUkMsR0FBQSxDQUFBQyxFQUFBLENBQUFDLFNBQUEsQ0FBQUYsR0FBQSxDQUFBRyxJQUFBLENBQUFDLEVBQUEsVUFBQUMsUUFBQSxFO0NIREYsQ0lMSjtBQ1FJLElDQUFDLFMsR0NBWSxVLEdBQUEsRSxRQUFBLEU7RUNDVk4sR0FBQSxDQUFBQyxFQUFBLENBQUFLLFNBQUEsQ0FBQU4sR0FBQSxDQUFBTyxHQUFBLFlBQUFGLFFBQUEsRTtDSERGLENEUko7QUFBQUcsTUFBQSxDQUFBQyxPQUFBO0FBQUEsRSxRS0FRLHdCTEFSO0FBQUEsRSxRQUFBO0FBQUEsSU1FSSxRQ0FBO0FBQUEsTVZBTyxTVUFQLEVWQU9WLE9VQVA7QUFBQSxNTEFnQixXS0FoQixFTEFnQk8sU0tBaEI7QUFBQSxLUEZKO0FBQUE7QUFBQSxFLFNBQUE7QUFBQSxJLGlCUVlFO0FBQUEsTSxRQ0FLLGVEQUw7QUFBQSxNLFVFQ0U7QUFBQSxRLFNBQUEsRSxTQUFBLEUsUUFBQSxFLFVBQUE7QUFBQSxRLGNBQUE7QUFBQSxVLFVDQVksVSxHQUFBLEUsUUFBQSxFO1lBQUEsSUFBQUksTyxHQUFBLEc7WUFBQSxJQUFBQyxDQUFBLEM7WUNBV0EsQ0FBQSxHQ0FLLElBQUFDLE1BQUEsZUFBQUMsSUZBaEIsQ0dBV2IsR0FBQSxDQUFBYyxLQUFBLENBQUFDLEtBQUEsUUhBWCxDQ0FXLEM7WUFBQSxLQUFBSixDQUFBO0FBQUEscUJBQUFOLFFBQUEsQ0FBQVcsU0FBQSxTO1lBQUEsSUFBQUwsQ0FBQSxDQUFBTSxNQUFBO0FBQUEsY0FBQVAsT0FBQSxDQUFBUSxJQUFBLENBQUFQLENBQUEsSztZR0F3QlgsR0FBQSxDQUFBbUIsSUFBQSxDQUFBQyxPQUFBLEdBQUFWLE9BQUEsSTtZSkFuQ0wsUUFBQSxDQUFBVyxTQUFBLFE7V0RBWjtBQUFBO0FBQUEsUSxpQkFBQTtBQUFBLFU7O2NBQUEsUTtjQUFBLEs7Ozs7Z0JBQUEsSztnQkFBQSxROztjQUFBLE87O1dBQUE7QUFBQTtBQUFBLE9GREY7QUFBQSxNLGdCUUdFO0FBQUEsUSxXQUFBLFcsR0FBQSxFLFFBQUEsRTtZQUFBWCxRQUFBLENBQUFXLFNBQUE7QUFBQSxjLFFBQUE7QUFBQSxjLFFBQUE7QUFBQSxjLFdBQUEsRSxRRENTaEIsR0FBQSxDQUFBbUIsSUFBQSxDQUFBQyxPQ0RUO0FBQUEsZTtXQUFBO0FBQUEsT1JIRjtBQUFBLE0sWVNNRTtBQUFBLFEsU0FBQUosU0FBQTtBQUFBLFEsWUFBQUEsU0FBQTtBQUFBLFEsVUFBQSxVLEdBQUEsRSxRQUFBLEU7VUNDRWhCLEdBQUEsQ0FBQUMsRUFBQSxDQUFBb0IsU0FBQSxDQUFBckIsR0FBQSxDQUFBRyxJQUFBLENBQUFDLEVBQUEsRW5CQUksTW1CQUosRUhBYUosR0FBQSxDQUFBbUIsSUFBQSxDQUFBQyxPR0FiLEVBQUFmLFFBQUEsRTtTRERGO0FBQUEsT1RORjtBQUFBLEtSWkY7QUFBQSxJLGdCbUJzQkU7QUFBQSxNLFFDQUssY0RBTDtBQUFBLE0sVUVDRTtBQUFBLFEsU0FBQSxFLFNBQUEsRSxVQUFBLEUsVUFBQTtBQUFBLFEsY0FBQTtBQUFBLFUsVUNBWSxVLEdBQUEsRSxRQUFBLEU7WUFBQSxJQUFBSyxPLEdBQUEsRztZQUFBLElBQUFDLENBQUEsQztZQ0FhQSxDQUFBLEdWQU8sSUFBQUMsTUFBQSxlQUFBQyxJU0FwQixDRUFhYixHQUFBLENBQUFjLEtBQUEsQ0FBQUMsS0FBQSxVRkFiLENDQWEsQztZQUFBLEtBQUFKLENBQUE7QUFBQSxxQkFBQU4sUUFBQSxDQUFBVyxTQUFBLFM7WUFBQSxJQUFBTCxDQUFBLENBQUFNLE1BQUE7QUFBQSxjQUFBUCxPQUFBLENBQUFRLElBQUEsQ0FBQVAsQ0FBQSxLO1lSQTBCWCxHQUFBLENBQUFtQixJQUFBLENBQUFDLE9BQUEsR0FBQVYsT0FBQSxJO1lPQXZDTCxRQUFBLENBQUFXLFNBQUEsUTtXREFaO0FBQUE7QUFBQSxRLGlCQUFBO0FBQUEsVTs7Y0FBQSxRO2NBQUEsSzs7OztnQkFBQSxLO2dCQUFBLFE7O2NBQUEsTzs7V0FBQTtBQUFBO0FBQUEsT0ZERjtBQUFBLE0sZ0JNR0U7QUFBQSxRLFdBQUEsVyxHQUFBLEUsUUFBQSxFO1lBQUFYLFFBQUEsQ0FBQVcsU0FBQTtBQUFBLGMsUUFBQTtBQUFBLGMsUUFBQTtBQUFBLGMsV0FBQSxFLFVWQ1doQixHQUFBLENBQUFtQixJQUFBLENBQUFDLE9VRFg7QUFBQSxlO1dBQUE7QUFBQSxPTkhGO0FBQUEsTSxZT01FO0FBQUEsUSxTQUFBSixTQUFBO0FBQUEsUSxZQUFBQSxTQUFBO0FBQUEsUSxVQUFBLFUsR0FBQSxFLFFBQUEsRTtVQ0NFaEIsR0FBQSxDQUFBQyxFQUFBLENBQUFxQixTQUFBLENBQUF0QixHQUFBLENBQUF1QixJQUFBLENBQUFoQixHQUFBLEV2QkFJLFF1QkFKLEVaQWVQLEdBQUEsQ0FBQW1CLElBQUEsQ0FBQUMsT1lBZixFQUFBZixRQUFBLEU7U0RERjtBQUFBLE9QTkY7QUFBQSxLbkJ0QkY7QUFBQTtBQUFBIiwic291cmNlc0NvbnRlbnQiOltudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGxdfQ==
