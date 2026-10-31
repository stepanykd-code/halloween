import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {resolve} from 'node:path';
import {assetFiles,root,modules} from './lib.mjs';
const files=await assetFiles();
assert.equal(files.length,33,'Some of the current game images are missing.');
for(const file of files){
  assert.ok(file.startsWith('assets/')&&!file.includes('..'));
  const path=resolve(root,file);assert.ok((await stat(path)).isFile());
  const data=await readFile(path);
  if(file.endsWith('.png')){
    assert.equal(data.subarray(1,4).toString(),'PNG');
    assert.deepEqual([data.readUInt32BE(16),data.readUInt32BE(20)],file.endsWith('enemy-ghost-hands.png')?[1374,1145]:file.endsWith('enemy-pumpkin-boss.png')||file.endsWith('poltava-moon.png')?[1254,1254]:file.includes('/spell-')?[768,512]:file.includes('poltava-')?[1672,941]:file.includes('-crouch-')?[384,512]:[1536,1024],file);
    if(!file.endsWith('poltava-far.png'))assert.equal(data[25],6,'Sprites and cutouts must retain RGBA transparency.');
  }else{assert.equal(data.subarray(0,4).toString(),'RIFF');assert.equal(data.subarray(8,12).toString(),'WEBP');}
}
const html=await readFile(resolve(root,'index.html'),'utf8');
assert.ok(html.includes('src="game.mjs"')&&html.includes('href="style.css"'));
assert.ok(!/<(?:script|link)[^>]+(?:src|href)="https?:/i.test(html),'External runtime dependency found.');
for(const file of modules){
  const code=await readFile(resolve(root,file),'utf8');
  for(const match of code.matchAll(/from ['"]\.\/([^'"]+)['"]/g))assert.ok((await stat(resolve(root,match[1]))).isFile(),match[1]);
}
assert.ok(html.includes('id="speech-bubble"')&&html.includes('id="talk"'));
console.log('Passed: all 33 local images, animation dimensions/transparency, complete local modules, speech bubble UI and no external runtime dependencies.');
