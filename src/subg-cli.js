// subg-cli.js


import { searchGitRepo } from './subg-api.js';


const list = await searchGitRepo('.');
//const list = await searchGitRepo('.', false);

console.log(list);

