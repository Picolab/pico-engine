module.exports = {
  'name': 'io.picolabs.chevron',
  'meta': {
    'description': '\nHello Chevrons!\n    ',
    'shares': ['d']
  },
  'global': function (ctx) {
    ctx.scope.set('a', 1);
    ctx.scope.set('b', 2);
    ctx.scope.set('c', '<h1>some<b>html</b></h1>');
    ctx.scope.set('d', '\n      hi ' + ctx.krl.stdlib['beesting'](ctx.scope.get('a')) + ' + ' + ctx.krl.stdlib['beesting'](ctx.scope.get('b')) + ' = ' + ctx.krl.stdlib['beesting'](ctx.krl.stdlib['+'](1, 2)) + '\n      ' + ctx.krl.stdlib['beesting'](ctx.scope.get('c')) + '\n    ');
    ctx.scope.set('e', 'static');
    ctx.scope.set('f', '');
  },
  'rules': {}
};