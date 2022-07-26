// subg-cli.js


import Subg from './subg-api.js';

//const repos = new Subg();
//const repos = new Subg('.');
//const repos = new Subg('.', false);
//const repos = new Subg('.', true, 'tmp/repos.yml', '');
const repos = new Subg('.', true, 'tmp/repos.yml', '.');

//await repos.discover();
//await repos.discover('..');
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

await repos.c_clone();
