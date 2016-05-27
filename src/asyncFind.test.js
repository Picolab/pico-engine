var test = require('tape');
var asyncFind = require('./asyncFind');

test('asyncFind', function(t){

  var stms = [
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6]
  ];

  asyncFind(stms, function(stmt, next){
    process.nextTick(function(){
      if(stmt[0] > 3){
        t.fail('once the item is found it should stop processing');
      }
      next(undefined, stmt[0] === 3);
    });
  }, function(err, stmt){
    if(err) return t.end(err);

    t.deepEquals(stmt, [3, 4]);

    t.end();
  });
});
