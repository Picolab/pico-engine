var hello = function (obj) {
  var msg = 'Hello ' + obj;
  return msg;
};
module.exports = {
  'name': 'io.picolabs.hello_world',
  'meta': {
    'name': 'Hello World',
    'description': '\nA first ruleset for the Quickstart\n    ',
    'author': 'Phil Windley',
    'logging': true,
    'shares': { 'hello': hello }
  },
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
