// subg-api.js

import fse from 'fs-extra';
import YAML from 'yaml';


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
  }

  async readImportYaml (importYaml = this.importYaml) {
    this.importYaml = importYaml;
    if (this.importYaml !== '') {
      try {
        const fstr = await fse.readFile(this.importYaml, 'utf-8');
        const fyaml = YAML.parse(fstr);
      } catch (error) {
        console.error(`ERR826: Error, the imported-yaml-file ${this.importYaml} is not valid!`);
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
    let listCD = [];
    return listCD;
  }

  // list the git-repos which are in the D-list but not in the C-list
  // D not C
  dnc_list () {
    let listCD = [];
    return listCD;
  }

  // list the git-repos which are in the C-list but not in the D-list
  // C not D
  cnd_list () {
    let listCD = [];
    return listCD;
  }

}


export { Subg };

