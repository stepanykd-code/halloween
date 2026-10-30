import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {root,assetFiles,modules} from './lib.mjs';
const read=filename=>readFile(resolve(root,filename),'utf8');
let html=await read('index.html');
const css=await read('style.css');
let bundle=(await Promise.all(modules.map(async file=>(await read(file)).split('\n').filter(line=>!line.startsWith('import ')).join('\n').replace(/\bexport /g,'')))).join('\n');
for(const file of await assetFiles()){
  const mime=file.endsWith('.png')?'image/png':'image/webp';
  bundle=bundle.replace('./'+file,'data:'+mime+';base64,'+(await readFile(resolve(root,file))).toString('base64'));
}
assert.ok(!bundle.includes('./assets/')&&!bundle.includes("from './"));
html=html.replace('<link rel="stylesheet" href="style.css">','<style>\n'+css+'\n</style>');
html=html.replace('<script type="module" src="game.mjs"></script>','<script type="module">\n'+bundle+'\n</script>');
html=html.replace('href="./"','href="#"');
const output=resolve(root,'_offline');await mkdir(output,{recursive:true});
await writeFile(resolve(output,'slavik-halloween-game.html'),html,'utf8');
console.log('Offline game prepared in _offline/slavik-halloween-game.html.');
