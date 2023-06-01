#!/bin/bash

#exit ASAP if anything fails
set -e

for f in test-rulesets/*.krl;
do
  out=$(echo $f | sed "s/\.krl$/\.js/")
  ./packages/krl-compiler/bin/krl-compiler --no-source-map < $f > $out
done
