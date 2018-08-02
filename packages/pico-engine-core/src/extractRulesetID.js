var _ = require('lodash')
var commentsRegExp = require('comment-regex')

module.exports = function (src) {
  if (!_.isString(src)) {
    return
  }
  var srcNoComments = src.replace(commentsRegExp(), ' ')
  var m = /^\s*ruleset\s+([^\s{]+)/.exec(srcNoComments)
  if (!m) {
    return
  }
  return m[1]
}
