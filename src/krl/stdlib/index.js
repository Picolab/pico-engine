module.exports = {
  '+': function(){
    if(arguments.length === 0){
      return;
    }
    var r = arguments[0];
    var i;
    for(i = 1; i < arguments.length; i++){
      r = r + arguments[i];
    }
    return r;
  },
  'beesting': function(val){
    return val + '';
  }
};
