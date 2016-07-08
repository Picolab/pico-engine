function KRLType(value){
  this.value = value;
}
KRLType.prototype.as = function(type){
  if(type === 'String'){
    return this.value + '';
  }else if(type === 'javascript'){
    return this.value;
  }
  throw new Error('Unsupported .as(' + JSON.stringify(type) + ')');
};
module.exports = KRLType;
