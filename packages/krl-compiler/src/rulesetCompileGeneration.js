/**
 * Cache key for compiled ruleset artifacts. Bumps when compiler or parser
 * (including parser build output) changes, even if KRL source hash is unchanged.
 */
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

module.exports = function rulesetCompileGeneration () {
  const compilerVersion = require('../package.json').version
  const parserRoot = path.dirname(require.resolve('krl-parser/package.json'))
  const parserVersion = require(path.join(parserRoot, 'package.json')).version
  let parserBuild = '0'
  try {
    const docComment = path.join(parserRoot, 'dist/src/docComment.js')
    parserBuild = crypto
      .createHash('sha256')
      .update(fs.readFileSync(docComment))
      .digest('hex')
      .slice(0, 12)
  } catch (_) {
    /* parser not built yet */
  }
  let compilerEmit = '0'
  try {
    const rulesetEmit = path.join(__dirname, 'c/Ruleset.js')
    compilerEmit = crypto
      .createHash('sha256')
      .update(fs.readFileSync(rulesetEmit))
      .digest('hex')
      .slice(0, 12)
  } catch (_) {
    /* unexpected */
  }
  return `${compilerVersion}+${parserVersion}+${parserBuild}+${compilerEmit}`
}
