// subg-api.js

import path from 'node:path';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import fse from 'fs-extra';
import YAML from 'yaml';
import {simpleGit} from 'simple-git';

async function isGitRepo (pathDir2:string):boolean {
  let isRepo = false;
  const subdirs = await fse.readdir(pathDir2, {withFileTypes: true});
  for (const subitem of subdirs) {
    // This is the condition to check if pathDir2 is a git-repo
    // This condition might be considered too weak
    if (subitem.isDirectory() && (subitem.name === '.git')) {
      isRepo = true;
    }
  }
  return isRepo;
}

async function searchGitRepo (pathDir:string, deepSearch = true):string[] {
  let r_list = [];
  //console.log("dbg538: current pathDir: " + pathDir);
  const local_list = await fse.readdir(pathDir, {withFileTypes: true});
  for (const item of local_list) {
    if (item.isDirectory()) {
      const pathDir2 = pathDir + '/' + item.name;
      if ( ['.git', 'node_modules'].includes(item.name)) {
        //console.log("Ignore " + pathDir2);
      } else {
        //console.log("dbg 949: pathDir2: " + pathDir2);
        const isRepo = await isGitRepo(pathDir2);
        if (isRepo) {
          //console.log("Found git-repo: " + pathDir2);
          r_list.push(pathDir2);
        }
        if (deepSearch || !isRepo) {
          r_list = r_list.concat(await searchGitRepo(pathDir2, deepSearch));
        }
      }
    }
  }
  return r_list;
}

function array_intersection (arr1:string[], arr2:string[]):string[] {
  return arr1.filter(elem => arr2.includes(elem));
}

function array_exclude (arr_base:string[], arr_exclude:string[]):string[] {
  return arr_base.filter(elem => ! arr_exclude.includes(elem));
}

async function git_clone (localPath:string, remote_url:string, version:string):number {
  let r_code = -1;
  try {
    if (!fs.existsSync(localPath)) {
      const git = simpleGit();
      const gitlog = await git.clone(remote_url, localPath);
      console.log(gitlog);
      r_code = await git_checkout(localPath, version);
    } else {
      const fstat = await fsp.stat(localPath);
      if (fstat.isDirectory()) {
        if (isGitRepo(localPath)) {
          const git2 = simpleGit(localPath);
          const remote = await git2.getRemotes(true);
          const remote_url = remote[0].refs.fetch;
          //console.log(remote_url);
          if (remote_url === remote_url) {
            console.log(`INFO398: the git-repo ${localPath} is already cloned! Then just git-pull!`);
            const gitlog2 = await git2.pull();
            console.log(gitlog2);
            r_code = await git_checkout(localPath, version);
          } else {
            console.log(`WARN381: Warning, the git-repo ${localPath} already exist but with an unexpected remote! git-clone/pull aborted!`);
          }
        } else {
          console.log(`WARN869: Warning, the directory ${localPath} already exist but is not a git-repo! git-clone aborted!`);
        }
      } else {
        console.log(`WARN537: Warning, the path ${localPath} already exist and is a file! git-clone aborted!`);
      }
    }
  } catch(error) {
    console.log(`ERR162: Error by cloning ${localPath}  from  ${remote_url}`);
    console.error(error);
  }
  return r_code;
}

async function git_checkout (repoPath:string, version:string):number {
  let r_code = -2;
  try {
    const git = simpleGit(repoPath);
    const gitlog = await git.checkout(version);
    console.log(gitlog);
    r_code = 0;
  } catch(error) {
    console.log(`ERR523: Error by checkout ${localPath}  for version  ${version}`);
    console.error(error);
  }
  return r_code;
}

async function git_custom (repoPath:string, gitCommand:string):number {
  let r_code = -1;
  try {
    const git = simpleGit(repoPath);
    const gitlog = await git.raw(...gitCommand);
    console.log(gitlog);
    r_code = 0;
  } catch(error) {
    console.log(`ERR772: Error by git-command ${gitCommand}  on repo  ${repoPath}`);
    console.error(error);
  }
  return r_code;
}

interface RepoInfo {
  localPath: string;
  url: string;
  branch: string;
  commit: string;
}

async function get_repos_info (repos:string[]):RepoInfo[] {
  let repos_info = [];
  const regex = /^\.\//;
  for (const [idx, localPath] of repos.entries()) {
    console.log(`===> ${idx+1} - get info of git-repo  ${localPath}`);
    const localPath2 = localPath.replace(regex, '');
    try {
      const git = simpleGit(localPath);
      const remote = await git.getRemotes(true);
      //console.log(remote);
      const remote_url = remote[0].refs.fetch;
      const branch = await git.branch();
      //console.log(branch);
      const branch_current = branch.current;
      const commit = await git.log();
      //console.log(commit);
      const commit_hash = commit.latest.hash;
      const info = { 'localPath': localPath2, 'url': remote_url, 'branch': branch_current, 'commit': commit_hash};
      //console.log(info);
      repos_info.push(info);
    } catch(error) {
      console.log(`ERR398: Error by git-operations on repo  ${localPath}`);
      console.error(error);
    }
  }
  return repos_info;
}

