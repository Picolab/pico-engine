var _ = require("lodash");

//t.deepEqual(s) has better error messages, but it confuses
//  [] and {} (https://github.com/substack/tape/issues/186)
module.exports.strictDeepEquals = function(t, actual, expected, message){
    t.ok(_.isEqual(actual, expected), message || "should be equivalent");
};

module.exports.useStrict = function(expected){
    return _.isEqual(expected, []) || _.isEqual(expected, {});
};