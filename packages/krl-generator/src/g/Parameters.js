var _ = require('lodash')

module.exports = function (ast, ind, gen) {
  var src = ''

  var newlineParams = false
  var strs = _.map(ast.params, function (param) {
    if (param['default']) {
      newlineParams = true
    }
    return gen(param)
  })
  if (newlineParams) {
    src += '\n' + ind(1)
    src += strs.join(',\n' + ind(1)) + ','
    src += '\n' + ind()
  } else {
    src += strs.join(', ')
  }

  return src
}
