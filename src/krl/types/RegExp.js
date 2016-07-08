var _ = require('lodash');
var makeType = require('./makeType');

module.exports = makeType(function(pattern, flags){
  if(_.isRegExp(pattern)){
    this.value = pattern;
    return;
  }
  this.value = new RegExp(pattern, flags);
}, {
});
