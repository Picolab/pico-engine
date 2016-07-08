#!/bin/bash

#exit ASAP if anything fails
set -e

node_modules/.bin/krl-compiler --no-source-map < test-rulesets/events.krl > test-rulesets/events.js
node_modules/.bin/krl-compiler --no-source-map < test-rulesets/hello-world.krl > test-rulesets/hello-world.js
node_modules/.bin/krl-compiler --no-source-map < test-rulesets/persistent.krl > test-rulesets/persistent.js
node_modules/.bin/krl-compiler --no-source-map < test-rulesets/scope.krl > test-rulesets/scope.js
node_modules/.bin/krl-compiler --no-source-map < test-rulesets/operators.krl > test-rulesets/operators.js
node_modules/.bin/krl-compiler --no-source-map < test-rulesets/chevron.krl > test-rulesets/chevron.js
