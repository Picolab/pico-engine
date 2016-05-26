var test = require('tape');
var parser = require('./');

test('parser', function(t){
  t.deepEquals(parser('1'), [
    {type: 'int', src: '1', loc: 0}
  ]);
  t.end();
});
