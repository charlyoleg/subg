// subg-api.js

import path from 'node:path';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import fse from 'fs-extra';
import YAML from 'yaml';
import {simpleGit} from 'simple-git';

async function isGitRepo (pathDir2) {
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

async function searchGitRepo (pathDir, deepSearch = true) {
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

function array_intersection (arr1, arr2) {
  return arr1.filter(elem => arr2.includes(elem));
}

function array_exclude (arr_base, arr_exclude) {
  return arr_base.filter(elem => ! arr_exclude.includes(elem));
}

async function git_clone (localPath, remote_url, version) {
  try {
    if (!fs.existsSync(localPath)) {
      const git = simpleGit();
      const gitlog = await git.clone(remote_url, localPath);
      console.log(gitlog);
      await git_checkout(localPath, version);
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
            await git_checkout(localPath, version);
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
}

async function git_checkout (repoPath, version) {
  try {
    const git = simpleGit(repoPath);
    const gitlog = await git.checkout(version);
    console.log(gitlog);
  } catch(error) {
    console.log(`ERR523: Error by checkout ${localPath}  for version  ${version}`);
    console.error(error);
  }
}

async function git_custom (repoPath, gitCommand) {
  try {
    const git = simpleGit(repoPath);
    const gitlog = await git.raw(...gitCommand);
    console.log(gitlog);
  } catch(error) {
    console.log(`ERR772: Error by git-command ${gitCommand}  on repo  ${repoPath}`);
    console.error(error);
  }
}

class Subg {

  constructor (discoverDir = '.', deepSearch = true, importYaml='', importDir='') {
    this.discoverDir = discoverDir;
    this.deepSearch = deepSearch;
    this.importYaml = importYaml;
    this.importDir = importDir;
    this.listD = []; // list of the discovered git-repositories
    this.listC = {}; // list of the configured git-repositories
  }

  // this init function cannot be included in the constructor because the constructor can not be async
  async discover_repos (discoverDir = this.discoverDir, deepSearch = this.deepSearch) {
    this.discoverDir = discoverDir;
    this.deepSearch = deepSearch;
    this.listD = await searchGitRepo(this.discoverDir, this.deepSearch);
    console.log(`Number of discovered cloned git repos: ${this.listD.length}`);
  }

  async import_yaml (importYaml = this.importYaml, importDir = this.importDir) {
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
        console.error(`ERR826: Error, the imported-yaml-file ${this.importYaml} is not valid!`);
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
              importDir = this.importDir) {
    await this.discover_repos(discoverDir, deepSearch);
    await this.import_yaml(importYaml, importDir);
  }

  d_list () {
    return this.listD;
  }

  c_list () {
    return Object.keys(this.listC);
  }

  // list the git-repos which are in the D-list and in the C-list
  cd_list () {
    return array_intersection(this.listD, Object.keys(this.listC));
  }

  // list the git-repos which are in the D-list but not in the C-list
  // D not C
  dnc_list () {
    return array_exclude(this.listD, Object.keys(this.listC));
  }

  // list the git-repos which are in the C-list but not in the D-list
  // C not D
  cnd_list () {
    return array_exclude(Object.keys(this.listC), this.listD);
  }

  async c_clone () {
    for (const [idx, localPath] of Object.keys(this.listC).entries()) {
      const repo = this.listC[localPath];
      console.log(`===> ${idx+1} - clone  ${localPath}  from  ${repo.url}  at version  ${repo.version}`);
      await git_clone(localPath, repo.url, repo.verison);
    }
  }

  async cd_checkout () {
    const list_cd = this.cd_list();
    for (const [idx, localPath] of list_cd.entries()) {
      const repo = this.listC[localPath];
      console.log(`===> ${idx+1} - checkout  ${localPath}  at version  ${repo.version}`);
      await git_checkout(localPath, repo.verison);
    }
  }

  async d_custom (git_command, only_configured_repo = false) {
    let repos = this.d_list();
    if (only_configured_repo) {
      repos = this.cd_list();
    }
    for (const [idx, localPath] of repos.entries()) {
      console.log(`===> ${idx+1} - On git-repo  ${localPath}  with command  git ${git_command.join(' ')}`);
      await git_custom(localPath, git_command);
    }
  }

  async d_fetch (only_configured_repo = false) {
    await this.d_custom(['fetch', '--prune'], only_configured_repo);
  }

  async d_pull (only_configured_repo = false) {
    await this.d_custom(['pull'], only_configured_repo);
  }

  async d_push (only_configured_repo = false) {
    await this.d_custom(['push'], only_configured_repo);
  }

  async d_branch (only_configured_repo = false) {
    await this.d_custom(['branch', '--show-current'], only_configured_repo);
  }

  async d_status (only_configured_repo = false) {
    await this.d_custom(['status'], only_configured_repo);
  }

  async d_diff (only_configured_repo = false) {
    await this.d_custom(['diff'], only_configured_repo);
  }

  async d_log (only_configured_repo = false) {
    await this.d_custom(['log', '-n', '3'], only_configured_repo);
  }

  async d_remote (only_configured_repo = false) {
    await this.d_custom(['remote', '-vv'], only_configured_repo);
  }

  async d_stash_list (only_configured_repo = false) {
    await this.d_custom(['stash', 'list'], only_configured_repo);
  }

  async d_clean (only_configured_repo = false) {
    await this.d_custom(['clean', '-dxf'], only_configured_repo);
  }

  async d_export_yaml (yamlPath) {
    let fyaml = { };
    // TODO
    console.log(`The yaml-file ${yamlPath} has been written!`);
  }

  async validate_yaml (yamlPath) {
    // TODO
    console.log(`The yaml-file ${yamlPath} is valid!`);
  }

}


export { Subg };

