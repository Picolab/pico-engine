var _ = require('lodash')
var fs = require('fs')
var cuid = require('cuid')
var path = require('path')
var memdown = require('memdown')
var PicoEngine = require('./')
var promiseCallback = require('./promiseCallback')

var testRulesets = {}
var testDir = path.resolve(__dirname, '../../../test-rulesets')
_.each(fs.readdirSync(testDir), function (file) {
  if (!/\.js$/.test(file)) {
    return
  }
  var rs = require(path.resolve(testDir, file))
  if (!rs.rid) {
    return
  }
  testRulesets[rs.rid] = rs
  testRulesets[rs.rid].url = 'http://fake-url/test-rulesets/' + file.replace(/\.js$/, '.krl')
})

var systemRulesets = _.map(_.keys(testRulesets), function (rid) {
  return {
    src: 'ruleset ' + rid + '{}',
    meta: { url: testRulesets[rid].url }
  }
})

function compileAndLoadRulesetTesting (rsInfo, callback) {
  var rid = rsInfo.src.substring(8, rsInfo.src.length - 2)
  var rs = testRulesets[rid]
  callback(null, rs)
}

module.exports = function (opts, callback) {
  opts = opts || {}
  callback = promiseCallback(callback)

  var compileAndLoadRuleset = compileAndLoadRulesetTesting
  if (opts.compileAndLoadRuleset === 'inline') {
    compileAndLoadRuleset = null// use krl compiler
  } else if (opts.compileAndLoadRuleset) {
    compileAndLoadRuleset = opts.compileAndLoadRuleset
  }

  var pe = PicoEngine({
    host: 'https://test-host',
    ___core_testing_mode: true,
    compileAndLoadRuleset: compileAndLoadRuleset,
    rootRIDs: opts.rootRIDs,
    db: {
      db: opts.ldb || memdown(cuid()),
      __use_sequential_ids_for_testing: !opts.__dont_use_sequential_ids_for_testing
    },
    modules: opts.modules
  })
  pe.start(opts.systemRulesets || systemRulesets, function (err) {
    callback(err, pe)
  })
  return callback.promise
}
