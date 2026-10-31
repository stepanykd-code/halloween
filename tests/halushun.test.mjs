import assert from 'node:assert/strict';
import {createHalushunBoss,HALUSHUN_ENCOUNTER,HALUSHUN_MENU,halushunHeroHeight} from '../halushun-boss.mjs';
import {createBossArenaParty} from '../boss-arena-party.mjs';
import {createState,requestAbility,requestJump,attemptAbility,selectCharacter,step,WORLD} from '../engine.mjs';
import {createSpellProjectiles,abilitySpell} from '../spell-projectiles.mjs';
import {POLTAVA_LANDMARKS} from '../parallax.mjs';
import {createDialogueDirector} from '../dialogue.mjs';
import {createHalushunDialogue} from '../halushun-dialogue.mjs';
assert.equal(HALUSHUN_ENCOUNTER.x,POLTAVA_LANDMARKS[2].worldX+450);
for(const character of ['slavik','dasha','katya']){
 const p=createState(character);assert(halushunHeroHeight(p)>HALUSHUN_ENCOUNTER.steamBottom);
 p.mode='crouch';assert(halushunHeroHeight(p)+10<HALUSHUN_ENCOUNTER.steamBottom,'All crouched heads need a visible clearance');
}
function fixture(){
 const boss=createHalushunBoss({random:()=>.5}),spells=createSpellProjectiles(),party=createBossArenaParty();boss.lockArena();
 const view={x:boss.arenaLeft(1600),width:1600};view.slots=[115,315,515,715].map(x=>view.x+x);
 const players=Object.fromEntries(['slavik','dasha','katya'].map((id,i)=>[id,Object.assign(createState(id),{x:view.x+[130,365,680][i]})]));
 let controlled='slavik',duck=true,jump=false;
 function tick(){
  const before=Object.fromEntries(Object.entries(players).map(([id,p])=>[id,{x:p.x,y:p.y,mode:p.mode,airborne:p.airborne}]));
  const active=players[controlled];boss.advance(1/60,active,view);
  if(jump&&boss.waves.some(w=>w.x-active.x>0&&w.x-active.x<280))requestJump(active,0,{inPlace:true});
  step(active,0,1/60,duck&&boss.requiresCrouch);
  party.update(players,controlled,view,1/60,{crouchFor:()=>boss.requiresCrouch});
  boss.blockPlayers(players,before,view.x);boss.applyHazards(players,before,controlled,view);
  spells.advance(1/60,view,(s,a,b)=>boss.catchSpell(s,a,b,view));spells.observe(players);boss.resolveHits();
 }
 function until(condition,limit=2400){let n=0;while(!condition()&&n++<limit)tick();assert(n<limit,'Timeout: '+boss.turn);}
 function choose(id){controlled=id;selectCharacter(players[id],id);}
 function cast(entry){choose(entry.character);until(()=>boss.turn==='hungry'&&players[controlled].mode!=='ability'&&players[controlled].mode!=='fall');assert(requestAbility(players[controlled],entry.slot));}
 return {boss,spells,players,view,tick,until,choose,cast,setDuck:v=>duck=v,setJump:v=>jump=v};
}
// Play real casts and the real party AI through different complete menu orders.
for(const order of [HALUSHUN_MENU,[...HALUSHUN_MENU].reverse(),[2,4,0,5,1,3].map(i=>HALUSHUN_MENU[i])]){
 const f=fixture(),bursts=[];
 for(const [i,entry] of order.entries()){
  f.cast(entry);f.until(()=>f.boss.progress===i+1);
  bursts.push(f.boss.takeEvents().filter(e=>e.type==='burst').length);
  for(const p of Object.values(f.players)){assert.equal(p.ghostHitCount,0,'Crouched heroes/companions were hit');assert(p.x<f.boss.bounds.left-34,'AI walked into the wide boss');}
 }
 assert.deepEqual(bursts,[1,1,2,2,3,3]);assert.equal(new Set(f.boss.completedSpells).size,6);assert.equal(f.boss.phase,'defeat');
 assert(f.boss.blocking);for(let i=0;i<270;i++){f.tick();assert.equal(f.boss.phase,'defeat');assert(f.boss.cameraLocked,'Camera released before the defeat animation ended');}f.until(()=>f.boss.phase==='inactive');assert(!f.boss.blocking);assert(!f.boss.cameraLocked);assert.equal(f.boss.pose.extinction,1);
}
const f=fixture();f.cast(HALUSHUN_MENU[0]);f.until(()=>f.boss.progress===1);f.until(()=>f.boss.turn==='hungry');
// Repeated tastes never earn a second round, even when offered six more times.
for(let i=0;i<6;i++){
 const shot={id:900+i,character:'slavik',spell:abilitySpell('slavik','e'),width:300,direction:1,age:3};
 assert(f.boss.catchSpell(shot,{x:f.boss.bounds.left-150,y:550},{x:f.boss.bounds.left,y:550},f.view));f.boss.resolveHits();
 assert.equal(f.boss.progress,1);assert.equal(f.boss.turn,'hungry');
}
assert.equal(attemptAbility(f.players.dasha,'e',()=>0),'refused');assert.equal(f.boss.progress,1);
// Standing fails while the inactive companions crouch safely. Retain old tastes.
f.setDuck(false);f.cast(HALUSHUN_MENU[1]);f.until(()=>f.boss.turn==='steam');f.until(()=>f.boss.turn==='recover');
assert(f.boss.failed);assert.equal(f.boss.progress,1);assert(!f.boss.completedSpells.includes(HALUSHUN_MENU[1].spell.id));
assert(f.players.slavik.ghostHitCount>0);for(const id of ['dasha','katya'])assert.equal(f.players[id].ghostHitCount,0);
f.setDuck(true);f.cast(HALUSHUN_MENU[1]);f.until(()=>f.boss.progress===2);
assert.deepEqual(new Set(f.boss.completedSpells),new Set(HALUSHUN_MENU.slice(0,2).map(e=>e.spell.id)));
// Jumping and contact immunity cannot substitute for ducking.
const j=fixture();j.setDuck(false);j.setJump(true);j.cast(HALUSHUN_MENU[0]);j.until(()=>j.boss.turn==='steam');j.until(()=>j.boss.turn==='recover');assert(j.boss.failed);assert.equal(j.boss.progress,0);
const immune=fixture();immune.setDuck(false);immune.players.slavik.hitCooldown=1e8;immune.cast(HALUSHUN_MENU[0]);immune.until(()=>immune.boss.turn==='steam');immune.until(()=>immune.boss.turn==='recover');assert.equal(immune.boss.progress,0);assert(immune.boss.failed);
// Even a point-blank cast has time to finish and duck before the first wave.
const close=fixture();close.players.slavik.x=close.boss.bounds.left-90;close.cast(HALUSHUN_MENU[0]);close.until(()=>close.boss.progress===1);assert.equal(close.players.slavik.ghostHitCount,0);
const d=createDialogueDirector({random:()=>0}),voice=createHalushunDialogue(d,{random:()=>0});assert(voice.handle({type:'intro'}));assert.match(d.advance(1).text,/шість/);
assert(voice.hint(HALUSHUN_MENU[5],true));assert.match(d.advance(1).text,/Зуби/);
console.log('Passed: third landmark; all six unique tastes in three orders; repeats/refusal/progress retention; all heroes crouch with clearance; standing/jumping/immunity fail; NPC AI ducks and avoids boss; 1/1/2/2/3/3 bursts; point-blank casting grace; defeat, passage and contextual menu dialogue.');
