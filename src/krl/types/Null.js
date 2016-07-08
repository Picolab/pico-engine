var makeType = require('./makeType');

module.exports = makeType(function(){}, {
  isnull: function(){
    return true;
  }
});
