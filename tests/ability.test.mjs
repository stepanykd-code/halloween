import assert from 'node:assert/strict';
import {createState,step,requestAbility,requestJump,requestFall,requestHitFall,selectCharacter,SLAVIK_ABILITY_MS} from '../engine.mjs';
import {SLAVIK_ABILITY} from '../slavik-ability.mjs';
import {createTouchControls} from '../controls.mjs';
assert.equal(SLAVIK_ABILITY.duration*1000,SLAVIK_ABILITY_MS);
const p=createState();p.x=1000;p.facing=-1;p.mode='phone';assert(requestAbility(p));assert.equal(p.mode,'ability');assert(!requestAbility(p));assert(!requestJump(p,1));assert(!requestFall(p));
step(p,1,.05,true,true);assert.equal(p.x,1000);assert.equal(p.facing,-1);assert.equal(p.mode,'ability');assert.equal(p.abilityTime,50);
assert(selectCharacter(p,'slavik'));assert.equal(p.mode,'ability');
while(p.abilityTime<SLAVIK_ABILITY_MS)step(p,1,.05,true,true);
assert.equal(p.mode,'idle');assert.equal(p.x,1000);assert.equal(p.idleTime,0);step(p,1,.05);assert(p.x>1000);
assert(requestAbility(p));assert(requestHitFall(p,-1,0));assert.equal(p.mode,'fall');step(p,0,.05);assert.equal(p.mode,'fall');
const unsupported=createState();unsupported.character='unavailable';assert(!requestAbility(unsupported));
for(const hero of ['dasha','katya'])for(const facing of [-1,1]){const girl=createState(hero);girl.facing=facing;girl.x=1000;assert(requestAbility(girl));while(girl.abilityTime<SLAVIK_ABILITY_MS){step(girl,-facing,.05);assert.equal(girl.x,1000);assert.equal(girl.facing,facing);}assert.equal(girl.mode,'idle');assert(requestAbility(girl));assert(requestHitFall(girl,-1,0));assert.equal(girl.mode,'fall');}
const air=createState();requestJump(air,1);assert(!requestAbility(air));
class Button extends EventTarget{disabled=false;classList={toggle(){}};setPointerCapture(){};emit(type,data={}){const e=new Event(type,{cancelable:true});Object.assign(e,{button:0,detail:1,...data});this.dispatchEvent(e);}}
const ability=new Button(),left=new Button();let casts=0;const controls=createTouchControls({ability,left},{onActivity(){},onJump(){},onAbility(){casts++;}});
left.emit('pointerdown',{pointerId:1});ability.emit('pointerdown',{pointerId:2});assert.equal(casts,1);ability.emit('pointerup',{pointerId:2});assert(controls.getState().left);ability.emit('click');assert.equal(casts,1);ability.emit('click',{detail:0});assert.equal(casts,2);ability.disabled=true;ability.emit('pointerdown',{pointerId:3});ability.emit('click',{detail:0});assert.equal(casts,2);
console.log('Passed Slavik ability: approved duration, no motion/turn/jump overlap, idle recovery, selection persistence, hit interruption, all three heroes supported, independent touch/accessible activation and disabled guard.');

const {girlsAbilityPose}=await import('../girls-ability.mjs');const {slavikAbilityPose}=await import('../slavik-ability.mjs');assert(girlsAbilityPose(.35,'katya').reach>slavikAbilityPose(.35).reach);for(let i=140;i<440;i++)assert.deepEqual(girlsAbilityPose(i/100,'katya'),slavikAbilityPose(i/100));console.log('Passed: Katya starts faster and keeps the standard ending.');
