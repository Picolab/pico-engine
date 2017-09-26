var _ = require("lodash");
var conf = _.cloneDeep(require("../../.eslintrc.js"));

conf.rules.quotes = ["error", "double", {avoidEscape: true, allowTemplateLiterals: false}];

module.exports = conf;
