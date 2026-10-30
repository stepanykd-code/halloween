import assert from 'node:assert/strict';
import {WORLD,CHARACTERS,createState,step,requestJump,selectCharacter} from '../engine.mjs';
import {createGhostHandsEnemies,applyGhostHandsContact} from '../ghost-hands.mjs';
import {createPartyFollowers,PARTY_FOLLOW,followerJumpPlan} from '../followers.mjs';

function seeded(seed){return ()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);}
function party(id='slavik',dir=1){
 const players=Object.fromEntries(Object.keys(CHARACTERS).map(hero=>[hero,createState(hero,()=>.3)]));
 const start=dir>0?1000:14500;players[id].x=start;players[id].facing=dir;
 Object.keys(players).filter(hero=>hero!==id).forEach((hero,index)=>{players[hero].x=start-dir*(PARTY_FOLLOW.gaps[index]+100);players[hero].facing=dir;});
 const follow=createPartyFollowers();follow.reset(players,id);return {players,follow,id,dir,jumps:new Set(),contacts:[]};
}
function tick(run,axis,dt,enemies,{autoLead=true}={}){
 const {players,follow,id}=run,leader=players[id],before=Object.fromEntries(Object.entries(players).map(([hero,p])=>[hero,{x:p.x,y:p.y,airborne:p.airborne}]));
 if(autoLead&&axis&&!leader.airborne&&leader.mode!=='fall'){
  const enemy=enemies.filter(enemy=>(enemy.x-leader.x)*axis>0).sort((a,b)=>axis*(a.x-b.x))[0];
  if(enemy){const plan=followerJumpPlan(enemy),d=axis*(enemy.x-leader.x);if(d<=plan.takeoff+WORLD.speed*dt&&d>=plan.minimum)requestJump(leader,axis);}
 }
 step(leader,axis,dt);follow.update(players,id,enemies,dt);
 for(const [hero,p] of Object.entries(players)){
  if(!before[hero].airborne&&p.airborne)run.jumps.add(hero);
  for(const enemy of enemies)if(applyGhostHandsContact(p,before[hero],enemy))run.contacts.push({hero,enemy:enemy.x,x:p.x});
 }
}

const example={x:5000,halfWidth:64,height:124};
const plan=followerJumpPlan(example);
assert(Math.abs(plan.takeoff-202.6666666667)<1e-7);
assert(plan.minimum>185&&plan.maximum<221);
assert.equal(followerJumpPlan({...example,height:200}),null);
assert.equal(PARTY_FOLLOW.stepLength,96);
assert(PARTY_FOLLOW.gaps[1]-PARTY_FOLLOW.gaps[0]>PARTY_FOLLOW.separation);

// Preserve the opening tableau, independent idle phases/phone timers, and
// an in-place jump. Only actual leader travel starts following.
{
 const run=party();run.players.slavik.x=590;run.players.dasha.x=850;run.players.katya.x=1040;
 run.follow.reset(run.players,'slavik');
 const original=Object.values(run.players).map(p=>p.x);
 for(let i=0;i<1200;i++)tick(run,0,1/60,[]);
 assert.deepEqual(Object.values(run.players).map(p=>p.x),original);assert(!run.follow.enabled);
 requestJump(run.players.slavik,0,{inPlace:true});for(let i=0;i<100;i++)tick(run,0,1/60,[]);
 assert(!run.follow.enabled);assert.deepEqual(Object.values(run.players).map(p=>p.x),original);
 for(let i=0;i<600;i++)tick(run,1,1/60,[]);
 for(let i=0;i<240;i++)tick(run,0,1/60,[]);
 const [first,second]=run.follow.order.map(id=>run.players[id]);
 assert(Math.abs(run.players.slavik.x-first.x-PARTY_FOLLOW.gaps[0])<1);
 assert(Math.abs(run.players.slavik.x-second.x-PARTY_FOLLOW.gaps[1])<1);
 assert(second.x<first.x);assert(first.x-second.x>=PARTY_FOLLOW.separation);
 const stopped=Object.values(run.players).map(p=>p.x);
 for(let i=0;i<180;i++)tick(run,0,1/60,[]);
 assert.deepEqual(Object.values(run.players).map(p=>p.x),stopped,'Arrival oscillates');
 // Turning reassigns the companions in their existing spatial order.
 for(let i=0;i<600;i++)tick(run,-1,1/60,[]);
 for(let i=0;i<240;i++)tick(run,0,1/60,[]);
 for(const [index,hero] of run.follow.order.entries())assert(Math.abs(run.players[hero].x-run.players.slavik.x-PARTY_FOLLOW.gaps[index])<1);
 const selectedX=run.players.dasha.x;run.id='dasha';selectCharacter(run.players.dasha,'dasha');run.follow.select(run.players,'dasha');
 tick(run,0,1/60,[]);assert.equal(run.players.dasha.x,selectedX,'Selection teleported player');
 run.follow.reset(run.players,'dasha');assert(!run.follow.enabled);
}

