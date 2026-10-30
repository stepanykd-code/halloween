import assert from 'node:assert/strict';
import {createState,requestFall,requestJump,selectCharacter,step,FALL_ANIMATION} from '../engine.mjs';
const s=createState('slavik');s.mode='phone';s.phoneTime=1500;s.facing=-1;
assert.equal(requestFall(s),true);assert.equal(s.phoneTime,0);assert.equal(requestFall(s),false);
const x=s.x;let seen=new Set([s.frame]),elapsed=0;
while(s.mode==='fall'){
 assert.equal(requestJump(s,1),false);assert.equal(selectCharacter(s,'katya'),false);
 assert.equal(selectCharacter(s,'slavik'),true);
 step(s,1,.01,true,true);elapsed+=10;
 assert.equal(s.x,x);assert.equal(s.y,0);assert.equal(s.facing,-1);
 if(s.mode==='fall')seen.add(s.frame);
 assert(elapsed<1000);
}
assert.equal(seen.size,8);assert.equal(elapsed,FALL_ANIMATION.durationsMs.reduce((a,b)=>a+b,0));
assert.equal(s.mode,'idle');assert.equal(s.idleTime,0);
step(s,0,.01);assert(s.idleDelay>=8000);assert.equal(s.mode,'idle');
assert.equal(requestFall(s),true);
for(const id of ['dasha','katya']){const player=createState(id);assert.equal(requestFall(player),true);let count=0;while(player.mode==='fall'){step(player,0,.01);assert(++count<100);}assert.equal(player.mode,'idle');}
const air=createState();requestJump(air);assert.equal(requestFall(air),false);assert.equal(air.mode,'jump');
console.log('Passed: all 8 fall frames once, correct duration, no creeping/turning/jumping/restart during fall, phone interrupted, idle restored, all three heroes, no airborne fall.');
