// subg-cli.js

import { Subg } from "../src/subg-api.js";

//const repos = new Subg();
//const repos = new Subg('.');
//const repos = new Subg('.', false);
//const repos = new Subg('.', true, 'tmp/repos.yml', '');
//const repos = new Subg('.', true, 'tmp/repos.yml', '.');
//const repos = new Subg('.', true, 'tests/test_repos_1.yml', 'tmp');
const repos = new Subg(".", true, "tests/test_repos_2.yml", "tmp");

//await repos.discover_repos();
//await repos.discover_repos('..');
//await repos.import_yaml('tests/test_repos_1.yml', 'tmp');
await repos.init();
//await repos.init('..');
const d_list = repos.d_list();
const c_list = repos.c_list();
const cd_list = repos.cd_list();
const dnc_list = repos.dnc_list();
const cnd_list = repos.cnd_list();

console.log(d_list);
console.log(c_list);
console.log(cd_list);
console.log(dnc_list);
console.log(cnd_list);

//await repos.d_export_yaml('tmp/exported_repos_1.yml');
//await repos.d_export_yaml('tmp/exported_repos_2.yml', true);
//const validation_result2 = await repos.validate_yaml('tests/test_repos_3.yml');
//console.log(validation_result2);
//console.log(`subg-version-short : ${Subg.version_short()}`);
//console.log(`subg-version-long  : ${Subg.version_long()}`);
//process.exit(0);

await repos.c_clone();
await repos.cd_checkout();
await repos.cd_verify();
await repos.d_custom("status");
await repos.d_custom("status", true);
await repos.d_fetch();
await repos.d_pull();
//await repos.d_push();
await repos.d_branch();
await repos.d_status();
await repos.d_diff();
await repos.d_log();
await repos.d_remote();
await repos.d_stash_list();
await repos.d_clean();

await repos.d_export_yaml("tmp/exported_repos_1.yml");
await repos.d_export_yaml("tmp/exported_repos_2.yml", true);
const validation_result = await repos.validate_yaml("tests/test_repos_3.yml");
console.log(validation_result);

console.log(`subg-version-short : ${Subg.version_short()}`);
console.log(`subg-version-long  : ${Subg.version_long()}`);