async function validate_yaml_external (yamlPath:string):number {
  let fyaml = {};
  try {
    const fstr = await fse.readFile(yamlPath, 'utf-8');
    fyaml = YAML.parse(fstr);
  } catch(error) {
    console.log(`ERR439: Error by reading the yaml-file ${yamlPath}!`);
    console.error(error);
    return -1;
  }
  try {
    if (! fyaml.hasOwnProperty('repositories'))
      throw 'The property "repositories" is missing!';
    for (const repo in fyaml.repositories) {
      if (! fyaml.repositories[repo].hasOwnProperty('url'))
        throw `The property "url" is missing for repo ${repo} !`;
      if (! fyaml.repositories[repo].hasOwnProperty('version'))
        throw `The property "version" is missing for repo ${repo} !`;
      if (! fyaml.repositories[repo].hasOwnProperty('type')) {
        console.log(`WARN390: Warning, the property "type" is missing for repo ${repo} !`);
      } else if (fyaml.repositories[repo].type !== 'git') {
        console.log(`WARN395: Warning, the property "type" of repo ${repo} is not git but ${fyaml.repositories[repo].type}!`);
      }
    }
    console.log(`The yaml-file ${yamlPath} is valid!`);
    return 0;
  } catch(error) {
    console.error(error);
    console.log(`Invalid yaml-file ${yamlPath}!`);
    return -2;
  }
}

interface RepoC {
  url: string;
  version: string;
}

class Subg {
  discoverDir: string;
  deepSearch: boolean;
  importYaml: string;
  importDir: string;
  listD: string[];
  listC: RepoC[];

  constructor (discoverDir = '.', deepSearch = true, importYaml='', importDir='') {
    this.discoverDir = discoverDir;
    this.deepSearch = deepSearch;
    this.importYaml = importYaml;
    this.importDir = importDir;
    this.listD = []; // list of the discovered git-repositories
    this.listC = {}; // list of the configured git-repositories
  }

  // this init function cannot be included in the constructor because the constructor can not be async
  async discover_repos (discoverDir = this.discoverDir, deepSearch = this.deepSearch):void {
    this.discoverDir = discoverDir;
    this.deepSearch = deepSearch;
    this.listD = await searchGitRepo(this.discoverDir, this.deepSearch);
    console.log(`Number of discovered cloned git repos: ${this.listD.length}`);
  }

  async import_yaml (importYaml = this.importYaml, importDir = this.importDir):void {
    this.importYaml = importYaml;
    this.importDir = importDir;
    if (this.importYaml !== '') {
      let baseDir = path.dirname(this.importYaml);
      if (this.importDir !== '') {
        baseDir = this.importDir;
      }
      //console.log(baseDir);
      let list_non_git = [];
      try {
        const fstr = await fse.readFile(this.importYaml, 'utf-8');
        const fyaml = YAML.parse(fstr);
        //console.log(fyaml);
        const regex = /^\./;
        for (const repoDir in fyaml.repositories) {
          //console.log(repoDir);
          // repoDir2 unifies the path format with the discovered git-repos
          let repoDir2 = repoDir;
          if (!['', '.'].includes(baseDir)) {
            repoDir2 = baseDir + '/' + repoDir;
          }
          if (!regex.test(repoDir2)) {
            repoDir2 = './' + repoDir2;
          }
          //console.log(fyaml.repositories[repoDir].type);
          if (!fyaml.repositories[repoDir].hasOwnProperty('type')
             || (fyaml.repositories[repoDir].type === "git")) {
            this.listC[repoDir2] = {
              url: fyaml.repositories[repoDir].url,
              version: fyaml.repositories[repoDir].version
            };
          } else {
            list_non_git.push(repoDir2);
          }
        }
      } catch(error) {
        console.log(`ERR826: Error, the imported-yaml-file ${this.importYaml} is not valid!`);
        console.error(error);
      }
      console.log(`From imported Yaml, number of git-repos: ${Object.keys(this.listC).length}`);
      console.log(`From imported Yaml, number of excluded repos: ${list_non_git.length}`);
      for (const [idx, repoDir] of list_non_git.entries()) {
        console.log(`  ${(idx+1).toString().padStart(3,' ')} - Excluded repo: ${repoDir}`);
      }
    }
  }

