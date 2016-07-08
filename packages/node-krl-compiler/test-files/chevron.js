module.exports = {
  'name': 'io.picolabs.chevron',
  'meta': {
    'description': '\nHello Chevrons!\n    ',
    'shares': ['d']
  },
  'global': function (ctx) {
    ctx.scope.set('a', new ctx.krl.Number(1));
    ctx.scope.set('b', new ctx.krl.Number(2));
    ctx.scope.set('c', new ctx.krl.String('<h1>some<b>html</b></h1>'));
    ctx.scope.set('d', new ctx.krl.String('\n      hi ' + ctx.krl.stdlib['beesting'](ctx.scope.get('a')) + ' + ' + ctx.krl.stdlib['beesting'](ctx.scope.get('b')) + ' = ' + ctx.krl.stdlib['beesting'](ctx.krl.stdlib['+'](new ctx.krl.Number(1), new ctx.krl.Number(2))) + '\n      ' + ctx.krl.stdlib['beesting'](ctx.scope.get('c')) + '\n    '));
    ctx.scope.set('e', new ctx.krl.String('static'));
    ctx.scope.set('f', new ctx.krl.String(''));
  },
  'rules': {}
};
