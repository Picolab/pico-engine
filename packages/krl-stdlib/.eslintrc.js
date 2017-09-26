var _ = require("lodash");
var conf = _.cloneDeep(require("../../.eslintrc.js"));

conf.env.es6 = true;//only for generator functions
conf.rules["require-yield"] = "off";

module.exports = conf;
