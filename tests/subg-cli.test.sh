#!/usr/bin/env bash
# subg-cli.test.sh
# test subg-cli.js from linux/bash

#set -x
#set -e

cd $(dirname $0)/..

dut="node build/src/subg-cli.js"

echo -e "\n\n=====> Fist trivial tests"
${dut} --help
${dut} --version

echo -e "\n\n=====> Expect an error because of wrong command"
${dut} blabla
echo -e "\n\n=====> Expect an error because of repeated command"
${dut} versions versions
echo -e "\n\n=====> Expect an error because of two commands"
${dut} versions pull
echo -e "\n\n=====> Expect an error because of missing mandatory option"
${dut} export_yaml
echo -e "\n\n=====> Expect an error because of wrong option"
${dut} export_yaml --yaml_pathh='tmp/foo.yaml'
echo -e "\n\n=====> Expect an error because of empty string"
${dut} export_yaml --yaml_path=''

echo -e "\n\n=====> Test list"
${dut} list
echo -e "\n\n=====> Test clone"
${dut} --importYaml="tests/test_repos_2.yml" --importDir="tmp" clone
echo -e "\n\n=====> Test checkout"
${dut} --importYaml="tests/test_repos_2.yml" --importDir="tmp" checkout
echo -e "\n\n=====> Test verify"
${dut} --importYaml="tests/test_repos_2.yml" --importDir="tmp" list
${dut} --importYaml="tests/test_repos_2.yml" --importDir="tmp" verify
echo -e "\n\n=====> Test fetch"
${dut} fetch
echo -e "\n\n=====> Test pull"
${dut} pull
echo -e "\n\n=====> Test push"
#${dut} push
echo -e "\n\n=====> Test branch"
${dut} branch
echo -e "\n\n=====> Test status"
${dut} status
echo -e "\n\n=====> Test diff"
${dut} diff
echo -e "\n\n=====> Test log"
${dut} log
echo -e "\n\n=====> Test remote"
${dut} remote
