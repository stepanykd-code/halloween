import {mkdir,copyFile,rm} from 'node:fs/promises';
import {resolve,dirname,basename} from 'node:path';
import {root,siteFiles} from './lib.mjs';
const output=resolve(root,'_site');
if(dirname(output)!==resolve(root)||basename(output)!=='_site')throw new Error('Unexpected build destination.');
await rm(output,{recursive:true,force:true});
await mkdir(output,{recursive:true});
for(const file of await siteFiles()){
  const target=resolve(output,file);await mkdir(dirname(target),{recursive:true});await copyFile(resolve(root,file),target);
}
console.log('Static game prepared in _site/.');
