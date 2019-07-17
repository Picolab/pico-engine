module.exports = function (ast, comp, e) {
  return e('return', e('call', e('id', '$last'), []))
}