  async init (discoverDir = this.discoverDir,
              deepSearch = this.deepSearch,
              importYaml = this.importYaml,
              importDir = this.importDir):void {
    await this.discover_repos(discoverDir, deepSearch);
    await this.import_yaml(importYaml, importDir);
  }

  d_list ():string[] {
    return this.listD;
  }

  c_list ():string[] {
    return Object.keys(this.listC);
  }

  // list the git-repos which are in the D-list and in the C-list
  cd_list ():string[] {
    return array_intersection(this.listD, Object.keys(this.listC));
  }

  // list the git-repos which are in the D-list but not in the C-list
  // D not C
  dnc_list ():string[] {
    return array_exclude(this.listD, Object.keys(this.listC));
  }

  // list the git-repos which are in the C-list but not in the D-list
  // C not D
  cnd_list ():string[] {
    return array_exclude(Object.keys(this.listC), this.listD);
  }

  async c_clone ():number {
    let r_code = 0;
    for (const [idx, localPath] of Object.keys(this.listC).entries()) {
      const repo = this.listC[localPath];
      console.log(`===> ${idx+1} - clone  ${localPath}  from  ${repo.url}  at version  ${repo.version}`);
      r_code += await git_clone(localPath, repo.url, repo.verison);
    }
    return r_code;
  }

  async cd_checkout () {
    let r_code = 0;
    const list_cd = this.cd_list();
    for (const [idx, localPath] of list_cd.entries()) {
      const repo = this.listC[localPath];
      console.log(`===> ${idx+1} - checkout  ${localPath}  at version  ${repo.version}`);
      r_code += await git_checkout(localPath, repo.verison);
    }
    return r_code;
  }

  async d_custom (git_command:string, only_configured_repo = false):number {
    let r_code = 0;
    let repos = this.d_list();
    if (only_configured_repo) {
      repos = this.cd_list();
    }
    for (const [idx, localPath] of repos.entries()) {
      console.log(`===> ${idx+1} - On git-repo  ${localPath}  with command  git ${git_command}`);
      r_code += await git_custom(localPath, git_command.split(' '));
    }
    return r_code;
  }

  async d_fetch (only_configured_repo = false):number {
    return await this.d_custom('fetch --prune', only_configured_repo);
  }

  async d_pull (only_configured_repo = false):number {
    return await this.d_custom('pull', only_configured_repo);
  }

  async d_push (only_configured_repo = false):number {
    return await this.d_custom('push', only_configured_repo);
  }

  async d_branch (only_configured_repo = false):number {
    return await this.d_custom('branch --show-current', only_configured_repo);
  }

  async d_status (only_configured_repo = false):number {
    return await this.d_custom('status', only_configured_repo);
  }

  async d_diff (only_configured_repo = false):number {
    return await this.d_custom('diff', only_configured_repo);
  }

  async d_log (only_configured_repo = false):number {
    return await this.d_custom('log -n 3', only_configured_repo);
  }

  async d_remote (only_configured_repo = false):number {
    return await this.d_custom('remote -vv', only_configured_repo);
  }

  async d_stash_list (only_configured_repo = false):number {
    return await this.d_custom('stash list', only_configured_repo);
  }

  async d_clean (only_configured_repo = false):number {
    return await this.d_custom('clean -dxf', only_configured_repo);
  }

  async d_export_yaml (yamlPath:string, exact_commit = false):number {
    let r_code = -1;
    const repos = this.d_list();
    const repos_info = await get_repos_info(repos);
    let fyaml = { 'repositories': {} };
    for (const repo of repos_info) {
      let version = repo.branch;
      if (exact_commit) {
        version = repo.commit;
      }
      fyaml.repositories[repo.localPath] = { 'type':'git', 'url': repo.url, 'version': version };
    }
    //console.log(fyaml);
    const fstr = YAML.stringify(fyaml);
    try {
      await fse.outputFile(yamlPath, fstr);
      r_code = 0;
    } catch(error) {
      console.log(`ERR218: Error by writting the yaml-file ${yamlPath}!`);
      console.error(error);
    }
    console.log(`The yaml-file ${yamlPath} has been written!`);
    return r_code;
  }

  async validate_yaml (yamlPath:string):number {
    return await validate_yaml_external(yamlPath);
  }

  static version ():string {
    const VERSION_MAJOR = 0;
    const VERSION_MINOR = 0;
    const VERSION_HOTFIX = 0;
    const build_number = 0;
    const repoName = 'abc';
    const gitHash = '123';
    const date = '567';
    let ver = '';
    ver += VERSION_MAJOR.toString();
    ver += '.' + VERSION_MINOR.toString();
    ver += '.' + VERSION_HOTFIX.toString();
    ver += '.' + build_number.toString();
    ver += '_' + repoName;
    ver += '_' + gitHash;
    ver += '_' + date;
    return ver;
  }

}


export { Subg };

