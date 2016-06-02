module.exports = function(body){
  return {
    "type": "FunctionExpression",
    "id": null,
    "params": [
      {
        "type": "Identifier",
        "name": "ctx"
      },
      {
        "type": "Identifier",
        "name": "callback"
      }
    ],
    "defaults": [],
    "body": {
      "type": "BlockStatement",
      "body": body
    },
    "generator": false,
    "expression": false
  };
};
