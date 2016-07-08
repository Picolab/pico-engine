function KRLType(value){
  this.value = value;
}
KRLType.prototype.klog = function(msg){
  console.log('[KLOG] ' + msg + JSON.stringify(this.value));
  return this;
};
KRLType.prototype.as = function(type){
//TODO Strings can be coerced to numbers and regular expressions.
//TODO Numbers can be coerced to strings.
//TODO Regular expressions can be coerced to strings.
  if(type === 'String'){
    //TODO return KRLString
    return this.value + '';
  }else if(type === 'javascript'){
    return this.value;
  }
  throw new Error('Unsupported .as(' + JSON.stringify(type) + ')');
};
KRLType.prototype.isnull = function(){
  return false;
};
KRLType.prototype['typeof'] = function(){
  //each sub-class should override this
  throw new Error('typeof not implemented for this type');
};
module.exports = KRLType;
