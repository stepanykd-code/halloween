import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {resolve} from 'node:path';
import {assetFiles,root,modules} from './lib.mjs';
const files=await assetFiles();
const expectedImages={"assets/dasha-crouch-right.png":[384,512],"assets/dasha-fall-right.png":[1536,1024],"assets/dasha-idle-right.png":[1536,1024],"assets/dasha-phone-arm-full-rig.png":[1536,1024],"assets/dasha-phone-rig.png":[1536,1024],"assets/dasha-phone-right.png":[1536,1024],"assets/dasha-walk-right.png":[1536,1024],"assets/enemy-egg-boss.png":[1254,1254],"assets/enemy-ghost-hands.png":[1374,1145],"assets/enemy-halushun-boss.png":[1536,1024],"assets/enemy-pumpkin-boss.png":[1254,1254],"assets/enemy-screamer.png":[1536,1024],"assets/enemy-wick-boss.png":[1145,1374],"assets/katya-crouch-right.png":[384,512],"assets/katya-fall-right.png":[1536,1024],"assets/katya-idle-right.png":[1536,1024],"assets/katya-phone-rig.png":[1536,1024],"assets/katya-phone-right.png":[1536,1024],"assets/katya-walk-right.png":[1536,1024],"assets/poltava-far.png":[1672,941],"assets/poltava-ground.png":[1672,941],"assets/poltava-landmarks.png":[1672,941],"assets/poltava-middle.png":[1672,941],"assets/poltava-moon-rabbit.png":[1141,1379],"assets/poltava-moon.png":[1254,1254],"assets/slavik-crouch-right.png":[384,512],"assets/slavik-fall-right.png":[1536,1024],"assets/slavik-idle-right.png":[1536,1024],"assets/slavik-phone-rig.png":[1536,1024],"assets/slavik-phone-right.png":[1536,1024],"assets/slavik-walk-right.png":[1536,1024],"assets/spell-dasha-hatfu.png":[768,512],"assets/spell-dasha-pofih.png":[768,512],"assets/spell-katya-claws.png":[768,512],"assets/spell-katya-teeth.png":[768,512],"assets/spell-slavik-calm.png":[768,512],"assets/spell-slavik-strength.png":[768,512]};
assert.deepEqual([...files].sort(),Object.keys(expectedImages).sort(),'Some current game images are missing.');
for(const file of files){
  assert.ok(file.startsWith('assets/')&&!file.includes('..'));
  const path=resolve(root,file);assert.ok((await stat(path)).isFile());
  const data=await readFile(path);
  if(file.endsWith('.png')){
    assert.equal(data.subarray(1,4).toString(),'PNG');
    assert.deepEqual([data.readUInt32BE(16),data.readUInt32BE(20)],expectedImages[file],file);
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
console.log('Passed: all 37 local images, animation dimensions/transparency, complete local modules, speech bubble UI and no external runtime dependencies.');
