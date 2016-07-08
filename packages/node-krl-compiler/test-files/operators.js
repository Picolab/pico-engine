module.exports = {
  'name': 'io.picolabs.operators',
  'meta': { 'shares': ['cap_hello'] },
  'global': function (ctx) {
    ctx.scope.set('cap_hello', ctx.krl.stdlib['capitalize']('Hello World'));
  },
  'rules': {}
};
