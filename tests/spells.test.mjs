import assert from 'node:assert/strict';
import {createState,requestAbility,requestHitFall,step,SLAVIK_ABILITY_MS,WORLD} from '../engine.mjs';
import {ABILITY_SPELLS,SPELL_OPACITY,spellOrigin,spellProjectilePose,createSpellProjectiles} from '../spell-projectiles.mjs';
import {createTouchControls} from '../controls.mjs';

const view={x:0,width:1600};
assert.equal(SPELL_OPACITY,.5);
for(const hero of ['slavik','dasha','katya'])for(const slot of ['e','r'])for(const facing of [-1,1]){
  const player=createState(hero),director=createSpellProjectiles();player.x=800;player.facing=facing;
  const spell=ABILITY_SPELLS[hero][slot];
  assert(requestAbility(player,slot));assert.equal(player.abilitySlot,slot);
  const serial=player.abilitySerial;assert(!requestAbility(player,slot));assert.equal(player.abilitySerial,serial);
  while(player.abilityTime<spell.launchMs-10)step(player,0,.01);
  director.observe({player});assert.equal(director.projectiles.length,0,'No shot before the circle lights');
  while(player.abilityTime<spell.launchMs)step(player,0,.01);
  director.observe({player});assert.equal(director.projectiles.length,1);
  const shot=director.projectiles[0];assert.equal(shot.spell.id,spell.id);assert.equal(shot.direction,facing);
  assert.deepEqual(shot.origin,spellOrigin(player));assert(Math.abs(shot.origin.x-player.x)>90);assert(shot.origin.y<WORLD.groundY-180);
  const origin=spellProjectilePose({...shot,age:0});assert.equal(origin.x,shot.origin.x);assert.equal(origin.y,shot.origin.y);
  while(player.abilityTime<SLAVIK_ABILITY_MS){step(player,-facing,1/60);director.observe({player});}
  assert.equal(director.projectiles.length,1,'One shot per cast, including held controls and hero switching');
  assert.equal(player.x,800);assert.equal(player.facing,facing);
  const excursions=Array.from({length:101},(_,i)=>spellProjectilePose({...shot,age:i/100}));
  for(const pose of excursions){assert(Number.isFinite(pose.x)&&Number.isFinite(pose.y));assert((pose.x-shot.origin.x)*facing>=-1e-6);}
  const deviations=excursions.map(p=>p.y-shot.origin.y);
  if(hero==='slavik')assert(Math.max(...deviations.map(Math.abs))<=7.01);
  if(hero==='katya')assert(slot==='e'?Math.min(...deviations)<-65:Math.max(...deviations)>50);
  if(hero==='dasha')assert(Math.max(...deviations)-Math.min(...deviations)>70);
  // An emblem and its full trail must clear the visible edge, then be removed.
  let count=0;while(director.projectiles.length&&count++<1000)director.advance(1/60,view);
  assert(count<1000);assert.equal(director.projectiles.length,0);
  assert(requestAbility(player,slot));while(player.abilityTime<spell.launchMs)step(player,0,.01);
  director.observe({player});assert.equal(director.projectiles.length,1,'Next cast launches again');
  director.reset();assert.equal(director.projectiles.length,0);
}

for(const hero of ['slavik','dasha','katya']){
  const player=createState(hero),director=createSpellProjectiles();
  assert(!requestAbility(player,'q'));assert(requestAbility(player,'r'));step(player,0,.05);
  assert(requestHitFall(player,-1,0));director.observe({player});assert.equal(director.projectiles.length,0,'Interrupted wind-up emits nothing');
}

// Reversing a cast changes its horizontal travel, not its vertical curve.
for(const hero of Object.keys(ABILITY_SPELLS))for(const spell of Object.values(ABILITY_SPELLS[hero])){
  const base={spell,age:.5,origin:{x:800,y:500}};
  const left=spellProjectilePose({...base,direction:-1}),right=spellProjectilePose({...base,direction:1});
  assert.equal(left.y,right.y);assert(Math.abs(left.x+right.x-1600)<1e-6);
}
class SpellButton extends EventTarget{
  disabled=false;classList={toggle(){}};setPointerCapture(){}
  emit(type,data={}){const event=new Event(type,{cancelable:true});Object.assign(event,{button:0,detail:1,...data});this.dispatchEvent(event);}
}
const left=new SpellButton(),primary=new SpellButton(),secondary=new SpellButton(),slots=[];
const touch=createTouchControls({left,ability:primary,'ability-secondary':secondary},{onActivity(){},onJump(){},onAbility:slot=>slots.push(slot)});
left.emit('pointerdown',{pointerId:1});secondary.emit('pointerdown',{pointerId:2});
assert.deepEqual(slots,['r']);secondary.emit('pointerup',{pointerId:2});assert(touch.getState().left);
primary.emit('pointerdown',{pointerId:3});assert.deepEqual(slots,['r','e']);
secondary.emit('click',{detail:0});assert.deepEqual(slots,['r','e','r']);
secondary.disabled=true;secondary.emit('pointerdown',{pointerId:4});secondary.emit('click',{detail:0});assert.equal(slots.length,3);
console.log('Passed: six spells, both directions, exact circle origins/timing, one shot per cast, interruptions, screen cleanup, distinct trajectories, 50% opacity, independent E/R touch controls.');
