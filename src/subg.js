// subg.js

import fse from 'fs-extra';

let list = [];

async function searchGitRepo (pathDir) {
  console.log("gg: " + pathDir);
  const local_list = await fse.readdir(pathDir, {withFileTypes: true});
  for (const item of local_list) {
    if (item.isDirectory()) {
      if ( ['.git', 'node_modules'].includes(item.name)) {
	console.log("Waha");
      } else {
	console.log(item.name);
	list.push(item.name);
	await searchGitRepo(pathDir + '/' + item.name);
      }
    }
  }
}

await searchGitRepo('.');

console.log(list);

