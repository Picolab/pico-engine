module.exports = {
  'name': 'io.picolabs.operators',
  'meta': { 'shares': ['results'] },
  'global': function (ctx) {
    ctx.scope.set('nothing', void 0);
    ctx.scope.set('some_string', 'foo');
    ctx.scope.set('results', {
      'str_as_num': ctx.krl.stdlib['as']('100.25', 'Number'),
      'num_as_str': ctx.krl.stdlib['as'](1.05, 'String'),
      'regex_as_str': ctx.krl.stdlib['as'](new RegExp('blah', 'i'), 'String'),
      'isnull': [
        ctx.krl.stdlib['isnull'](1),
        ctx.krl.stdlib['isnull'](ctx.scope.get('some_string')),
        ctx.krl.stdlib['isnull'](ctx.scope.get('nothing'))
      ],
      'hello_cap': ctx.krl.stdlib['capitalize']('Hello World'),
      'hello_low': ctx.krl.stdlib['lc']('Hello World')
    });
  },
  'rules': {}
};
