var testA = require('./helpers/testA')
var fn = require('../src/extractRulesetID')

testA('extractRulesetID', function (t) {
  t.is(fn(''), undefined)
  t.is(fn('  '), undefined)
  t.is(fn('/* ruleset not {} */ ruleset blah.ok.bye '), 'blah.ok.bye')
  t.is(fn('ruleset\n\tio.picolabs.cool-rs{}'), 'io.picolabs.cool-rs')
  t.is(fn('rulesetok{}'), undefined)
  t.is(fn(null), undefined)
  t.is(fn(), undefined)
})
