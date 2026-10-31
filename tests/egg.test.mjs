import assert from 'node:assert/strict';
import {createEggBoss,EGG_ENCOUNTER} from '../egg-boss.mjs';
import {createState,step,requestJump,requestAbility,attemptAbility,WORLD} from '../engine.mjs';
import {createSpellProjectiles,abilitySpell} from '../spell-projectiles.mjs';
import {createEggDialogue} from '../egg-dialogue.mjs';
import {createDialogueDirector} from '../dialogue.mjs';
import {POLTAVA_LANDMARKS} from '../parallax.mjs';

assert.equal(EGG_ENCOUNTER.x,POLTAVA_LANDMARKS[1].worldX+350);
function fixture(controlled='slavik',random=()=>.9){
  const boss=createEggBoss({random});boss.lockArena();
  const view={x:boss.arenaLeft(1600),width:1600};
  const order=[controlled,...['slavik','dasha','katya'].filter(id=>id!==controlled)];
  const players=Object.fromEntries(order.map((id,i)=>[id,Object.assign(createState(id),{x:view.x+[130,365,680][i]})]));
  const spells=createSpellProjectiles();let lastWave=null;
  function tick(dodge=true){
    const before=Object.fromEntries(Object.entries(players).map(([id,p])=>[id,{x:p.x,y:p.y,mode:p.mode,airborne:p.airborne}]));
    boss.advance(1/60,players[controlled],view);boss.autoJump(players,controlled);
    if(dodge&&boss.waves.some(w=>w.x>players[controlled].x&&w.x-players[controlled].x<250))requestJump(players[controlled],0,{inPlace:true});
    for(const p of Object.values(players))step(p,0,1/60);
    boss.blockPlayers(players,before,view.x);boss.applyHazards(players,before);
    spells.advance(1/60,view,(shot,from,to)=>boss.catchSpell(shot,from,to,view));spells.observe(players);boss.resolveHits();
    return boss;
  }
  function until(condition,limit=3000,dodge=true){let i=0;while(!condition()&&i++<limit)tick(dodge);assert(i<limit,'Encounter did not reach requested phase: '+boss.turn);}
  return {boss,view,players,spells,tick,until};
}

// Real engine casts from the far-left slot must work for every hero/slot.
for(const hero of ['slavik','dasha','katya'])for(const slot of ['e','r']){
  const f=fixture(hero),p=f.players[hero];
  for(let hit=1;hit<=3;hit++){
    f.until(()=>f.boss.vulnerable&&!p.airborne);
    assert(requestAbility(p,slot));assert(f.boss.reserveCast(p));
    f.until(()=>f.boss.progress===hit);
    assert.equal(f.boss.wrongHits,0);
    for(const other of Object.values(f.players))assert.equal(other.ghostHitCount,0,'Companions and timed active jumps clear the wave');
  }
  assert.equal(f.boss.phase,'defeat');for(let i=0;i<270;i++){f.tick();assert.equal(f.boss.phase,'defeat');assert(f.boss.cameraLocked,'Camera released before the defeat animation ended');}f.until(()=>f.boss.phase==='inactive');assert(!f.boss.cameraLocked);assert(!f.boss.blocking);assert.equal(f.boss.pose.extinction,1);
}

const miss=fixture();miss.until(()=>miss.boss.vulnerable);miss.until(()=>!miss.boss.vulnerable);assert.equal(miss.boss.progress,0);
const b=miss.boss,p=miss.players.slavik;
assert(requestAbility(p,'e'));assert(!b.reserveCast(p));miss.until(()=>b.wrongHits===1);
assert(b.returns.length);miss.until(()=>p.mode==='fall',600,false);assert(p.eggHitPending);
assert.equal(b.progress,0);
miss.until(()=>b.vulnerable&&!p.airborne&&p.mode!=='fall'&&p.mode!=='ability');
assert.equal(attemptAbility(miss.players.dasha,'e',()=>0),'refused');assert.equal(b.progress,0);
assert(requestAbility(p,'r'));assert(b.reserveCast(p));miss.until(()=>b.progress===1);
miss.until(()=>p.mode!=='ability');assert(requestAbility(p,'e'));miss.until(()=>b.wrongHits===2);assert.equal(b.progress,1,'Mistakes never erase prior counterattacks');

const fall=fixture();fall.until(()=>fall.players.slavik.mode==='fall',3000,false);
assert(fall.players.slavik.eggHitPending,'A grounded active hero is knocked down by the wave');
for(const hero of ['dasha','katya'])assert.equal(fall.players[hero].ghostHitCount,0,'Only inactive heroes auto-jump');

// Fake fear never opens the shield; two bluffs guarantee a subsequent real attack.
const bluff=fixture();bluff.until(()=>bluff.boss.vulnerable);bluff.until(()=>bluff.boss.turn==='bluff');
assert(!bluff.boss.vulnerable);assert(bluff.boss.ribbon>0);assert(!bluff.boss.waves.length);
bluff.until(()=>bluff.boss.turn==='windup');assert(bluff.boss.ribbon>.25);

for(const hero of ['slavik','dasha','katya']){
  const wall=createEggBoss(),child=Object.assign(createState(hero),{x:wall.bounds.right+80,y:-170,airborne:true});
  wall.blockPlayers({[hero]:child},{[hero]:{x:wall.bounds.left-80,y:-170}});assert(child.x<wall.bounds.left);assert.equal(child.mode,'fall');
}
const director=createDialogueDirector({random:()=>0}),voices=createEggDialogue(director,{random:()=>0});
assert(voices.handle({type:'intro'}));assert.equal(director.advance(1).speaker,'egg');
assert(voices.handle({type:'reflected',character:'dasha'}));assert.equal(director.advance(1).trigger,'egg-reflected');
assert(voices.strategy());assert(director.advance(1).text.length);
console.log('Passed: second landmark; all six real spells from far-left slot win with cast/travel grace; three counterattacks; reflection and wave knockdowns; all NPC auto-jumps; baits, missed windows, refusal and retained progress; wall, inactive passage, voice-ready dialogue.');
