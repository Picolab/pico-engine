module.exports = function (ast, ind, gen) {
  var r = ast.value
  var source = r.source
  if (r.source === '(?:)') {
    source = ''
  }
  return 're#' + source + '#' +
        (r.global ? 'g' : '') +
        (r.ignoreCase ? 'i' : '')
}
