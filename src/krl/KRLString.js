var KRLString = function(str){
  this.self = str;
};
KRLString.prototype.capitalize = function(){
  return this.self.toUpperCase();
};
module.exports = KRLString;
