import assert from 'node:assert/strict';
import {createState,step,requestTouchJump,WORLD} from '../engine.mjs';
import {createGhostHandsEnemies,applyGhostHandsContact,nearestGhostTarget} from '../ghost-hands.mjs';
const enemy=createGhostHandsEnemies(()=>.5)[0];assert.equal(enemy.scale,3);assert(enemy.x>=1600&&enemy.x<12800);
function tick(player,axis,dt){const before={x:player.x,y:player.y};step(player,axis,dt);return applyGhostHandsContact(player,before,enemy);}
function recover(player){let frames=0;while(player.mode==='fall'){tick(player,1,1/120);assert(++frames<180);}assert.equal(player.y,0);assert.equal(player.mode,'idle');}
for(const id of ['slavik','dasha','katya'])for(const dir of [-1,1])for(const dt of [1/120,.05]){
 const walking=createState(id);walking.x=enemy.x-dir*400;walking.facing=dir;
 let count=0;while(!tick(walking,dir,dt))assert(++count<300);
 const impact=walking.x;assert.equal(walking.mode,'fall');assert.equal(walking.ghostHitCount,1);
 assert.equal(applyGhostHandsContact(walking,{x:walking.x,y:walking.y},enemy),false);
 recover(walking);assert((walking.x-impact)*dir<0,'Hit pushed forward');
 assert(Math.abs(walking.x-enemy.x)>enemy.halfWidth+18,'Recovery inside enemy');
 const jumping=createState(id);jumping.x=enemy.x-dir*220;jumping.facing=dir;
 assert(requestTouchJump(jumping,'forward'));let peak=0;
 while(jumping.airborne||jumping.landingMs>0){assert(!tick(jumping,0,dt),'Valid jump hit obstacle');peak=Math.max(peak,-jumping.y);}
 assert(peak>169&&peak<=171.1);assert((jumping.x-enemy.x)*dir>114);assert.equal(jumping.ghostHitCount,0);
 const late=createState(id);late.x=enemy.x-dir*150;late.facing=dir;requestTouchJump(late,'forward');
 let hit=false;while(late.airborne&&!hit)hit=tick(late,0,dt);assert(hit,'Late jump did not hit');assert(late.y<0,'Air hit teleported to ground');recover(late);
}
const landing=createState();landing.x=enemy.x;landing.y=-210;landing.vy=250;landing.airborne=true;landing.mode='jump';
while(!tick(landing,0,1/120)){}assert(landing.y<0);recover(landing);
const standing=createState();standing.x=enemy.x;assert(tick(standing,0,.01));recover(standing);
const nearest=nearestGhostTarget({one:{character:'one',x:enemy.x-10,y:-360},two:{character:'two',x:enemy.x-200,y:0}},enemy);assert.equal(nearest.character,'two');
assert(WORLD.jumpSpeed**2/(2*WORLD.gravity)>170&&WORLD.jumpSpeed**2/(2*WORLD.gravity)<172);
assert(Math.abs(2*WORLD.jumpSpeed/WORLD.gravity-19/15)<1e-10,'Flight duration changed');
assert.equal(WORLD.airSpeed,320,'Forward range changed');
console.log('Passed: 3× randomized hands; all heroes jump both ways, touch-forward works, failed jumps/walking/landing cause backwards knockback and existing fall, no teleport/repeated hit, safe recovery, nearest target includes height.');
