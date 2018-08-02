var _ = require('lodash')
var btoa = require('btoa')
var parser = require('krl-parser')
var compile = require('./compile')
var escodegen = require('escodegen')
var EStreeLoc = require('estree-loc')

module.exports = function (input, options) {
  options = options || {}

  var src = _.isString(input) ? input : null
  var toLoc = src ? EStreeLoc(src, options.filepath) : _.noop
  var ast = src ? parser(src, options.parser_options) : input

  var compiled = compile(ast, {
    toLoc: toLoc
  })

  var out = escodegen.generate({
    'loc': toLoc(0, src.length - 1),
    'type': 'Program',
    'body': compiled.body
  }, {
    format: {
      quotes: 'double',
      indent: {
        style: '  '
      }
    },
    sourceMap: true,
    sourceContent: src,
    sourceMapWithCode: true
  })

  var r = {
    code: out.code,
    warnings: compiled.warnings
  }

  if (options.inline_source_map) {
    r.code += '\n//# sourceMappingURL=data:application/json;base64,' +
            btoa(out.map.toString()) +
            '\n'
  }
  return r
}
