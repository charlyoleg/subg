// subg-api.js

import fse from 'fs-extra';
import YAML22 from 'yaml';


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

  constructor (discoverDir = '.', deepSearch = true, importYaml='') {
    this.discoverDir = discoverDir;
    this.deepSearch = deepSearch;
    this.importYaml = importYaml;
    this.listD = []; // list of the discovered git-repositories
    this.listC = []; // list of the configured git-repositories
  }

  // this init function cannot be included in the constructor because the constructor can not be async
  async discover (discoverDir = this.discoverDir, deepSearch = this.deepSearch) {
    this.discoverDir = discoverDir;
    this.deepSearch = deepSearch;
    this.listD = await searchGitRepo(this.discoverDir, this.deepSearch);
    console.log(`Number of discovered cloned git repos: ${this.listD.length}`);
  }

  async readImportYaml (importYaml = this.importYaml) {
    this.importYaml = importYaml;
    if (this.importYaml !== '') {
      let list_non_git = [];
      try {
        const fstr = await fse.readFile(this.importYaml, 'utf-8');
        const fyaml = YAML22.parse(fstr);
        //console.log(fyaml);
        const regex = /^\./;
        for (const repoDir in fyaml.repositories) {
          //console.log(repoDir);
          // repoDir2 unifies the path format with the discovered git-repos
          let repoDir2 = repoDir;
          if (!regex.test(repoDir2)) {
            repoDir2 = './' + repoDir;
          }
          //console.log(fyaml.repositories[repoDir].type);
          if (fyaml.repositories[repoDir].type === "git") {
            this.listC.push(repoDir2);
          } else {
            list_non_git.push(repoDir2);
          }
        }
      } catch (error) {
        console.error(`ERR826: Error, the imported-yaml-file ${this.importYaml} is not valid!`);
      }
      console.log(`From imported Yaml, number of git-repos: ${this.listC.length}`);
      console.log(`From imported Yaml, number of excluded repos: ${list_non_git.length}`);
      for (const [idx, repoDir] of list_non_git.entries()) {
        console.warn(`  ${idx.toString().padStart(3,' ')} - Excluded repo: ${repoDir}`);
      }
    }
  }

  async init (discoverDir = this.discoverDir, deepSearch = this.deepSearch, importYaml = this.importYaml) {
    await this.discover (discoverDir, deepSearch);
    await this.readImportYaml (importYaml);
  }

  d_list () {
    return this.listD;
  }

  c_list () {
    return this.listC;
  }

  // list the git-repos which are in the D-list and in the C-list
  cd_list () {
    return array_intersection(this.listD, this.listC);
  }

  // list the git-repos which are in the D-list but not in the C-list
  // D not C
  dnc_list () {
    return array_exclude(this.listD, this.listC);
  }

  // list the git-repos which are in the C-list but not in the D-list
  // C not D
  cnd_list () {
    return array_exclude(this.listC, this.listD);
  }

}


export default Subg;

