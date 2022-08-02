#!/usr/bin/env node
// subg-cli.ts

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { Subg } from '../src/subg-api.js';


//await repos.d_custom('status');
//await repos.d_custom('status', true);
//await repos.d_export_yaml('tmp/exported_repos_1.yml');
//await repos.d_export_yaml('tmp/exported_repos_2.yml', true);
//const validation_result = await repos.validate_yaml('tests/test_repos_3.yml');
let cmd = {
  list: false,
  clone: false,
  checkout: false,
  verify: false,
  fetch: false,
  pull: false,
  push: false,
  branch: false,
  status: false,
  diff: false,
  log: false,
  remote: false,
  stash_list: false,
  clean: false,
  custom: false,
  export_yaml: false,
  validate_yaml: false,
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
  .command('list', 'print the lists of git-repositories', {},
    (a_argv) => { cmd.list = true; }
  )
  .command('clone', 'clone the git-repositories listed in the importYaml file', {},
    (a_argv) => { cmd.clone = true; }
  )
  .command('checkout', 'checkout the git-repos according to the importYaml file', {},
    (a_argv) => { cmd.checkout = true; }
  )
  .command('verify', 'verify if the discovered git-repos fit with the importYaml', {},
    (a_argv) => { cmd.verify = true; }
  )
  .command('fetch', 'git fetch --prune the discovered git-repositories', {},
    (a_argv) => { cmd.pull = true; }
  )
  .command('pull', 'pull the discovered git-repositories', {},
    (a_argv) => { cmd.pull = true; }
  )
  .command('push', 'push the discovered git-repositories', {},
    (a_argv) => { cmd.push = true; }
  )
  .command('branch', 'show branch of the discovered git-repositories', {},
    (a_argv) => { cmd.branch = true; }
  )
  .command('status', 'show status of the discovered git-repositories', {},
    (a_argv) => { cmd.status = true; }
  )
  .command('diff', 'show diff of the discovered git-repositories', {},
    (a_argv) => { cmd.diff = true; }
  )
  .command('log', 'show log of the discovered git-repositories', {},
    (a_argv) => { cmd.log = true; }
  )
  .command('remote', 'show remote of the discovered git-repositories', {},
    (a_argv) => { cmd.remote = true; }
  )
  .command('stash_list', 'show stash_list of the discovered git-repositories', {},
    (a_argv) => { cmd.stash_list = true; }
  )
  .command('clean', 'git clean -dxf of the discovered git-repositories', {},
    (a_argv) => { cmd.clean = true; }
  )
  .command('custom', 'git custom command for each of the discovered git-repos', {},
    (a_argv) => { cmd.custom = true; }
  )
  .command('export_yaml', 'export the discovered git-repositories in a yaml-file', {},
    (a_argv) => { cmd.export_yaml = true; }
  )
  .command('validate_yaml', 'validate the syntax of a yaml-file', {},
    (a_argv) => { cmd.validate_yaml = true; }
  )
  .command('versions', 'print the versions of subg', {},
    (a_argv) => { cmd.versions = true; }
  )
  .strict()
  .parse();
//console.log(argv.discoverDir);
//console.log(argv);

//console.log("Hello from subg-cli.ts!");

const argv2:any = argv; // workaround for typescript error
//console.log(argv2.discoverDir);
//console.log(argv2.deepSearch);
//console.log(argv2.importYaml);
//console.log(argv2.importDir);
const subg = new Subg(argv2.discoverDir, argv2.deepSearch, argv2.importYaml, argv2.importDir);
await subg.init();

function display_repo_list(repos:string[]):void {
  for (const [idx, repo] of repos.entries()) {
    console.log(`  ${idx+1} : ${repo}`);
  }
}

if (cmd.list) {
  const d_list = subg.d_list();
  const c_list = subg.c_list();
  const cd_list = subg.cd_list();
  const dnc_list = subg.dnc_list();
  const cnd_list = subg.cnd_list();
  console.log(`List-D : ${d_list.length} discovered git-repositories`);
  display_repo_list(d_list);
  console.log(`List-C : ${c_list.length} configured git-repositories`);
  display_repo_list(c_list);
  console.log(`List-CD : ${cd_list.length} configured and discovered git-repositories`);
  display_repo_list(cd_list);
  console.log(`List-DnC : ${dnc_list.length} discovered git-repositories but not configured`);
  display_repo_list(dnc_list);
  console.log(`List-CnD : ${cnd_list.length} configured git-repositories but not discovered`);
  display_repo_list(cnd_list);
}

if (cmd.clone) { await subg.c_clone(); }
if (cmd.checkout) { await subg.cd_checkout(); }
if (cmd.verify) { await subg.cd_verify(); }
if (cmd.fetch) { await subg.d_fetch(); }
if (cmd.pull) { await subg.d_pull(); }
if (cmd.push) { await subg.d_push(); }
if (cmd.branch) { await subg.d_branch(); }
if (cmd.status) { await subg.d_status(); }
if (cmd.diff) { await subg.d_diff(); }
if (cmd.log) { await subg.d_log(); }
if (cmd.remote) { await subg.d_remote(); }
if (cmd.stash_list) { await subg.d_stash_list(); }
//if (cmd.clean) { await subg.clean(); }
//if (cmd.custom) { await subg.d_custom(); }
//if (cmd.export_yaml) { await subg.d_export_yaml(); }
//if (cmd.validate_yaml) { await subg.validate_yaml(); }

if (cmd.versions) {
  console.log(`subg-version-short : ${Subg.version_short()}`);
  console.log(`subg-version-long  : ${Subg.version_long()}`);
}

