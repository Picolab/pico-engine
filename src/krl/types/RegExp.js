var makeType = require('./makeType');

module.exports = makeType(function(pattern, flags){
  this.value = new RegExp(pattern, flags);
}, {
});
