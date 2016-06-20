module.exports = function(src){
  src = src.replace(/\/\/[^\n]*\n/g, function(rep){
    return rep.replace(/[^\n]/g, ' ');
  });
  src = src.replace(/\/\*([^*]|(\*+[^\/]))*\*+\//g, function(rep){
    return rep.replace(/[^\n]/g, ' ');
  });
  return src;
};
