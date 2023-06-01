var _ = require('lodash')

module.exports = function (ast, ind, gen) {
  var src = ''
  src += '\n'
  if (ast.label) {
    src += ind() + gen(ast.label) + ' =>\n'
    src += ind(1)
  } else {
    src += ind()
  }
  src += gen(ast.action) + '('
  src += gen(ast.args)
  src += ')'
  if (!_.isEmpty(ast.setting)) {
    src += ' setting('
    src += _.map(ast.setting, function (s) {
      return gen(s)
    }).join(', ')
    src += ')'
  }
  src += ';'
  src += '\n'
  return src
}
