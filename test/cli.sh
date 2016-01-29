#!/bin/bash

TEST="At least runs and prints usage"
if node ./_build/cli/index.js 2>&1 | fgrep Usage &> /dev/null; then
  echo "${TEST}: OK"
else
  echo "${TEST}: failed"
fi
