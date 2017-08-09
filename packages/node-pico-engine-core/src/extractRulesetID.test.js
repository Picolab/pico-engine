var fn = require("./extractRulesetID");
var test = require("tape");

test("extractRulesetID", function(t){
    t.equals(fn(""), undefined);
    t.equals(fn("  "), undefined);
    t.equals(fn("/* ruleset not {} */ ruleset blah.ok.bye "), "blah.ok.bye");
    t.equals(fn("ruleset\n\tio.picolabs.cool-rs{}"), "io.picolabs.cool-rs");
    t.equals(fn("rulesetok{}"), undefined);
    t.equals(fn(null), undefined);
    t.equals(fn(), undefined);
    t.end();
});
