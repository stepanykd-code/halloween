import assert from 'node:assert/strict';
import {WORLD,CHARACTERS,PHONE_TIMING,ANIMATIONS,createState,step,advanceAnimation,selectCharacter,requestJump,noteActivity} from '../engine.mjs';
const s=createState();
step(s,1,.05);assert.equal(s.x,462);assert.equal(s.mode,'walk');assert.equal(s.facing,1);
step(s,-1,.05);assert.equal(s.x,450);assert.equal(s.facing,-1);
step(s,0,.05);assert.equal(s.mode,'idle');assert.equal(s.frame,0);assert.equal(s.facing,-1);
s.x=WORLD.maxX-1;step(s,1,.05);assert.equal(s.x,WORLD.maxX);step(s,1,.05);assert.equal(s.mode,'idle');
s.x=WORLD.minX+1;step(s,-1,.05);assert.equal(s.x,WORLD.minX);step(s,-1,.05);assert.equal(s.mode,'idle');
const idle=createState('slavik',()=>0);advanceAnimation(idle,2480);assert.equal(idle.frame,7);advanceAnimation(idle,80);assert.equal(idle.frame,0);assert.equal(idle.elapsed,0);
const walk=createState('slavik',()=>0);walk.mode='walk';advanceAnimation(walk,800);assert.equal(walk.frame,0);assert.equal(walk.elapsed,0);
const resumed=createState();step(resumed,1,20);assert.equal(resumed.x,462);
console.log('Passed: movement in both directions, facing, release to idle, both scene boundaries, animation loops, background-tab time clamp.');
for(const id of Object.keys(CHARACTERS)){
  const player=createState(id);assert.equal(player.character,id);
  step(player,-1,.05);assert.equal(player.mode,'walk');assert.equal(player.facing,-1);
  step(player,0,.05);assert.equal(player.mode,'idle');
  const x=player.x;assert.equal(selectCharacter(player,'katya'),true);assert.equal(player.x,x);assert.equal(player.facing,-1);assert.equal(player.frame,0);
  assert.equal(selectCharacter(player,'unknown'),false);assert.equal(player.character,'katya');
}
console.log('Passed: all three characters move, stop and switch without moving position or facing.');
assert.ok(CHARACTERS.slavik.scale>CHARACTERS.dasha.scale&&CHARACTERS.dasha.scale>CHARACTERS.katya.scale);
assert.equal(createState('__proto__').character,'slavik');

function finishJump(player){
  let peak=0,frames=0;
  while(player.airborne||player.landingMs>0){
    step(player,0,1/120);peak=Math.max(peak,-player.y);
    assert.ok(player.x>=WORLD.minX&&player.x<=WORLD.maxX);
    assert.ok(player.y<=0);
    assert.ok(player.frame>=0&&player.frame<8);
    assert.ok(++frames<240,'Jump did not finish');
  }
  assert.equal(player.y,0);assert.equal(player.vy,0);assert.equal(player.mode,'idle');
  return peak;
}
const originalScales=JSON.stringify(CHARACTERS);
for(const id of Object.keys(CHARACTERS)){
  const stationary=createState(id);stationary.facing=-1;
  assert.equal(requestJump(stationary),true);
  const peak=finishJump(stationary);
  assert.equal(stationary.x,450);assert.equal(stationary.facing,-1);
  assert.ok(peak>170&&peak<172);
  for(const direction of [-1,1]){
    const forward=createState(id);forward.x=800;assert.equal(requestJump(forward,direction),true);
    finishJump(forward);
    assert.equal(forward.facing,direction);
    assert.ok((forward.x-800)*direction>400&&(forward.x-800)*direction<412);
  }
}
assert.equal(JSON.stringify(CHARACTERS),originalScales);
const double=createState();requestJump(double);step(double,0,.05);
const savedVy=double.vy;assert.equal(requestJump(double),false);assert.equal(double.vy,savedVy);
selectCharacter(double,'slavik');assert.equal(double.airborne,true);assert.equal(double.mode,'jump');
finishJump(double);
for(const [start,axis,boundary] of [[WORLD.minX+5,-1,WORLD.minX],[WORLD.maxX-5,1,WORLD.maxX]]){
  const wall=createState();wall.x=start;requestJump(wall,axis);finishJump(wall);assert.equal(wall.x,boundary);
}
const airControl=createState();requestJump(airControl);step(airControl,1,.05);assert.ok(airControl.x>450);assert.equal(airControl.jumpVelocity,WORLD.airSpeed);finishJump(airControl);
const reset=createState('katya');assert.equal(reset.y,0);assert.equal(reset.airborne,false);
console.log('Passed: all three jump in place, jump left/right, retain momentum, land, keep size, reject double jumps, survive switching and stop at scene boundaries.');
for(const id of Object.keys(CHARACTERS)){
  const crouched=createState(id);
  step(crouched,1,.05);const crouchX=crouched.x;
  for(let frame=0;frame<240;frame++)step(crouched,-1,1/60,true);
  assert.equal(crouched.mode,'crouch');assert.equal(crouched.frame,0);
  assert.equal(crouched.x,crouchX);assert.equal(crouched.y,0);assert.equal(crouched.facing,-1);
  step(crouched,0,.05,false);assert.equal(crouched.mode,'idle');assert.equal(crouched.x,crouchX);
  step(crouched,0,.05,true);assert.equal(requestJump(crouched),true);
  step(crouched,0,.05,true);assert.equal(crouched.airborne,true);assert.equal(crouched.mode,'jump');assert.ok(crouched.y<0);
  let frames=0;while(crouched.airborne){step(crouched,0,1/120,true);assert.ok(++frames<240);}
  step(crouched,0,.01,true);assert.equal(crouched.mode,'crouch');assert.equal(crouched.y,0);assert.equal(crouched.x,crouchX);
  step(crouched,1,.05,false);assert.equal(crouched.mode,'walk');assert.ok(crouched.x>crouchX);
  step(crouched,0,.05,true);selectCharacter(crouched,id);step(crouched,0,.05,false);assert.equal(crouched.mode,'idle');
  step(crouched,0,.05,true);const launchX=crouched.x;assert.equal(requestJump(crouched,1),true);
  finishJump(crouched);assert.ok(crouched.x>launchX+170);
}
console.log('Passed: all three crouch without creeping, stand on release or switch, resume walking, jump from a crouch, and crouch after landing without cancelling flight.');

