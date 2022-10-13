var _ = require('lodash')

module.exports = function (ast, ind, gen) {
  var src = ''
  src += 'defaction('
  src += gen(ast.params)
  src += '){\n'

  src += _.map(ast.body, function (stmt) {
    return gen(stmt, 1)
  }).join(';\n')
  if (!_.isEmpty(ast.body)) {
    src += ';\n'
  }

  src += gen(ast.action_block, 1)

  if (ast.return) {
    src += '\n' + ind(1) + 'return ' + gen(ast.return, 1) + ';'
  }

  src = _.trimEnd(src)
  src += '\n' + ind() + '}'

  return src
}
