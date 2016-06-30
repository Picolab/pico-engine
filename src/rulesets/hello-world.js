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
    ctx.scope.set('hello', function (ctx) {
      ctx.scope.set('obj', ctx.args['obj']);
      ctx.scope.set('msg', 'Hello ' + ctx.scope.get('obj'));
      return ctx.scope.get('msg');
    });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJ1bGVzZXQgaW8ucGljb2xhYnMuaGVsbG9fd29ybGQge1xuICBtZXRhIHtcbiAgICBuYW1lIFwiSGVsbG8gV29ybGRcIlxuICAgIGRlc2NyaXB0aW9uIDw8XG5BIGZpcnN0IHJ1bGVzZXQgZm9yIHRoZSBRdWlja3N0YXJ0XG4gICAgPj5cbiAgICBhdXRob3IgXCJQaGlsIFdpbmRsZXlcIlxuICAgIGxvZ2dpbmcgb25cbiAgICBzaGFyZXMgaGVsbG9cbiAgfVxuICBnbG9iYWwge1xuICAgIGhlbGxvID0gZnVuY3Rpb24ob2JqKXtcbiAgICAgIG1zZyA9IFwiSGVsbG8gXCIgKyBvYmo7XG4gICAgICBtc2dcbiAgICB9XG4gIH1cbiAgcnVsZSBzYXlfaGVsbG8ge1xuICAgIHNlbGVjdCB3aGVuIGVjaG8gaGVsbG9cbiAgICBzZW5kX2RpcmVjdGl2ZShcInNheVwiKSB3aXRoXG4gICAgICBzb21ldGhpbmcgPSBcIkhlbGxvIFdvcmxkXCJcbiAgfVxufSIsImlvLnBpY29sYWJzLmhlbGxvX3dvcmxkIiwibmFtZSIsIm5hbWUgXCJIZWxsbyBXb3JsZFwiIiwiXCJIZWxsbyBXb3JsZFwiIiwiZGVzY3JpcHRpb24iLCJkZXNjcmlwdGlvbiA8PFxuQSBmaXJzdCBydWxlc2V0IGZvciB0aGUgUXVpY2tzdGFydFxuICAgID4+IiwiXG5BIGZpcnN0IHJ1bGVzZXQgZm9yIHRoZSBRdWlja3N0YXJ0XG4gICAgIiwiYXV0aG9yIiwiYXV0aG9yIFwiUGhpbCBXaW5kbGV5XCIiLCJcIlBoaWwgV2luZGxleVwiIiwibG9nZ2luZyIsImxvZ2dpbmcgb24iLCJvbiIsInNoYXJlcyIsInNoYXJlcyBoZWxsbyIsImhlbGxvIiwiaGVsbG8gPSBmdW5jdGlvbihvYmope1xuICAgICAgbXNnID0gXCJIZWxsbyBcIiArIG9iajtcbiAgICAgIG1zZ1xuICAgIH0iLCJmdW5jdGlvbihvYmope1xuICAgICAgbXNnID0gXCJIZWxsbyBcIiArIG9iajtcbiAgICAgIG1zZ1xuICAgIH0iLCJvYmoiLCJtc2cgPSBcIkhlbGxvIFwiICsgb2JqIiwibXNnIiwiXCJIZWxsbyBcIiIsIlwiSGVsbG8gXCIgKyBvYmoiLCJydWxlIHNheV9oZWxsbyB7XG4gICAgc2VsZWN0IHdoZW4gZWNobyBoZWxsb1xuICAgIHNlbmRfZGlyZWN0aXZlKFwic2F5XCIpIHdpdGhcbiAgICAgIHNvbWV0aGluZyA9IFwiSGVsbG8gV29ybGRcIlxuICB9Iiwic2F5X2hlbGxvIiwic2VsZWN0IHdoZW4gZWNobyBoZWxsbyIsImVjaG8gaGVsbG8iLCJzZW5kX2RpcmVjdGl2ZShcInNheVwiKSB3aXRoXG4gICAgICBzb21ldGhpbmcgPSBcIkhlbGxvIFdvcmxkXCIiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0cyIsImN0eCIsInNjb3BlIiwic2V0IiwiYXJncyIsImdldCJdLCJtYXBwaW5ncyI6IkFBQUFBLE1BQUEsQ0FBQUMsT0FBQTtBQUFBLEUsUUNBUSx5QkRBUjtBQUFBLEUsUUFBQTtBQUFBLElFRUksTUNBQSxFQ0FLLGFKRlQ7QUFBQSxJS0dJLGFDQUEsRUNBYyw0Q1BIbEI7QUFBQSxJUU1JLFFDQUEsRUNBTyxjVk5YO0FBQUEsSVdPSSxTQ0FBLEVDQVEsSWJQWjtBQUFBLEljUUksUUNBQSxHQ0FPLE9EQVAsQ2ZSSjtBQUFBO0FBQUEsRSxVQUFBLFVBQUFDLEdBQUE7QUFBQSxJaUJXSUEsR0FBQSxDQUFBQyxLQUFBLENBQUFDLEdBQUEsQ0RBQSxPQ0FBLEVDQVEsVUFBQUYsR0FBQTtBQUFBLE1DQVNBLEdBQUEsQ0FBQUMsS0FBQSxDQUFBQyxHQUFBLFFBQUFGLEdBQUEsQ0FBQUcsSUFBQSxTREFUO0FBQUEsTUVDTkgsR0FBQSxDQUFBQyxLQUFBLENBQUFDLEdBQUEsQ0NBQSxLREFBLEVFQU0sUUNBQSxHSkFXRixHQUFBLENBQUFDLEtBQUEsQ0FBQUcsR0FBQSxPQ0FqQixFRkRNO0FBQUEsYUdFTkosR0FBQSxDQUFBQyxLQUFBLENBQUFHLEdBQUEsT0hGTTtBQUFBLEtEQVIsRWpCWEo7QUFBQTtBQUFBLEUsU0FBQTtBQUFBLEksYXdCZ0JFO0FBQUEsTSxRQ0FLLFdEQUw7QUFBQSxNLFVFQ0U7QUFBQSxRLFNBQUEsRSxRQUFBLEUsU0FBQSxFLFVBQUE7QUFBQSxRLGNBQUE7QUFBQSxVLFVDQVksVUFBQUosR0FBQTtBQUFBO0FBQUEsV0RBWjtBQUFBO0FBQUEsUSxpQkFBQTtBQUFBLFU7O2NBQUEsUTtjQUFBLEs7Ozs7Z0JBQUEsSztnQkFBQSxROztjQUFBLE87O1dBQUE7QUFBQTtBQUFBLE9GREY7QUFBQSxNLGdCSUVFO0FBQUEsUSxXQUFBLFdBQUFBLEdBQUE7QUFBQTtBQUFBLGMsUUFBQTtBQUFBLGMsUUFBQTtBQUFBLGMsV0FBQSxFLGF4QkNjLGF3QkRkO0FBQUE7QUFBQTtBQUFBLE9KRkY7QUFBQSxLeEJoQkY7QUFBQTtBQUFBIiwic291cmNlc0NvbnRlbnQiOltudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGxdfQ==
