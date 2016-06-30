module.exports = {
  'name': 'io.picolabs.hello_world',
  'meta': {
    'name': 'Hello World',
    'description': '\nA first ruleset for the Quickstart\n    ',
    'author': 'Phil Windley',
    'logging': true,
    'shares': [
      'hello'
    ]
  },
  'global': function (ctx) {
    ctx.scope.set('hello', function (ctx) {
      var obj = ctx.args['obj'];
      var msg = 'Hello ' + obj;
      return msg;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhlbGxvID0gZnVuY3Rpb24ob2JqKXtcbiAgICAgIG1zZyA9IFwiSGVsbG8gXCIgKyBvYmo7XG4gICAgICBtc2dcbiAgICB9IiwiaGVsbG8iLCJmdW5jdGlvbihvYmope1xuICAgICAgbXNnID0gXCJIZWxsbyBcIiArIG9iajtcbiAgICAgIG1zZ1xuICAgIH0iLCJvYmoiLCJtc2cgPSBcIkhlbGxvIFwiICsgb2JqIiwibXNnIiwiXCJIZWxsbyBcIiIsIlwiSGVsbG8gXCIgKyBvYmoiLCJydWxlc2V0IGlvLnBpY29sYWJzLmhlbGxvX3dvcmxkIHtcbiAgbWV0YSB7XG4gICAgbmFtZSBcIkhlbGxvIFdvcmxkXCJcbiAgICBkZXNjcmlwdGlvbiA8PFxuQSBmaXJzdCBydWxlc2V0IGZvciB0aGUgUXVpY2tzdGFydFxuICAgID4+XG4gICAgYXV0aG9yIFwiUGhpbCBXaW5kbGV5XCJcbiAgICBsb2dnaW5nIG9uXG4gICAgc2hhcmVzIGhlbGxvXG4gIH1cbiAgZ2xvYmFsIHtcbiAgICBoZWxsbyA9IGZ1bmN0aW9uKG9iail7XG4gICAgICBtc2cgPSBcIkhlbGxvIFwiICsgb2JqO1xuICAgICAgbXNnXG4gICAgfVxuICB9XG4gIHJ1bGUgc2F5X2hlbGxvIHtcbiAgICBzZWxlY3Qgd2hlbiBlY2hvIGhlbGxvXG4gICAgc2VuZF9kaXJlY3RpdmUoXCJzYXlcIikgd2l0aFxuICAgICAgc29tZXRoaW5nID0gXCJIZWxsbyBXb3JsZFwiXG4gIH1cbn0iLCJpby5waWNvbGFicy5oZWxsb193b3JsZCIsIm5hbWUiLCJuYW1lIFwiSGVsbG8gV29ybGRcIiIsIlwiSGVsbG8gV29ybGRcIiIsImRlc2NyaXB0aW9uIiwiZGVzY3JpcHRpb24gPDxcbkEgZmlyc3QgcnVsZXNldCBmb3IgdGhlIFF1aWNrc3RhcnRcbiAgICA+PiIsIlxuQSBmaXJzdCBydWxlc2V0IGZvciB0aGUgUXVpY2tzdGFydFxuICAgICIsImF1dGhvciIsImF1dGhvciBcIlBoaWwgV2luZGxleVwiIiwiXCJQaGlsIFdpbmRsZXlcIiIsImxvZ2dpbmciLCJsb2dnaW5nIG9uIiwib24iLCJzaGFyZXMiLCJzaGFyZXMgaGVsbG8iLCJydWxlIHNheV9oZWxsbyB7XG4gICAgc2VsZWN0IHdoZW4gZWNobyBoZWxsb1xuICAgIHNlbmRfZGlyZWN0aXZlKFwic2F5XCIpIHdpdGhcbiAgICAgIHNvbWV0aGluZyA9IFwiSGVsbG8gV29ybGRcIlxuICB9Iiwic2F5X2hlbGxvIiwic2VsZWN0IHdoZW4gZWNobyBoZWxsbyIsImVjaG8gaGVsbG8iLCJzZW5kX2RpcmVjdGl2ZShcInNheVwiKSB3aXRoXG4gICAgICBzb21ldGhpbmcgPSBcIkhlbGxvIFdvcmxkXCIiXSwibmFtZXMiOlsiaGVsbG8iLCJjdHgiLCJvYmoiLCJhcmdzIiwibXNnIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6IkFBV0ksSUNBQUEsS0RBQSxHRUFRLFVBQUFDLEdBQUE7QUFBQSxFQ0FTLElBQUFDLEdBQUEsR0FBQUQsR0FBQSxDQUFBRSxJQUFBLFFEQVQ7QUFBQSxFRUNOLElDQUFDLEdEQUEsR0VBTSxRQ0FBLEdKQVdGLEdDQWpCLENGRE07QUFBQSxTR0VORSxHSEZNO0FBQUEsQ0ZBUixDUVhKO0FBQUFDLE1BQUEsQ0FBQUMsT0FBQTtBQUFBLEUsUUNBUSx5QkRBUjtBQUFBLEUsUUFBQTtBQUFBLElFRUksTUNBQSxFQ0FLLGFKRlQ7QUFBQSxJS0dJLGFDQUEsRUNBYyw0Q1BIbEI7QUFBQSxJUU1JLFFDQUEsRUNBTyxjVk5YO0FBQUEsSVdPSSxTQ0FBLEVDQVEsSWJQWjtBQUFBLEljUUksUUNBQSxJdEJBTyxPc0JBUCxFdEJBT04sS3NCQVAsRWZSSjtBQUFBO0FBQUEsRSxTQUFBO0FBQUEsSSxhZ0JnQkU7QUFBQSxNLFFDQUssV0RBTDtBQUFBLE0sVUVDRTtBQUFBLFEsU0FBQSxFLFFBQUEsRSxTQUFBLEUsVUFBQTtBQUFBLFEsY0FBQTtBQUFBLFUsVUNBWSxVQUFBQyxHQUFBO0FBQUE7QUFBQSxXREFaO0FBQUE7QUFBQSxRLGlCQUFBO0FBQUEsVTs7Y0FBQSxRO2NBQUEsSzs7OztnQkFBQSxLO2dCQUFBLFE7O2NBQUEsTzs7V0FBQTtBQUFBO0FBQUEsT0ZERjtBQUFBLE0sZ0JJRUU7QUFBQSxRLFdBQUEsV0FBQUEsR0FBQTtBQUFBO0FBQUEsYyxRQUFBO0FBQUEsYyxRQUFBO0FBQUEsYyxXQUFBLEUsYWhCQ2MsYWdCRGQ7QUFBQTtBQUFBO0FBQUEsT0pGRjtBQUFBLEtoQmhCRjtBQUFBO0FBQUEiLCJzb3VyY2VzQ29udGVudCI6W251bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbF19
