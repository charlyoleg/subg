#!/usr/bin/env node
// subg-cli.ts

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { Subg } from '../src/subg-api.js';


let cmd = {
  clone: false,
  versions: false
};

const argv = yargs(hideBin(process.argv))
  .scriptName("subg")
  .usage("Usage: $0 --importYaml repos.yml clone")
  .option('discoverDir', {
    alias: 'd',
    type: 'string',
    description: 'directory-path for searching git-repositories.',
    default: '.'
    })
  .option('deepSearch', {
    alias: 'D',
    type: 'boolean',
    description: 'search further for git-repos within found git-repos.',
    default: true
    })
  .option('importYaml', {
    alias: 'y',
    type: 'string',
    description: 'path to the yaml-file containing the list of repos.',
    default: ''
    })
  .option('importDir', {
    alias: 'b',
    type: 'string',
    description: 'path to the directory where to clone the repos. If not specified, the directory of the yaml-file is used.',
    default: ''
    })
//  .command({
//    command: 'versions',
//    desc: 'print the versions of subg',
//    builder: (yargs) => yargs.option('vvv',  {default: true}),
//    handler: (argv) => {cmd.versions = true;}
//    })
  .parse();
//console.log(argv.discoverDir);

//console.log("Hello from subg-cli.ts!");

const repos = new Subg('.', true, 'tests/test_repos_2.yml', 'tmp');
await repos.init();

if (cmd.versions) {
  console.log(`subg-version-short : ${Subg.version_short()}`);
  console.log(`subg-version-long  : ${Subg.version_long()}`);
}

