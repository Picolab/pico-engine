var fn = require('../src/commentsToSpaces');
var test = require('tape');

test('commentsToSpaces', function(t){
  t.equals(fn('blah//ok\n2'), 'blah    \n2');
  t.equals(fn('one/*two*/three'), 'one       three');
  t.equals(fn('one/*\ntwo\n*/three'), 'one  \n   \n  three');

  t.equals(fn('one/*a*b*c**3/*ok*?*/three'),
              'one                  three');

  t.end();
});
