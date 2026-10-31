import assert from 'node:assert/strict';
import {createPumpkinBoss,createPumpkinSequence,pumpkinSpellIntersection,PUMPKIN_ENCOUNTER} from '../pumpkin-boss.mjs';
import {createState,attemptAbility,step,WORLD} from '../engine.mjs';
import {abilitySpell,createSpellProjectiles} from '../spell-projectiles.mjs';
import {pumpkinBossVertex} from '../pumpkin-boss-rig.mjs';
import {createDialogueDirector} from '../dialogue.mjs';
import {createPumpkinDialogue} from '../pumpkin-dialogue.mjs';
import {DIALOGUE_DATA} from '../dialogue-data.mjs';
const view={x:PUMPKIN_ENCOUNTER.x+PUMPKIN_ENCOUNTER.right+45-1600,width:1600},leader=createState();leader.x=PUMPKIN_ENCOUNTER.x-450;
let serial=0;
function impact(boss,entry){
  const shot={id:++serial,character:entry.character,spell:abilitySpell(entry.character,entry.slot),width:300,direction:1};
  assert(boss.catchSpell(shot,{x:boss.bounds.left-160,y:550},{x:boss.bounds.left+10,y:550},view));boss.resolveHits();
}
function advance(boss,seconds){for(let i=0;i<Math.ceil(seconds*60);i++)boss.advance(1/60,leader,view);}

// Every permutation and E/R choice is reachable, and every such recipe wins.
const recipes=new Set();
for(let a=0;a<3;a++)for(let b=0;b<2;b++)for(let bits=0;bits<8;bits++){
  const draws=[(a+.5)/3,(b+.5)/2,...[0,1,2].map(n=>(bits>>n&1)?.75:.25)];
  const recipe=createPumpkinSequence(()=>draws.shift());recipes.add(JSON.stringify(recipe));assert.equal(new Set(recipe.map(s=>s.character)).size,3);
  const fixed=[(a+.5)/3,(b+.5)/2,...[0,1,2].map(n=>(bits>>n&1)?.75:.25)];
  const boss=createPumpkinBoss({random:()=>fixed.length?fixed.shift():.5});boss.lockArena();
  const anchors=[[110,700],[1200,700],[660,1190]];
  for(let i=0;i<3;i++){
    assert.deepEqual(boss.next,recipe[i]);impact(boss,recipe[i]);assert.equal(boss.progress,i+1);
    const pose=boss.pose;
    for(const [x,y] of anchors)assert.deepEqual(pumpkinBossVertex(x,y,0,pose),[x+64,y+64],'Boss anchor and outline must not shift on reaction changes');
  }
  assert.equal(boss.phase,'defeat');assert(boss.blocking);advance(boss,2.8);assert.equal(boss.phase,'defeat');assert(boss.cameraLocked);advance(boss,PUMPKIN_ENCOUNTER.inactiveAt-2.8+.05);assert.equal(boss.phase,'inactive');assert(!boss.blocking);assert(!boss.cameraLocked);
  assert.equal(boss.pose.extinction,1);advance(boss,8);assert.equal(boss.phase,'inactive');assert.equal(boss.pose.extinction,1);
}
assert.equal(recipes.size,48);

const boss=createPumpkinBoss({random:()=>.75});const first=boss.next;impact(boss,first);assert.equal(boss.progress,1);
impact(boss,first);assert.equal(boss.progress,0);assert.equal(boss.animation,'anger');assert.deepEqual(boss.next,first);
impact(boss,first);assert.equal(boss.animation,'fear');assert.equal(boss.progress,1);
const miss={id:++serial,character:'slavik',spell:abilitySpell('slavik','e'),width:300,direction:1};
assert(!boss.catchSpell(miss,{x:2000,y:20},{x:3400,y:20},view));assert.equal(boss.progress,1);
assert(!boss.catchSpell(miss,{x:2000,y:550},{x:1500,y:550},view));assert.equal(boss.progress,1);
assert.equal(attemptAbility(createState('dasha'),'e',()=>0),'refused');assert.equal(boss.progress,1);
advance(boss,30);assert.equal(boss.progress,1,'Waiting or refusing does not reset the sequence');

for(const id of ['slavik','dasha','katya'])for(const airborne of [false,true])for(const immune of [false,true]){
  const wall=createPumpkinBoss(),p=createState(id),before={x:wall.bounds.left-80,y:airborne?-170:0};
  Object.assign(p,{x:wall.bounds.right+80,y:before.y,airborne,mode:airborne?'jump':'walk',hitCooldown:immune?1000:0});
  wall.blockPlayers({[id]:p},{[id]:before});assert(p.x<wall.bounds.left,'Neither jumping, tunnelling nor hit immunity bypasses the boss');
  if(!immune)assert.equal(p.mode,'fall');
}
boss.lockArena();assert.equal(boss.cameraLeft(1600)+1600-boss.bounds.right,45);
const x=boss.cameraLeft(1600);const back=createState();back.x=x-100;boss.blockPlayers({slavik:back},{slavik:{x:x-90,y:0}},x);assert.equal(back.x,x+80);
while(boss.phase==='active')impact(boss,boss.next);advance(boss,PUMPKIN_ENCOUNTER.inactiveAt+.05);
const free=createState();free.x=boss.actor.x;boss.blockPlayers({slavik:free},{slavik:{x:boss.bounds.left-80,y:0}});assert.equal(free.x,boss.actor.x);
assert(!boss.catchSpell(miss,{x:2000,y:550},{x:3400,y:550},view));

// A rendered projectile is consumed by the swept boss collision exactly once.
const combat=createPumpkinBoss(),projectiles=createSpellProjectiles(),entry=combat.next,p=createState(entry.character);
p.x=combat.bounds.left-420;assert.equal(attemptAbility(p,entry.slot,()=>.9),'started');
for(let i=0;i<240;i++){
  step(p,0,1/60);projectiles.advance(1/60,view,(shot,from,to)=>combat.catchSpell(shot,from,to,view));projectiles.observe({p});combat.resolveHits();
}
assert.equal(combat.progress,1);assert.equal(projectiles.projectiles.length,0);assert.equal(combat.takeEvents().filter(e=>e.type==='correct').length,1);

const dialogue=createDialogueDirector({random:()=>0}),voices=createPumpkinDialogue(dialogue,{random:()=>0});
assert(voices.handle({type:'intro'}));assert.equal(dialogue.advance(1).speaker,'pumpkin');
assert(voices.hint({character:'dasha',slot:'r'},true));assert.match(dialogue.advance(1).text,/Ха-ть-фу/);
assert(voices.handle({type:'wrong',character:'slavik',next:{character:'katya',slot:'e'}}));assert.equal(dialogue.advance(1).speaker,'pumpkin');
assert.equal(DIALOGUE_DATA.profiles.pumpkin.name,'Гарбузич');
console.log('Passed: all 48 randomized recipes; strict three-hit wins/reset; misses/refusals/waiting; all heroes jump/tunnel/immunity blocking; fixed boss/camera anchors; inactive passage; real projectiles consumed once; voiced dialogue and contextual hints.');
