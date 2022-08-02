#!/usr/bin/env bash
# subg-cli.test.sh
# test subg-cli.js from linux/bash

#set -x
#set -e

cd $(dirname $0)

dut="node ../build/src/subg-cli.js"

${dut} --help


