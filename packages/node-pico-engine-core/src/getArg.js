var _ = require("lodash");

/**
 * This allows for both named and positional args
 */
module.exports = function(args, name, index){
  return _.has(args, name)
    ? args[name]
    : args[index];
};
