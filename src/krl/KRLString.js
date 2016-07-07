var makeType = require('./makeType');

var KRLString = makeType(function(value){
  this.value = value;
}, {
  capitalize: function(){
    return this.value.toUpperCase();
  },
  toJS: function(){
    return this.value;
  }
});

module.exports = function(str){
  return new KRLString(str);
};
