var makeType = require('./makeType');

module.exports = makeType(function(value){
  this.value = value;
}, {
  capitalize: function(){
    return this.value.toUpperCase();
  }
});
