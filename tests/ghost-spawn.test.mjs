import assert from 'node:assert/strict';
import {WORLD} from '../engine.mjs';
import {POLTAVA_LANDMARKS} from '../parallax.mjs';
import {createGhostHandsEnemies,ghostHandsBlockedZones,ghostHandsLocalPose,GHOST_HANDS_SPAWN} from '../ghost-hands.mjs';
function randomSeed(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
const layouts=new Set();
for(let seed=1;seed<=1000;seed++){
 const enemies=createGhostHandsEnemies(randomSeed(seed));assert(enemies.length>0);
 layouts.add(enemies.map(e=>e.x.toFixed(2)+':'+e.flipX).join(','));
 assert(enemies.some(e=>e.flipX)&&enemies.some(e=>!e.flipX));
 const counts={};
 for(let i=0;i<enemies.length;i++){
  const e=enemies[i];assert(e.x-120>=1600&&e.x+120<=12800);
  assert(e.screen>=2&&e.screen<=8&&e.screen===Math.floor(e.x/WORLD.screenWidth)+1);
  counts[e.screen]=(counts[e.screen]??0)+1;assert(e.requestedOnScreen>=2&&e.requestedOnScreen<=3);
  for(const zone of ghostHandsBlockedZones())assert(e.x<=zone.start+1e-7||e.x>=zone.end-1e-7,'Hands in protected plaza');
  if(i)assert(e.x-enemies[i-1].x>=GHOST_HANDS_SPAWN.minSpacing-1e-7,'Jump spacing too short');
  // Check protected visual clearance at encounter centers on desktop and phone.
  for(const view of [1200,1600])for(const place of POLTAVA_LANDMARKS){
   const camera=e.x-view/2,landmarkX=place.worldX*.5+400-camera*.5,handX=view/2;
   assert(Math.abs(landmarkX-handX)>=place.width/2+120+GHOST_HANDS_SPAWN.landmarkGap-1e-7);
  }
  for(const lean of [-4,4]){const local=ghostHandsLocalPose({...e,pose:{lean,lift:.5}});assert.equal(local.lean*(e.flipX?-1:1),lean,'Mirrored hands reach away from hero');}
 }
 for(const count of Object.values(counts))assert(count<=3);
}
assert.equal(layouts.size,1000);
for(const value of [0,1])assert(createGhostHandsEnemies(()=>value).length>0,'Extreme random input failed');
console.log('Passed: 1000 distinct layouts; targets2–3 per screen with protected-zone exceptions; no hands on1/9/10; landmark/parallax buffers, jump gaps, mixed horizontal mirrors and correct reach direction.');
