// generate_version_info.js
"use strict";

//import { setTimeout } from 'node:timers/promises';
import process from 'node:process';
import console from 'node:console';
import path from 'node:path';
import fse from 'fs-extra';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import {simpleGit} from 'simple-git';
import dateFormat from "dateformat";


async function get_version_info(a_output_path, a_script_name) {
  const pkg_name = process.env.npm_package_name;
  const pkg_version = process.env.npm_package_version;
  let build_number = process.env.CI_PIPELINE_IID;
  //console.log(build_number);
  if (build_number == undefined) {
    build_number = 0;
  }
  let commit_hash = '0'.repeat(8);
  try {
    const git = simpleGit('.');
    const commit = await git.log();
    //console.log(commit);
    commit_hash = commit.latest.hash.substring(0,8);
    const git_status = await git.status();
    //console.log(status.isClean());
    if (!git_status.isClean()) {
      commit_hash += '.dirty';
    }
  } catch(error) {
    console.log(`ERR762: Error by git-operations`);
    console.error(error);
  }
  const now = new Date();
  const timestamp = dateFormat(now, 'yyyymmdd_hhMMss');
  let r_str = "";
  r_str += `// ${a_output_path}\n`;
  r_str += `// generated by ${a_script_name}\n\n`;
  r_str += `const subg_version_short = '${pkg_version}';\n`;
  r_str += `const subg_version_long = '${pkg_name}_${pkg_version}.${build_number}_${commit_hash}_${timestamp}';\n`;
  r_str += `\nexport {subg_version_short, subg_version_long};\n`;
  return r_str;
}



//console.log(process.argv);
const script_name = path.basename(process.argv[1]);

const argv = yargs(hideBin(process.argv))
  .option('output_path', {
    alias: 'o',
    type: 'string',
    description: 'path to the output typescript-file',
    default: 'src/version_info.ts'
    })
  .parse();
//console.log(argv.output_path);

console.log(`Hello from ${script_name}`);

//console.log(Date.now());
//const res = await setTimeout(2000, Date.now() );
//console.log(res);
//console.log(Date.now());

//console.log(process.env);
//console.log(process.env.npm_package_name);
//console.log(process.env.npm_package_version);

const f_str = await get_version_info(argv.output_path, script_name);
//console.log(f_str);
await fse.outputFile(argv.output_path, f_str);

console.log(`Bye from ${script_name}`);

