// subg-api.js

import path from 'path';
import fse from 'fs-extra';
import YAML from 'yaml';
import {simpleGit} from 'simple-git';


const git = simpleGit();

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
  async discover (discoverDir = this.discoverDir, deepSearch = this.deepSearch) {
    this.discoverDir = discoverDir;
    this.deepSearch = deepSearch;
    this.listD = await searchGitRepo(this.discoverDir, this.deepSearch);
    console.log(`Number of discovered cloned git repos: ${this.listD.length}`);
  }

  async readImportYaml (importYaml = this.importYaml, importDir = this.importDir) {
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
      } catch (error) {
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
    await this.discover(discoverDir, deepSearch);
    await this.readImportYaml(importYaml, importDir);
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
      try {
        const gitlog = await git.clone(repo.url, localPath);
        console.log(gitlog);
      } catch(error) {
        console.log(`ERR162: Error by cloning ${localPath}  from  ${repo.url}`);
        console.error(error);
      }
    }
  }

}


export default Subg;

