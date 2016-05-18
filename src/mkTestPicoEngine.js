var memdown = require('memdown');
var PicoEngine = require('./');

module.exports = function(){
  return PicoEngine({
    db: {
      db: memdown,
      newID: (function(){
        var i = 0;
        return function(){
          return 'id' + i++;
        };
      }())
    }
  });
};
