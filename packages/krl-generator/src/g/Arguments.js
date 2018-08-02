var _ = require('lodash')

module.exports = function (ast, ind, gen) {
  var src = ''

  var nNamed = 0

  var strs = _.map(ast.args, function (arg) {
    if (arg.type === 'NamedArgument') {
      nNamed++
    }
    return gen(arg)
  })

  if (nNamed > 1) {
    src += '\n' + ind(1)
    src += strs.join(',\n' + ind(1)) + ','
    src += '\n' + ind()
  } else {
    src += strs.join(', ')
  }

  return src
}
