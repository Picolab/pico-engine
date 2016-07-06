module.exports = {
  'name': 'io.picolabs.chevron',
  'meta': { 'description': '\nHello Chevrons!\n    ' },
  'global': function (ctx) {
    ctx.scope.set('a', 1);
    ctx.scope.set('b', 2);
    ctx.scope.set('c', new ctx.krl.String('<h1>some<b>html</b></h1>'));
    ctx.scope.set('d', new ctx.krl.String('\n      hi ' + ctx.krl.beesting(ctx.scope.get('a')) + ' + ' + ctx.krl.beesting(ctx.scope.get('b')) + ' = ' + ctx.krl.beesting(1 + 2) + '\n      ' + ctx.krl.beesting(ctx.scope.get('c')) + '\n    '));
    ctx.scope.set('e', new ctx.krl.String('static'));
    ctx.scope.set('f', new ctx.krl.String(''));
  },
  'rules': {}
};