function waitIdle(player,seconds){for(let elapsed=0;elapsed<seconds-1e-9;elapsed+=.01)step(player,0,Math.min(.01,seconds-elapsed));}
function startPhone(player){step(player,0,0);waitIdle(player,(player.idleDelay-player.idleTime)/1000);assert.equal(player.mode,'phone');}
function validTiming(player){assert.ok(player.idleDelay>=8000&&player.idleDelay<=15000);assert.ok(player.phoneDuration>=3000&&player.phoneDuration<=5000);}
const low=createState('slavik',()=>0),high=createState('slavik',()=>1);
assert.equal(low.frame,0);assert.equal(low.elapsed,0);assert.equal(low.idleDelay,8000);assert.equal(low.phoneDuration,3000);
assert.equal(high.frame,7);assert.ok(high.elapsed<80&&high.elapsed>=0);assert.equal(high.idleDelay,15000);assert.equal(high.phoneDuration,5000);
assert.deepEqual([0,.4,.8].map(value=>createState('slavik',()=>value).frame),[0,3,6]);
for(const id of Object.keys(CHARACTERS)){
  const player=createState(id,()=>0);player.facing=-1;
  waitIdle(player,7.99);assert.equal(player.mode,'idle');assert.ok(player.idleTime<8000);
  step(player,0,.01);assert.equal(player.mode,'phone');assert.equal(player.frame,0);
  assert.equal(player.x,450);assert.equal(player.y,0);assert.equal(player.facing,-1);
  const entry=ANIMATIONS.phone.durations.slice(0,4).reduce((a,b)=>a+b,0);
  advanceAnimation(player,entry);assert.equal(player.frame,4);
  for(let i=0;i<150;i++){advanceAnimation(player,100);assert.ok(player.frame>=4&&player.frame<=7);}
  waitIdle(player,2.35);assert.equal(player.phoneReturning,false);
  step(player,0,.02);assert.equal(player.phoneReturning,true);assert.equal(player.frame,3);
  waitIdle(player,.62);assert.equal(player.mode,'phone');
  step(player,0,.01);assert.equal(player.mode,'idle');assert.equal(player.phoneTime,0);assert.equal(player.phoneReturning,false);validTiming(player);
  startPhone(player);
  step(player,-1,.01);assert.equal(player.mode,'walk');assert.equal(player.idleTime,0);
  step(player,0,.01);validTiming(player);startPhone(player);
  step(player,0,.01,true);assert.equal(player.mode,'crouch');assert.equal(player.idleTime,0);
  for(let i=0;i<300;i++)step(player,0,.05,true);
  assert.equal(player.mode,'crouch');assert.equal(player.idleTime,0);
  step(player,0,.01);startPhone(player);
  assert.equal(requestJump(player),true);assert.equal(player.mode,'jump');assert.equal(player.idleTime,0);finishJump(player);
  startPhone(player);selectCharacter(player,id);assert.equal(player.mode,'idle');assert.equal(player.idleTime,0);
  startPhone(player);noteActivity(player);assert.equal(player.mode,'idle');assert.equal(player.idleTime,0);
  player.x=WORLD.maxX;
  for(let i=0;i<300;i++)step(player,1,.05);
  assert.equal(player.mode,'idle');assert.equal(player.idleTime,0);
  for(let i=0;i<300;i++)step(player,0,.05,false,true);
  assert.equal(player.mode,'idle');assert.equal(player.idleTime,0);
}
waitIdle(high,14.99);assert.equal(high.mode,'idle');step(high,0,.01);assert.equal(high.mode,'phone');
waitIdle(high,4.99);assert.equal(high.mode,'phone');step(high,0,.01);assert.equal(high.mode,'idle');validTiming(high);
const ensemble=Object.keys(CHARACTERS).map((id,index)=>createState(id,()=>index===2?1:0));
for(let i=0;i<180;i++)for(const player of ensemble)step(player,player.character==='slavik'?(Math.floor(i/25)%2?-1:1):0,.05);
assert.equal(ensemble[0].mode,'walk');assert.equal(ensemble[1].mode,'phone');assert.equal(ensemble[2].mode,'idle');
for(let i=0;i<5;i++){startPhone(ensemble[2]);const busy=ensemble[2].phoneDuration;waitIdle(ensemble[2],(busy-.01)/1000);assert.equal(ensemble[2].mode,'phone');step(ensemble[2],0,.00001);assert.equal(ensemble[2].mode,'idle');validTiming(ensemble[2]);}
const throttled=createState();step(throttled,0,20);assert.equal(throttled.mode,'idle');assert.equal(throttled.idleTime,50);
console.log('Passed: random initial idle frame and phase, 8–15-second waits, finite 3–5-second phone cycles with put-away, repeated randomized cycles, independent timers, immediate control cancellation, held controls and walls, no background time jump.');
