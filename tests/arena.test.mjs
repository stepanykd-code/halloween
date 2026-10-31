import assert from 'node:assert/strict';
import {createBossArenaParty} from '../boss-arena-party.mjs';
import {createState} from '../engine.mjs';
import {createPumpkinBoss} from '../pumpkin-boss.mjs';
import {createGhostHandsEnemies,ghostHandsBlockedZones} from '../ghost-hands.mjs';
const boss=createPumpkinBoss();boss.lockArena();const view={x:boss.cameraLeft(1600),width:1600};
for(const controlled of ['slavik','dasha','katya']){
 const players=Object.fromEntries(['slavik','dasha','katya'].map((id,i)=>[id,{...createState(id),x:view.x+120+i*350}]));
 const party=createBossArenaParty();const selectedX=players[controlled].x;
 for(let i=0;i<600;i++){
   const before=Object.fromEntries(Object.entries(players).map(([id,p])=>[id,{x:p.x,y:p.y}]));
   party.update(players,controlled,view,1/60);boss.blockPlayers(players,before,view.x);
   assert.equal(players[controlled].x,selectedX,'The AI never moves the selected hero');
   for(const p of Object.values(players))assert(p.x>=view.x+80&&p.x<view.x+view.width);
 }
 const sorted=Object.values(players).sort((a,b)=>a.x-b.x);
 for(let i=1;i<sorted.length;i++)assert(sorted[i].x-sorted[i-1].x>=194.99,'Parked heroes must not overlap');
 for(const p of Object.values(players).filter(p=>p.character!==controlled))assert(p.x<=view.x+820,'Inactive heroes stay on the left of the arena');
 const camera=boss.cameraLeft(1600);players[controlled].x=view.x-100;
 boss.blockPlayers(players,{[controlled]:{x:view.x+90,y:0}},view.x);assert.equal(players[controlled].x,view.x+80);assert.equal(boss.cameraLeft(1600),camera);
}
console.log('Passed: inactive heroes walk to the left, keep spacing, never control the active hero, remain inside the arena, and do not move the locked camera.');

const entry=createBossArenaParty(),team=Object.fromEntries(['slavik','dasha','katya'].map((id,i)=>[id,{...createState(id),x:view.x-650+i*480}]));
entry.beginEntry(team,view);let frames=0;
while(entry.entering&&frames++<1200){
 const before=Object.fromEntries(Object.entries(team).map(([id,p])=>[id,p.x]));entry.updateEntry(team,1/60);
 for(const [id,p] of Object.entries(team))assert(Math.abs(p.x-before[id])<=4.001,'Automatic entry must walk without teleporting');
}
assert(frames<1200);for(const p of Object.values(team))assert(p.x>=view.x+80&&p.x<=view.x+800);
const cinematic=createPumpkinBoss(),incoming={x:cinematic.bounds.left-1598,width:1600},observer=createState();observer.x=incoming.x+960;
cinematic.advance(.01,observer,incoming);assert(cinematic.cameraLocked);assert(!cinematic.cameraReady);assert.equal(cinematic.cameraLeft(1600),incoming.x);
let previous=incoming.x;
for(let i=0;i<30;i++){cinematic.advance(.05,observer,incoming);const x=cinematic.cameraLeft(1600);assert(x>=previous&&x<=cinematic.arenaLeft(1600));previous=x;}
assert(cinematic.cameraReady);assert.equal(previous,cinematic.arenaLeft(1600));observer.x-=1000;cinematic.advance(.05,observer,incoming);assert.equal(cinematic.cameraLeft(1600),previous);
for(let seed=1;seed<=100;seed++){
 let n=seed;const random=()=>((n=(1664525*n+1013904223)>>>0)/4294967296);
 const left=cinematic.arenaLeft(1600),right=left+1600;
 const hands=createGhostHandsEnemies(random).filter(e=>e.x+160<left||e.x-160>right);
 assert(hands.some(e=>e.x+160<left),'Every launch must have hands on the approach');
 for(const hand of hands){assert(hand.screen>=2&&hand.screen<=8);for(const zone of ghostHandsBlockedZones())assert(hand.x<=zone.start||hand.x>=zone.end);assert(hand.x+160<left||hand.x-160>right);}
}
console.log('Passed: smooth camera triggered on first sight and independent of the player; automatic walking entry for all three; hands guaranteed before, excluded inside the arena, and protected landmark/screen rules preserved for 100 layouts.');
