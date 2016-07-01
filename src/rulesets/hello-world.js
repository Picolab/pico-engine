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
      ctx.scope.set('obj', ctx.getArg('obj', 0));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJ1bGVzZXQgaW8ucGljb2xhYnMuaGVsbG9fd29ybGQge1xuICBtZXRhIHtcbiAgICBuYW1lIFwiSGVsbG8gV29ybGRcIlxuICAgIGRlc2NyaXB0aW9uIDw8XG5BIGZpcnN0IHJ1bGVzZXQgZm9yIHRoZSBRdWlja3N0YXJ0XG4gICAgPj5cbiAgICBhdXRob3IgXCJQaGlsIFdpbmRsZXlcIlxuICAgIGxvZ2dpbmcgb25cbiAgICBzaGFyZXMgaGVsbG9cbiAgfVxuICBnbG9iYWwge1xuICAgIGhlbGxvID0gZnVuY3Rpb24ob2JqKXtcbiAgICAgIG1zZyA9IFwiSGVsbG8gXCIgKyBvYmo7XG4gICAgICBtc2dcbiAgICB9XG4gIH1cbiAgcnVsZSBzYXlfaGVsbG8ge1xuICAgIHNlbGVjdCB3aGVuIGVjaG8gaGVsbG9cbiAgICBzZW5kX2RpcmVjdGl2ZShcInNheVwiKSB3aXRoXG4gICAgICBzb21ldGhpbmcgPSBcIkhlbGxvIFdvcmxkXCJcbiAgfVxufSIsImlvLnBpY29sYWJzLmhlbGxvX3dvcmxkIiwibmFtZSIsIm5hbWUgXCJIZWxsbyBXb3JsZFwiIiwiXCJIZWxsbyBXb3JsZFwiIiwiZGVzY3JpcHRpb24iLCJkZXNjcmlwdGlvbiA8PFxuQSBmaXJzdCBydWxlc2V0IGZvciB0aGUgUXVpY2tzdGFydFxuICAgID4+IiwiXG5BIGZpcnN0IHJ1bGVzZXQgZm9yIHRoZSBRdWlja3N0YXJ0XG4gICAgIiwiYXV0aG9yIiwiYXV0aG9yIFwiUGhpbCBXaW5kbGV5XCIiLCJcIlBoaWwgV2luZGxleVwiIiwibG9nZ2luZyIsImxvZ2dpbmcgb24iLCJvbiIsInNoYXJlcyIsInNoYXJlcyBoZWxsbyIsImhlbGxvIiwiaGVsbG8gPSBmdW5jdGlvbihvYmope1xuICAgICAgbXNnID0gXCJIZWxsbyBcIiArIG9iajtcbiAgICAgIG1zZ1xuICAgIH0iLCJmdW5jdGlvbihvYmope1xuICAgICAgbXNnID0gXCJIZWxsbyBcIiArIG9iajtcbiAgICAgIG1zZ1xuICAgIH0iLCJvYmoiLCJtc2cgPSBcIkhlbGxvIFwiICsgb2JqIiwibXNnIiwiXCJIZWxsbyBcIiIsIlwiSGVsbG8gXCIgKyBvYmoiLCJydWxlIHNheV9oZWxsbyB7XG4gICAgc2VsZWN0IHdoZW4gZWNobyBoZWxsb1xuICAgIHNlbmRfZGlyZWN0aXZlKFwic2F5XCIpIHdpdGhcbiAgICAgIHNvbWV0aGluZyA9IFwiSGVsbG8gV29ybGRcIlxuICB9Iiwic2F5X2hlbGxvIiwic2VsZWN0IHdoZW4gZWNobyBoZWxsbyIsImVjaG8gaGVsbG8iLCJzZW5kX2RpcmVjdGl2ZShcInNheVwiKSB3aXRoXG4gICAgICBzb21ldGhpbmcgPSBcIkhlbGxvIFdvcmxkXCIiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0cyIsImN0eCIsInNjb3BlIiwic2V0IiwiZ2V0QXJnIiwiZ2V0Il0sIm1hcHBpbmdzIjoiQUFBQUEsTUFBQSxDQUFBQyxPQUFBO0FBQUEsRSxRQ0FRLHlCREFSO0FBQUEsRSxRQUFBO0FBQUEsSUVFSSxNQ0FBLEVDQUssYUpGVDtBQUFBLElLR0ksYUNBQSxFQ0FjLDRDUEhsQjtBQUFBLElRTUksUUNBQSxFQ0FPLGNWTlg7QUFBQSxJV09JLFNDQUEsRUNBUSxJYlBaO0FBQUEsSWNRSSxRQ0FBLEdDQU8sT0RBUCxDZlJKO0FBQUE7QUFBQSxFLFVBQUEsVUFBQUMsR0FBQTtBQUFBLElpQldJQSxHQUFBLENBQUFDLEtBQUEsQ0FBQUMsR0FBQSxDREFBLE9DQUEsRUNBUSxVQUFBRixHQUFBO0FBQUEsTUNBU0EsR0FBQSxDQUFBQyxLQUFBLENBQUFDLEdBQUEsUUFBQUYsR0FBQSxDQUFBRyxNQUFBLFlEQVQ7QUFBQSxNRUNOSCxHQUFBLENBQUFDLEtBQUEsQ0FBQUMsR0FBQSxDQ0FBLEtEQUEsRUVBTSxRQ0FBLEdKQVdGLEdBQUEsQ0FBQUMsS0FBQSxDQUFBRyxHQUFBLE9DQWpCLEVGRE07QUFBQSxhR0VOSixHQUFBLENBQUFDLEtBQUEsQ0FBQUcsR0FBQSxPSEZNO0FBQUEsS0RBUixFakJYSjtBQUFBO0FBQUEsRSxTQUFBO0FBQUEsSSxhd0JnQkU7QUFBQSxNLFFDQUssV0RBTDtBQUFBLE0sVUVDRTtBQUFBLFEsU0FBQSxFLFFBQUEsRSxTQUFBLEUsVUFBQTtBQUFBLFEsY0FBQTtBQUFBLFUsVUNBWSxVQUFBSixHQUFBO0FBQUE7QUFBQSxXREFaO0FBQUE7QUFBQSxRLGlCQUFBO0FBQUEsVTs7Y0FBQSxRO2NBQUEsSzs7OztnQkFBQSxLO2dCQUFBLFE7O2NBQUEsTzs7V0FBQTtBQUFBO0FBQUEsT0ZERjtBQUFBLE0sZ0JJRUU7QUFBQSxRLFdBQUEsV0FBQUEsR0FBQTtBQUFBO0FBQUEsYyxRQUFBO0FBQUEsYyxRQUFBO0FBQUEsYyxXQUFBLEUsYXhCQ2MsYXdCRGQ7QUFBQTtBQUFBO0FBQUEsT0pGRjtBQUFBLEt4QmhCRjtBQUFBO0FBQUEiLCJzb3VyY2VzQ29udGVudCI6W251bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbF19
