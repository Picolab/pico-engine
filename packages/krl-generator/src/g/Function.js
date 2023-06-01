var _ = require('lodash')

module.exports = function (ast, ind, gen) {
  var src = 'function('
  src += gen(ast.params)
  src += '){\n'

  var body = _.map(ast.body, function (stmt) {
    return gen(stmt, 1) + ';'
  }).join('\n')
  src += body

  if (body.length > 0) {
    src += '\n'
  }

  src += ind(1) + gen(ast.return, 1) + ';'

  src += '\n' + ind() + '}'

  return src
}
