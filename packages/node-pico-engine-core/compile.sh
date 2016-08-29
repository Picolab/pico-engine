#!/bin/bash

#exit ASAP if anything fails
set -e

for f in test-rulesets/*.krl;
do
  out=$(echo $f | sed "s/\.krl$/\.js/")
  node_modules/.bin/krl-compiler --no-source-map < $f > $out
done
