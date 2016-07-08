function KRLType(value){
  this.value = value;
}
KRLType.prototype.toJS = function(){
  return this.value;
};
KRLType.prototype.as = function(type){
  if(type === 'String'){
    return this.value + '';
  }
  throw new Error('Unsupported .as(' + JSON.stringify(type) + ')');
};
module.exports = KRLType;
