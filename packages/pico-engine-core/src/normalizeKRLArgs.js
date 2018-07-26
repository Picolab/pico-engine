var _ = require('lodash')

module.exports = function (paramOrder, krlArgs) {
  var args = {}
  _.each(krlArgs, function (arg, key) {
    if (_.has(paramOrder, key)) {
      args[paramOrder[key]] = arg
    } else if (_.includes(paramOrder, key)) {
      args[key] = arg
    }
  })
  return args
}
