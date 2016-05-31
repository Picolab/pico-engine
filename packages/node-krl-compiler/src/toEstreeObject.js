var _ = require('lodash');

module.exports = function(obj){
  return {
    "type": "ObjectExpression",
    "properties": _.map(obj, function(val_estree, key){
      return {
        "type": "Property",
        "key": {
          "type": "Identifier",
          "name": key
        },
        "value": val_estree,
        "kind": "init",
        "method": false,
        "computed": false,
        "shorthand": false
      };
    })
  };
};
