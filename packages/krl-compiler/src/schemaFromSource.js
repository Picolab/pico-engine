var parser = require('krl-parser')
var EStreeLoc = require('estree-loc')
var compile = require('./compile')

module.exports = function schemaFromSource (src, options) {
  options = options || {}
  var ast = parser(src, options.parser_options)
  if (!ast || ast.type !== 'Ruleset') {
    throw new Error('schemaFromSource expects a ruleset')
  }
  var toLoc = EStreeLoc(src, options.filepath)
  var compiled = compile(ast, { toLoc: toLoc })
  return {
    rid: compiled.rid,
    rulesetSchema: compiled.rulesetSchema,
    warnings: compiled.warnings
  }
}
