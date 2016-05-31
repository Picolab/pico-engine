var parser = require('krl-parser');

module.exports = function(src){
  var ast = parser(src);

  return 'console.log("TODO");';
};
