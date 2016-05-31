module.exports = function(ast){

  console.log(JSON.stringify(ast, false, 2));
  process.exit(0);

  return {
    "type": "ObjectExpression",
    "properties": [
    ]
  };
};
