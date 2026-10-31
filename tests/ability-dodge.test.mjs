import assert from 'node:assert/strict';
import {createState,requestAbility,requestJump,requestTouchJump,step,SLAVIK_ABILITY_MS} from '../engine.mjs';
import {createSpellProjectiles,abilitySpell} from '../spell-projectiles.mjs';
import {abilityAnimationTime,slavikAbilityPose,SLAVIK_ABILITY} from '../slavik-ability.mjs';
import {girlsAbilityPose} from '../girls-ability.mjs';
assert.equal(SLAVIK_ABILITY_MS,2000);
for(const hero of ['slavik','dasha','katya'])for(const slot of ['e','r'])for(const dodge of ['jump','forward','crouch']){
 const p=createState(hero),spells=createSpellProjectiles(),spell=abilitySpell(hero,slot);p.x=800;
 assert(requestAbility(p,slot));assert(!requestJump(p),'The unlaunched wind-up remains protected');
 while(p.abilityTime<spell.launchMs){step(p,0,.01);spells.observe({p});}
 assert.equal(spells.projectiles.length,1);const serial=p.abilitySerial,origin={...spells.projectiles[0].origin};
 if(dodge==='crouch'){step(p,0,1/60,true);assert.equal(p.mode,'crouch','Held crouch must interrupt immediately after release');}
 else{assert(dodge==='forward'?requestTouchJump(p,'forward'):requestJump(p));assert(p.airborne);assert.equal(p.mode,'jump');}
 assert(p.abilityTime<SLAVIK_ABILITY_MS,'Dodging still waits for the animation tail');
 for(let i=0;i<30;i++){step(p,0,1/60,dodge==='crouch');spells.observe({p});}
 assert.equal(spells.projectiles.length,1,'Interrupting recovery duplicated or lost the cast');assert.equal(spells.projectiles[0].castSerial,serial);assert.deepEqual(spells.projectiles[0].origin,origin,'The launched emblem followed the jumping hero');
}
// Shortening changes playback time only; the approved arm and circle meet at
// the same pose when the static hold is skipped, and finish fully at rest.
for(const hero of ['slavik','dasha','katya']){
 const pose=t=>hero==='slavik'?slavikAbilityPose(abilityAnimationTime(t)):girlsAbilityPose(abilityAnimationTime(t),hero);
 const a=pose(1.4-1e-5),b=pose(1.4+1e-5);
 for(const key of ['angle','reach','ring'])assert(Math.abs(a[key]-b[key])<1e-6,'Pose jumps when the hold is shortened');
 assert.equal(pose(2).reach,0);assert.equal(pose(2).ring,0);
 const p=createState(hero),spells=createSpellProjectiles();requestAbility(p);
 for(let i=0;i<120;i++){step(p,0,1/60);spells.observe({p});}
 assert.equal(p.mode,'idle');assert.equal(spells.projectiles.length,1);assert.equal(abilityAnimationTime(2),SLAVIK_ABILITY.duration);
 // A new cast must not inherit permission to dodge before its own release.
 assert(requestAbility(p));assert(!requestJump(p));
}
console.log('Passed: all six abilities release jump/forward-jump/crouch after one real launch; no missing/duplicate/moving-origin shots; 2-second normal casts; smooth approved return poses; new wind-ups stay protected.');
