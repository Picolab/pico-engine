module.exports = {
  'name': 'io.picolabs.hello_world',
  'meta': {
    'name': 'Hello World',
    'description': '\nA first ruleset for the Quickstart\n    ',
    'author': 'Phil Windley',
    'logging': true,
    'shares': ['hello']
  },
  'global': function (ctx) {
    ctx.scope.set('hello', ctx.mk_krlClosure(ctx, function (ctx) {
      ctx.scope.set('obj', ctx.getArg(ctx.args, 'obj', 0));
      ctx.scope.set('msg', 'Hello ' + ctx.scope.get('obj'));
      return ctx.scope.get('msg');
    }));
  },
  'rules': {
    'say_hello': {
      'name': 'say_hello',
      'select': {
        'graph': { 'echo': { 'hello': { 'expr_0': true } } },
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
      'action_block': {
        'actions': [function (ctx) {
            return {
              'type': 'directive',
              'name': 'say',
              'options': { 'something': 'Hello World' }
            };
          }]
      }
    }
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJ1bGVzZXQgaW8ucGljb2xhYnMuaGVsbG9fd29ybGQge1xuICBtZXRhIHtcbiAgICBuYW1lIFwiSGVsbG8gV29ybGRcIlxuICAgIGRlc2NyaXB0aW9uIDw8XG5BIGZpcnN0IHJ1bGVzZXQgZm9yIHRoZSBRdWlja3N0YXJ0XG4gICAgPj5cbiAgICBhdXRob3IgXCJQaGlsIFdpbmRsZXlcIlxuICAgIGxvZ2dpbmcgb25cbiAgICBzaGFyZXMgaGVsbG9cbiAgfVxuICBnbG9iYWwge1xuICAgIGhlbGxvID0gZnVuY3Rpb24ob2JqKXtcbiAgICAgIG1zZyA9IFwiSGVsbG8gXCIgKyBvYmo7XG4gICAgICBtc2dcbiAgICB9XG4gIH1cbiAgcnVsZSBzYXlfaGVsbG8ge1xuICAgIHNlbGVjdCB3aGVuIGVjaG8gaGVsbG9cbiAgICBzZW5kX2RpcmVjdGl2ZShcInNheVwiKSB3aXRoXG4gICAgICBzb21ldGhpbmcgPSBcIkhlbGxvIFdvcmxkXCJcbiAgfVxufSIsImlvLnBpY29sYWJzLmhlbGxvX3dvcmxkIiwibmFtZSIsIm5hbWUgXCJIZWxsbyBXb3JsZFwiIiwiXCJIZWxsbyBXb3JsZFwiIiwiZGVzY3JpcHRpb24iLCJkZXNjcmlwdGlvbiA8PFxuQSBmaXJzdCBydWxlc2V0IGZvciB0aGUgUXVpY2tzdGFydFxuICAgID4+IiwiXG5BIGZpcnN0IHJ1bGVzZXQgZm9yIHRoZSBRdWlja3N0YXJ0XG4gICAgIiwiYXV0aG9yIiwiYXV0aG9yIFwiUGhpbCBXaW5kbGV5XCIiLCJcIlBoaWwgV2luZGxleVwiIiwibG9nZ2luZyIsImxvZ2dpbmcgb24iLCJvbiIsInNoYXJlcyIsInNoYXJlcyBoZWxsbyIsImhlbGxvIiwiaGVsbG8gPSBmdW5jdGlvbihvYmope1xuICAgICAgbXNnID0gXCJIZWxsbyBcIiArIG9iajtcbiAgICAgIG1zZ1xuICAgIH0iLCJmdW5jdGlvbihvYmope1xuICAgICAgbXNnID0gXCJIZWxsbyBcIiArIG9iajtcbiAgICAgIG1zZ1xuICAgIH0iLCJvYmoiLCJtc2cgPSBcIkhlbGxvIFwiICsgb2JqIiwibXNnIiwiXCJIZWxsbyBcIiIsIlwiSGVsbG8gXCIgKyBvYmoiLCJydWxlIHNheV9oZWxsbyB7XG4gICAgc2VsZWN0IHdoZW4gZWNobyBoZWxsb1xuICAgIHNlbmRfZGlyZWN0aXZlKFwic2F5XCIpIHdpdGhcbiAgICAgIHNvbWV0aGluZyA9IFwiSGVsbG8gV29ybGRcIlxuICB9Iiwic2F5X2hlbGxvIiwic2VsZWN0IHdoZW4gZWNobyBoZWxsbyIsImVjaG8gaGVsbG8iLCJzZW5kX2RpcmVjdGl2ZShcInNheVwiKSB3aXRoXG4gICAgICBzb21ldGhpbmcgPSBcIkhlbGxvIFdvcmxkXCIiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0cyIsImN0eCIsInNjb3BlIiwic2V0IiwibWtfa3JsQ2xvc3VyZSIsImdldEFyZyIsImdldCJdLCJtYXBwaW5ncyI6IkFBQUFBLE1BQUEsQ0FBQUMsT0FBQTtBQUFBLEUsUUNBUSx5QkRBUjtBQUFBLEUsUUFBQTtBQUFBLElFRUksTUNBQSxFQ0FLLGFKRlQ7QUFBQSxJS0dJLGFDQUEsRUNBYyw0Q1BIbEI7QUFBQSxJUU1JLFFDQUEsRUNBTyxjVk5YO0FBQUEsSVdPSSxTQ0FBLEVDQVEsSWJQWjtBQUFBLEljUUksUUNBQSxHQ0FPLE9EQVAsQ2ZSSjtBQUFBO0FBQUEsRSxVQUFBLFVBQUFDLEdBQUE7QUFBQSxJaUJXSUEsR0FBQSxDQUFBQyxLQUFBLENBQUFDLEdBQUEsQ0RBQSxPQ0FBLEVDQVFGLEdBQUEsQ0FBQUcsYUFBQSxDQUFBSCxHQUFBLFlBQUFBLEdBQUE7QUFBQSxNQ0FTQSxHQUFBLENBQUFDLEtBQUEsQ0FBQUMsR0FBQSxRQUFBRixHQUFBLENBQUFJLE1BQUEsWURBVDtBQUFBLE1FQ05KLEdBQUEsQ0FBQUMsS0FBQSxDQUFBQyxHQUFBLENDQUEsS0RBQSxFRUFNLFFDQUEsR0pBV0YsR0FBQSxDQUFBQyxLQUFBLENBQUFJLEdBQUEsT0NBakIsRUZETTtBQUFBLGFHRU5MLEdBQUEsQ0FBQUMsS0FBQSxDQUFBSSxHQUFBLE9IRk07QUFBQSxNREFSLEVqQlhKO0FBQUE7QUFBQSxFLFNBQUE7QUFBQSxJLGF3QmdCRTtBQUFBLE0sUUNBSyxXREFMO0FBQUEsTSxVRUNFO0FBQUEsUSxTQUFBLEUsUUFBQSxFLFNBQUEsRSxVQUFBO0FBQUEsUSxjQUFBO0FBQUEsVSxVQ0FZLFVBQUFMLEdBQUE7QUFBQTtBQUFBLFdEQVo7QUFBQTtBQUFBLFEsaUJBQUE7QUFBQSxVOztjQUFBLFE7Y0FBQSxLOzs7O2dCQUFBLEs7Z0JBQUEsUTs7Y0FBQSxPOztXQUFBO0FBQUE7QUFBQSxPRkRGO0FBQUEsTSxnQklFRTtBQUFBLFEsV0FBQSxXQUFBQSxHQUFBO0FBQUE7QUFBQSxjLFFBQUE7QUFBQSxjLFFBQUE7QUFBQSxjLFdBQUEsRSxheEJDYyxhd0JEZDtBQUFBO0FBQUE7QUFBQSxPSkZGO0FBQUEsS3hCaEJGO0FBQUE7QUFBQSIsInNvdXJjZXNDb250ZW50IjpbbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsXX0=
