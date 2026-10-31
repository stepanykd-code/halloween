import assert from 'node:assert/strict';
import {createWickBoss,WICK_ENCOUNTER,WICK_SEQUENCE,wickAttackPattern} from '../wick-boss.mjs';
import {createBossArenaParty} from '../boss-arena-party.mjs';
import {createState,step,requestJump,requestAbility,attemptAbility,selectCharacter} from '../engine.mjs';
import {createSpellProjectiles,abilitySpell} from '../spell-projectiles.mjs';
import {moonEndingPose,rabbitMoonPlacement,POLTAVA_LANDMARKS} from '../parallax.mjs';
import {objectBossVertex} from '../object-boss-animation.mjs';
import {createWickDialogue} from '../wick-dialogue.mjs';
import {createDialogueDirector} from '../dialogue.mjs';
assert.equal(WICK_ENCOUNTER.x,POLTAVA_LANDMARKS[3].worldX+450);
for(let i=0;i<6;i++)for(const rng of [0,.99]){
 const p=wickAttackPattern(i,()=>rng);assert.equal(p.length,2+Math.floor(i/2));assert(p.includes('jump')&&p.includes('duck'));
}
function fixture(random=()=>0){
 const boss=createWickBoss({random}),party=createBossArenaParty(),spells=createSpellProjectiles();boss.lockArena();const view={x:boss.arenaLeft(1600),width:1600};
 const players=Object.fromEntries(['slavik','dasha','katya'].map((id,i)=>[id,Object.assign(createState(id),{x:view.x+[130,365,680][i]})]));
 let controlled='slavik',auto=true,forcedDuck=false;
 function tick(){
  const p=players[controlled],before=Object.fromEntries(Object.entries(players).map(([id,p])=>[id,{x:p.x,y:p.y,mode:p.mode,airborne:p.airborne}]));
  boss.advance(1/60,p,view,{players});boss.autoDodge(players,controlled);const dodge=boss.dodgeFor(p);
  if(auto&&dodge.jump&&!p.airborne&&p.mode!=='ability'&&p.mode!=='fall')requestJump(p,0,{inPlace:true});
  step(p,0,1/60,auto?dodge.crouch:forcedDuck);party.update(players,controlled,view,1/60,{crouchFor:other=>boss.dodgeFor(other).crouch});
  boss.blockPlayers(players,before,view.x);boss.applyHazards(players,before,controlled,view);
  spells.advance(1/60,view,(s,a,b)=>boss.catchSpell(s,a,b,view));spells.observe(players);boss.resolveHits();
 }
 function until(condition,limit=4000){let n=0;while(!condition()&&n++<limit)tick();if(n>=limit)console.log(JSON.stringify({turn:boss.turn,age:boss.turnAge,emitted:boss.emitted,pattern:boss.pattern,waves:boss.waves.map(w=>({x:w.x,kind:w.kind,seen:w.activeSeen})),players:Object.fromEntries(Object.entries(players).map(([id,p])=>[id,{x:p.x,y:p.y,mode:p.mode,hits:p.ghostHitCount}])),events:boss.takeEvents().filter(e=>['failed','opening'].includes(e.type))}));assert(n<limit,'Timeout '+boss.turn+' progress '+boss.progress+' failed '+boss.failed);}
 function choose(id){controlled=id;selectCharacter(players[id],id);}
 function cast(entry,{late=false}={}){
  until(()=>boss.vulnerable&&!players[entry.character].airborne&&players[entry.character].mode!=='fall');
  choose(entry.character);if(late)until(()=>boss.turnAge>=2.72);
  assert(requestAbility(players[controlled],entry.slot));assert(boss.reserveCast(players[controlled]));
 }
 return {boss,view,players,until,tick,choose,cast,setAuto:v=>auto=v,setDuck:v=>forcedDuck=v};
}
for(const rng of [()=>0,()=>.99]){
 const f=fixture(rng),counts=[];
 for(let i=0;i<6;i++){
  f.cast(WICK_SEQUENCE[i],{late:i===0});f.until(()=>f.boss.progress===i+1);counts.push(f.boss.takeEvents().filter(e=>e.type==='attack').length);
  for(const p of Object.values(f.players))assert.equal(p.ghostHitCount,0,'Automatic jump/duck or the player dodge collided');
  assert.deepEqual(objectBossVertex('wick',586,1335,0,f.boss.pose),[650,1399]);
 }
 assert.deepEqual(counts,[2,2,3,3,4,4]);assert.equal(f.boss.phase,'active','Six spells alone must not skip the final dodge series');
 if(rng()===0){f.setAuto(false);f.setDuck(true);f.until(()=>f.boss.turn==='series');f.until(()=>f.boss.turn==='recover');assert.equal(f.boss.progress,6);assert.equal(f.boss.phase,'active');assert(f.boss.failed,'A failed final series must repeat before victory');f.setAuto(true);}
 f.until(()=>f.boss.phase==='defeat');assert.deepEqual(f.boss.pattern,['jump','duck','jump','duck']);assert(f.boss.blocking);
 for(let i=0;i<270;i++){f.tick();assert.equal(f.boss.phase,'defeat');assert(f.boss.cameraLocked,'Camera released before the defeat animation ended');}f.until(()=>f.boss.phase==='inactive');assert(!f.boss.blocking);assert(!f.boss.cameraLocked);assert.equal(f.boss.pose.extinction,1);
}
const wrong=fixture();wrong.cast({character:'slavik',slot:'e'});wrong.until(()=>wrong.boss.wrongHits===1);assert.equal(wrong.boss.progress,0);
wrong.cast(WICK_SEQUENCE[0]);wrong.until(()=>wrong.boss.progress===1);wrong.setAuto(false);wrong.setDuck(true);wrong.until(()=>wrong.boss.turn==='series');wrong.until(()=>wrong.boss.turn==='recover');assert.equal(wrong.boss.progress,1);assert(wrong.boss.failed,'Always crouching must fail on low fire');
const stand=fixture();stand.setAuto(false);stand.until(()=>stand.boss.turn==='series');stand.until(()=>stand.boss.turn==='recover');assert.equal(stand.boss.progress,0);assert(stand.boss.failed);for(const id of ['dasha','katya'])assert.equal(stand.players[id].ghostHitCount,0,'NPCs must still dodge when active player fails');
const refusal=fixture();for(let i=0;i<2;i++){refusal.cast(WICK_SEQUENCE[i]);refusal.until(()=>refusal.boss.progress===i+1);}
refusal.until(()=>refusal.boss.vulnerable);refusal.choose('dasha');assert.equal(attemptAbility(refusal.players.dasha,'e',()=>0),'refused');assert(refusal.boss.vulnerable);assert.equal(refusal.boss.progress,2);assert.equal(attemptAbility(refusal.players.dasha,'e',()=>.9),'started');assert(refusal.boss.reserveCast(refusal.players.dasha));refusal.until(()=>refusal.boss.progress===3);
const near=fixture();near.players.slavik.x=near.boss.bounds.left-90;near.cast(WICK_SEQUENCE[0]);near.until(()=>near.boss.progress===1);assert.equal(near.players.slavik.ghostHitCount,0,'Point-blank warnings must permit a jump before spawning');
// An inactive child can still be finishing a manually started cast after a
// character switch. Do not launch the next series until the whole party is free.
const recovery=fixture();recovery.cast(WICK_SEQUENCE[0]);recovery.until(()=>recovery.boss.progress===1);recovery.until(()=>recovery.boss.turnAge>=2.25);assert.equal(recovery.boss.turn,'recover');
assert(requestAbility(recovery.players.dasha,'r'));recovery.choose('katya');
recovery.until(()=>recovery.players.dasha.mode!=='ability');assert.equal(recovery.boss.turn,'recover','The boss attacked while an inactive child was casting');
for(let i=0;i<45;i++){recovery.tick();assert.equal(recovery.boss.turn,'recover','Missing post-cast reaction time');}
recovery.until(()=>recovery.boss.turn==='series');assert.equal(recovery.boss.progress,1);
const preview=createWickBoss({previewEnding:true}),p=createState();preview.lockArena();for(let i=0;i<300;i++)preview.advance(1/60,p,{x:preview.arenaLeft(1600),width:1600});assert.equal(preview.phase,'inactive');assert.equal(preview.takeEvents().filter(e=>e.type==='defeated').length,1);preview.reset();assert.equal(preview.phase,'defeat');
assert.deepEqual(moonEndingPose(-1),{move:0,drift:0,rabbit:0,bats:1});assert.deepEqual(moonEndingPose(3.2),{move:1,drift:1,rabbit:1,bats:0});
for(const width of [1200,1600])for(const cy of [0,160])for(let x=0;x<=14400;x+=250){const m=rabbitMoonPlacement(x,width,cy);assert(m.x>=x&&m.x+m.width<=x+width);assert(m.y>=cy&&m.y+m.height<=900);}
const d=createDialogueDirector({random:()=>0}),voice=createWickDialogue(d,{random:()=>0});assert(voice.handle({type:'intro'}));assert.equal(d.advance(1).speaker,'wick');assert(voice.handle({type:'defeated'}));assert.equal(d.advance(1).speaker,'slavik');
console.log('Passed: both mixed pattern orders, all six real counterspells, late-cast grace, fair jump/duck transitions and NPCs; six-step checkpoint, wrong spell/fall/refusal; final four dodges, fixed feet, defeat and reset; peaceful moon timing/ear framing; finale dialogue.');
