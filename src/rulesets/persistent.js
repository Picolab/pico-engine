var read = function (ctx, callback) {
  ctx.db.getEntVar(ctx.pico.id, 'name', callback);
};
module.exports = {
  'name': 'io.picolabs.persistent',
  'meta': { 'shares': { 'read': read } },
  'rules': {
    'store_my_name': {
      'name': 'store_my_name',
      'select': {
        'graph': { 'echo': { 'hello': { 'expr_0': true } } },
        'eventexprs': {
          'expr_0': function (ctx, callback) {
            var matches = [];
            var m;
            m = new RegExp('^(.*)$', '').exec(ctx.event.attrs.$name$);
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
    }
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJlYWQgPSBmdW5jdGlvbigpe1xuICAgICAgZW50Om5hbWVcbiAgICB9IiwicmVhZCIsImZ1bmN0aW9uKCl7XG4gICAgICBlbnQ6bmFtZVxuICAgIH0iLCJlbnQ6bmFtZSIsInJ1bGVzZXQgaW8ucGljb2xhYnMucGVyc2lzdGVudCB7XG4gIG1ldGEge1xuICAgIHNoYXJlcyByZWFkXG4gIH1cbiAgZ2xvYmFsIHtcbiAgICByZWFkID0gZnVuY3Rpb24oKXtcbiAgICAgIGVudDpuYW1lXG4gICAgfVxuICB9XG4gIHJ1bGUgc3RvcmVfbXlfbmFtZSB7XG4gICAgc2VsZWN0IHdoZW4gZWNobyBoZWxsbyBuYW1lIHJlI14oLiopJCMgc2V0dGluZyhteV9uYW1lKTtcblxuICAgIHNlbmRfZGlyZWN0aXZlKFwic3RvcmVfbmFtZVwiKSB3aXRoXG4gICAgICBuYW1lID0gbXlfbmFtZVxuXG4gICAgYWx3YXlzIHtcbiAgICAgIHNldCBlbnQ6bmFtZSBteV9uYW1lXG4gICAgfVxuICB9XG59IiwiaW8ucGljb2xhYnMucGVyc2lzdGVudCIsInNoYXJlcyIsInNoYXJlcyByZWFkIiwicnVsZSBzdG9yZV9teV9uYW1lIHtcbiAgICBzZWxlY3Qgd2hlbiBlY2hvIGhlbGxvIG5hbWUgcmUjXiguKikkIyBzZXR0aW5nKG15X25hbWUpO1xuXG4gICAgc2VuZF9kaXJlY3RpdmUoXCJzdG9yZV9uYW1lXCIpIHdpdGhcbiAgICAgIG5hbWUgPSBteV9uYW1lXG5cbiAgICBhbHdheXMge1xuICAgICAgc2V0IGVudDpuYW1lIG15X25hbWVcbiAgICB9XG4gIH0iLCJzdG9yZV9teV9uYW1lIiwic2VsZWN0IHdoZW4gZWNobyBoZWxsbyBuYW1lIHJlI14oLiopJCMgc2V0dGluZyhteV9uYW1lKSIsImVjaG8gaGVsbG8gbmFtZSByZSNeKC4qKSQjIHNldHRpbmcobXlfbmFtZSkiLCJuYW1lIHJlI14oLiopJCMiLCJyZSNeKC4qKSQjIiwibmFtZSIsIm15X25hbWUiLCJzZW5kX2RpcmVjdGl2ZShcInN0b3JlX25hbWVcIikgd2l0aFxuICAgICAgbmFtZSA9IG15X25hbWUiLCJhbHdheXMge1xuICAgICAgc2V0IGVudDpuYW1lIG15X25hbWVcbiAgICB9Iiwic2V0IGVudDpuYW1lIG15X25hbWUiXSwibmFtZXMiOlsicmVhZCIsImN0eCIsImRiIiwiZ2V0RW50VmFyIiwicGljbyIsImlkIiwiY2FsbGJhY2siLCJtb2R1bGUiLCJleHBvcnRzIiwibWF0Y2hlcyIsIm0iLCJSZWdFeHAiLCJleGVjIiwiZXZlbnQiLCJhdHRycyIsIiRuYW1lJCIsInVuZGVmaW5lZCIsImxlbmd0aCIsInB1c2giLCJ2YXJzIiwibXlfbmFtZSIsInB1dEVudFZhciJdLCJtYXBwaW5ncyI6IkFBS0ksSUNBQUEsSSxHQ0FPLFUsR0FBQSxFLFFBQUEsRTtFQ0NMQyxHQUFBLENBQUFDLEVBQUEsQ0FBQUMsU0FBQSxDQUFBRixHQUFBLENBQUFHLElBQUEsQ0FBQUMsRUFBQSxVQUFBQyxRQUFBLEU7Q0hERixDSUxKO0FBQUFDLE1BQUEsQ0FBQUMsT0FBQTtBQUFBLEUsUUNBUSx3QkRBUjtBQUFBLEUsUUFBQSxFRUVJLFFDQUEsSU5BTyxNTUFQLEVOQU9SLElNQVAsRUhGSjtBQUFBLEUsU0FBQTtBQUFBLEksaUJJU0U7QUFBQSxNLFFDQUssZURBTDtBQUFBLE0sVUVDRTtBQUFBLFEsU0FBQSxFLFFBQUEsRSxTQUFBLEUsVUFBQTtBQUFBLFEsY0FBQTtBQUFBLFUsVUNBWSxVLEdBQUEsRSxRQUFBLEU7WUFBQSxJQUFBUyxPLEdBQUEsRztZQUFBLElBQUFDLENBQUEsQztZQ0FXQSxDQUFBLEdDQUssSUFBQUMsTUFBQSxlQUFBQyxJRkFoQixDR0FXWCxHQUFBLENBQUFZLEtBQUEsQ0FBQUMsS0FBQSxDQUFBQyxNSEFYLENDQVcsQztZQUFBLEtBQUFMLENBQUE7QUFBQSxxQkFBQUosUUFBQSxDQUFBVSxTQUFBLFM7WUFBQSxJQUFBTixDQUFBLENBQUFPLE1BQUE7QUFBQSxjQUFBUixPQUFBLENBQUFTLElBQUEsQ0FBQVIsQ0FBQSxLO1lHQXdCVCxHQUFBLENBQUFrQixJQUFBLENBQUFDLE9BQUEsR0FBQVgsT0FBQSxJO1lKQW5DSCxRQUFBLENBQUFVLFNBQUEsUTtXREFaO0FBQUE7QUFBQSxRLGlCQUFBO0FBQUEsVTs7Y0FBQSxRO2NBQUEsSzs7OztnQkFBQSxLO2dCQUFBLFE7O2NBQUEsTzs7V0FBQTtBQUFBO0FBQUEsT0ZERjtBQUFBLE0sZ0JRR0U7QUFBQSxRLFdBQUEsVyxHQUFBLEUsUUFBQSxFO1lBQUFWLFFBQUEsQ0FBQVUsU0FBQTtBQUFBLGMsUUFBQTtBQUFBLGMsUUFBQTtBQUFBLGMsV0FBQSxFLFFEQ1NmLEdBQUEsQ0FBQWtCLElBQUEsQ0FBQUMsT0NEVDtBQUFBLGU7V0FBQTtBQUFBLE9SSEY7QUFBQSxNLFlTTUU7QUFBQSxRLFNBQUFKLFNBQUE7QUFBQSxRLFlBQUFBLFNBQUE7QUFBQSxRLFVBQUEsVSxHQUFBLEUsUUFBQSxFO1VDQ0VmLEdBQUEsQ0FBQUMsRUFBQSxDQUFBbUIsU0FBQSxDQUFBcEIsR0FBQSxDQUFBRyxJQUFBLENBQUFDLEVBQUEsRWZBSSxNZUFKLEVIQWFKLEdBQUEsQ0FBQWtCLElBQUEsQ0FBQUMsT0dBYixFQUFBZCxRQUFBLEU7U0RERjtBQUFBLE9UTkY7QUFBQSxLSlRGO0FBQUE7QUFBQSIsInNvdXJjZXNDb250ZW50IjpbbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbF19
