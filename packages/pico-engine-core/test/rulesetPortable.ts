import test from "ava";
import {
  isEngineBundledRulesetUrl,
  needsInlineKrlOnExport,
  portableRulesetUrl,
} from "../src/rulesetPortable";

test("needsInlineKrlOnExport is true for custom local file: URLs", (t) => {
  t.true(needsInlineKrlOnExport("file:///tmp/dev-only/custom.krl"));
  t.true(needsInlineKrlOnExport("file:///Users/me/proj/my-ruleset.krl"));
});

test("needsInlineKrlOnExport is false for bundled engine file: URLs", (t) => {
  t.false(
    needsInlineKrlOnExport(
      "file:///opt/pico-engine/krl/io.picolabs.wrangler.krl"
    )
  );
  t.false(
    needsInlineKrlOnExport(
      "file:///var/engine/dist/krl/io.picolabs.subscription.krl"
    )
  );
});

test("needsInlineKrlOnExport is false for remote and mem URLs", (t) => {
  t.false(needsInlineKrlOnExport("mem://state_test"));
  t.false(needsInlineKrlOnExport("https://example.com/rules/foo.krl"));
  t.false(
    needsInlineKrlOnExport("https://host/krl/io.picolabs.wrangler.krl")
  );
});

test("isEngineBundledRulesetUrl recognizes bundled http and file paths", (t) => {
  t.true(
    isEngineBundledRulesetUrl(
      "https://engine.example/krl/io.picolabs.wrangler.krl"
    )
  );
  t.true(
    isEngineBundledRulesetUrl(
      "file:///opt/pico/krl/io.picolabs.subscription.krl"
    )
  );
  t.false(isEngineBundledRulesetUrl("file:///tmp/custom.krl"));
  t.false(isEngineBundledRulesetUrl("https://example.com/other.krl"));
});

test("portableRulesetUrl is stable for identical KRL", (t) => {
  const krl = 'ruleset foo { meta { shares x } global { x = function() { 1 } } }';
  t.is(portableRulesetUrl(krl), portableRulesetUrl(krl));
  t.true(portableRulesetUrl(krl).startsWith("portable://"));
});
