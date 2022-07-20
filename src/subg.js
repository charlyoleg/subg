// subg.js

import fse from 'fs-extra';


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
	let isRepo = false;
  	const subdirs = await fse.readdir(pathDir2, {withFileTypes: true});
  	for (const subitem of subdirs) {
    	  if (subitem.isDirectory() && (subitem.name === '.git')) {
   	    isRepo = true;
	  }
	}
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

const list = await searchGitRepo('.');
//const list = await searchGitRepo('.', false);

console.log(list);