// Analytic takeoff, swept collision checks and queues work at both extremes
// of frame timing, for every leader, either direction, and randomized maps.
let crossings=0;
for(const dt of [1/120,1/60,.05])for(const dir of [-1,1])for(const id of Object.keys(CHARACTERS))for(let seed=1;seed<=8;seed++){
 const enemies=createGhostHandsEnemies(seeded(seed));const run=party(id,dir);
 let npcMinGap=Infinity;
 const end=dir>0?15600:200;
 for(let i=0;i<85/dt;i++){
  const axis=dir*(end-run.players[id].x)>0?dir:0;
  tick(run,axis,dt,enemies);
  const companions=Object.values(run.players).filter(p=>p.character!==id);
  npcMinGap=Math.min(npcMinGap,Math.abs(companions[0].x-companions[1].x));
 }
 assert.deepEqual(run.contacts,[],`Contact: ${id} ${dir} ${dt} seed ${seed}`);
 assert.equal(run.jumps.size,3,'A companion never jumped');
 assert(npcMinGap>=PARTY_FOLLOW.separation-1e-6,`Companions overlap: ${npcMinGap}`);
 for(const [index,hero] of run.follow.order.entries()){
  const gap=dir*(run.players[id].x-run.players[hero].x);
  assert(Math.abs(gap-PARTY_FOLLOW.gaps[index])<1,`Never caught up: ${JSON.stringify({gap,id,dir,dt,seed,hero,waiting:run.follow.waiting,positions:Object.values(run.players).map(p=>[p.character,p.x,p.mode]),enemies:enemies.map(e=>e.x)})}`);
 }
 crossings+=enemies.length*3;
}

// A stopped hero occupies the landing zone: followers wait safely instead
// of attempting a shortened flight or piling up on the far side.
for(const dt of [1/120,.05]){
 const run=party();run.players.slavik.x=example.x+200;run.players.dasha.x=example.x-550;run.players.katya.x=example.x-850;
 tick(run,1,dt,[]);for(let i=0;i<10/dt;i++)tick(run,0,dt,[example]);
 assert.deepEqual(run.contacts,[]);assert(!run.jumps.has('dasha'));assert(!run.jumps.has('katya'));
 assert(run.players.dasha.x<=example.x-plan.takeoff+.01);
 assert(run.players.dasha.x-run.players.katya.x>=PARTY_FOLLOW.separation-.001);
 for(let i=0;i<12/dt;i++)tick(run,1,dt,[example]);
 assert.deepEqual(run.contacts,[]);assert(run.jumps.has('dasha')&&run.jumps.has('katya'));
}

// Changing direction or selection while a follower is airborne cannot steer
// that jump back into the hands.
for(const action of ['reverse','switch'])for(const dt of [1/120,.05]){
 const run=party();run.players.slavik.x=example.x+620;run.players.dasha.x=example.x-230;run.players.katya.x=example.x-620;
 let changed=false;
 for(let i=0;i<12/dt;i++){
  if(!changed&&run.players.dasha.airborne){
   changed=true;
   if(action==='switch'){run.id='katya';selectCharacter(run.players.katya,'katya');run.follow.select(run.players,'katya');}
  }
  tick(run,changed&&action==='reverse'?-1:1,dt,[example]);
 }
 assert(changed);assert.equal(run.players.dasha.ghostHitCount,0,'Interrupted AI flight hit hands');
}
// After selection changes near the hands, first restore enough runway.
for(const dir of [-1,1])for(const dt of [1/120,.05]){
 const run=party('slavik',dir);run.players.slavik.x=example.x+dir*1200;
 run.players.dasha.x=example.x-dir*120;run.players.katya.x=example.x-dir*395;
 run.follow.reset(run.players,'slavik');tick(run,dir,dt,[example]);
 let retreated=false;
 for(let i=0;i<8/dt;i++){
  tick(run,0,dt,[example]);
  if(dir*(example.x-run.players.dasha.x)>=plan.takeoff-.01)retreated=true;
 }
 assert(retreated,'Too-close companion never made room for takeoff');
 assert.deepEqual(run.contacts,[],'Backing out of a late takeoff hit the hands');
 assert(run.jumps.has('dasha')&&run.jumps.has('katya'));
}
console.log(`Passed followers: opening preserved, 5–8 footsteps, spacing/arrival, turn/switch/reset, safe landing queues/runway recovery, ${crossings} randomized hand crossings at 3 frame rates with all leaders/directions, uninterrupted AI jumps.`);
