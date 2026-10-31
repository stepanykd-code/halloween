import assert from 'node:assert/strict';
import {createState,step,requestJump} from '../engine.mjs';
import {createScreamerDirector,screamerContact} from '../screamer.mjs';
const enemy={x:3000,halfWidth:64,height:124},view={x:2000,width:1600};
function clear(director,players,hero,controlled,dir=1){
 const p=players[hero];Object.assign(p,createState(hero),{x:enemy.x-dir*210});requestJump(p,dir);
 for(let i=0;i<100;i++){
  const before=Object.fromEntries(Object.entries(players).map(([id,p])=>[id,{...p}]));
  step(p,0,1/60);director.observe(players,before,controlled,[enemy],view);
  if(!p.airborne)break;
 }
}
for(const dir of [-1,1]){
 let calls=0;const d=createScreamerDirector(()=>{calls++;return calls===1?.49:.5;});
 const players={slavik:createState('slavik'),dasha:createState('dasha'),katya:createState('katya')};
 clear(d,players,'dasha','slavik',dir);assert.equal(d.clears,0);assert.equal(d.ghosts.length,0);
 clear(d,players,'slavik','slavik',dir);assert.equal(d.clears,1);assert.equal(d.ghosts.length,0);
 clear(d,players,'slavik','slavik',-dir);assert.equal(d.clears,2);assert.equal(d.ghosts.length,1);assert.equal(calls,0);
 clear(d,players,'katya','katya',dir);assert.equal(d.ghosts.length,2);
 clear(d,players,'katya','katya',dir);assert.equal(d.ghosts.length,2);
 const xs=d.ghosts.map(g=>g.x),before=Object.fromEntries(Object.entries(players).map(([id,p])=>[id,{...p}]));
 d.advance(players,before,.05,view);d.ghosts.forEach((g,i)=>assert(g.x<xs[i]));
 d.reset();assert.equal(d.clears,0);assert.equal(d.ghosts.length,0);
}
// Selecting an automatic jumper midway never promotes its flight to a player jump.
{
 const d=createScreamerDirector(),players={slavik:createState('slavik'),dasha:createState('dasha')};
 players.dasha.x=2790;requestJump(players.dasha,1);
 const b=Object.fromEntries(Object.entries(players).map(([id,p])=>[id,{...p}]));b.dasha.airborne=false;b.dasha.mode='idle';
 d.observe(players,b,'slavik',[enemy],view);
 for(let i=0;i<100;i++){const before=Object.fromEntries(Object.entries(players).map(([id,p])=>[id,{...p}]));step(players.dasha,0,1/60);d.observe(players,before,'dasha',[enemy],view);}
 assert.equal(d.clears,0);
}
// A manually launched hero also cannot trigger a spawn after losing control.
{
 const d=createScreamerDirector(),players={slavik:createState('slavik'),dasha:createState('dasha')};
 players.slavik.x=2790;requestJump(players.slavik,1);
 const before=Object.fromEntries(Object.entries(players).map(([id,p])=>[id,{...p}]));
 step(players.slavik,0,1/60);d.observe(players,before,'slavik',[enemy],view);
 for(let i=0;i<100;i++){const b=Object.fromEntries(Object.entries(players).map(([id,p])=>[id,{...p}]));step(players.slavik,0,1/60);d.observe(players,b,'dasha',[enemy],view);}
 assert.equal(d.clears,0);
}
// A fast crossing hits every standing character, once per ghost, then continues left.
{
 const d=createScreamerDirector(()=>0),players={slavik:createState('slavik'),dasha:createState('dasha'),katya:createState('katya')};
 clear(d,players,'slavik','slavik');clear(d,players,'slavik','slavik');
 Object.values(players).forEach((p,i)=>Object.assign(p,createState(p.character),{x:3300-i*280}));
 for(let i=0;i<400;i++){const before=Object.fromEntries(Object.entries(players).map(([id,p])=>[id,{...p}]));Object.values(players).forEach(p=>step(p,0,.025));d.advance(players,before,.025,view);}
 for(const p of Object.values(players))assert.equal(p.screamerHits,1);
 const p=createState();p.x=3000;assert(screamerContact({x:2900,y:480},{x:3100,y:480},p,{...p}));
 p.y=-600;assert(!screamerContact({x:2900,y:480},{x:3100,y:480},p,{...p}));
}
console.log('Passed screamer: only player-initiated successful crossings; both directions; second guaranteed, subsequent 50% threshold; AI selection excluded; always left; all three fall once; swept contact and reset.');
