function KRLType(value){
  this.value = value;
}
KRLType.prototype.toJS = function(){
  return this.value;
};
module.exports = KRLType;
