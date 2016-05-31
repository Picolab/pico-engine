var toEstreeObject = require('./toEstreeObject');

module.exports = function(ast){

  return toEstreeObject({
    name: {
      "type": "Literal",
      "value": ast.name
    },
    rules: toEstreeObject({})
  });
};
