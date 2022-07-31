// generate_verison_info.js

import { setTimeout } from 'node:timers/promises';


console.log("Hello from generate_verison_info.js");

console.log(Date.now());
const res = await setTimeout(2000, Date.now() );
console.log(res);
console.log(Date.now());

console.log("Bye from generate_verison_info.js");
