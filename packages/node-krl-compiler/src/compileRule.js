var _ = require('lodash');
var toEstreeObject = require('./toEstreeObject');

module.exports = function(ast){
  var obj = {};
  _.each(ast.body, function(ast){
    if(!ast){
      return;
    }
    if(ast.type === 'select_when'){
    }else{
      console.log(JSON.stringify(ast, false, 2));
    }
  });
  process.exit(0);
  return toEstreeObject(obj);
  /*
    name: {
      "type": "Literal",
      "value": 'TODO rule for' + ast.name
    }
    */
};
