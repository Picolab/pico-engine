var hello = function (obj) {
  var msg = 'Hello ' + obj;
  return msg;
};
module.exports = {
  'name': 'hello_world',
  'rules': {
    'say_hello': {
      'select': {
        'graph': { 'echo': { 'hello': { 'expr_0': true } } },
        'eventexprs': {
          'expr_0': function (ctx, callback) {
            callback(undefined, ctx.event.domain === 'echo' && ctx.event.type === 'hello');
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
      'action': function (ctx, callback) {
        callback(undefined, {
          'type': 'directive',
          'name': 'say',
          'options': { 'something': 'Hello World' }
        });
      }
    }
  }
};
