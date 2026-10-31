import assert from 'node:assert/strict';
import {createState,attemptAbility,requestAbility,requestJump,requestFall,DASHA_ABILITY_REFUSAL_CHANCE} from '../engine.mjs';
import {createSpellProjectiles} from '../spell-projectiles.mjs';
import {createDialogueDirector} from '../dialogue.mjs';
import {DIALOGUE_DATA} from '../dialogue-data.mjs';

assert.equal(DASHA_ABILITY_REFUSAL_CHANCE,.25);
for(const slot of ['e','r']){
  let refusals=0;
  // A fixed uniform sample verifies the exact probability boundary without
  // flaky statistical tests or changing the live game's random source.
  for(let i=0;i<100;i++){
    const player=createState('dasha'),spells=createSpellProjectiles();
    const result=attemptAbility(player,slot,()=>(i+.5)/100);
    if(result==='refused'){
      refusals++;assert.equal(player.mode,'idle');assert.equal(player.abilitySerial,undefined);
      spells.observe({dasha:player});assert.equal(spells.projectiles.length,0);
      assert.equal(attemptAbility(player,slot,()=>.25),'started','Refusal does not lock the next attempt');
    }else{assert.equal(result,'started');assert.equal(player.mode,'ability');assert.equal(player.abilitySlot,slot);}
  }
  assert.equal(refusals,25);
  for(const hero of ['slavik','katya'])assert.equal(attemptAbility(createState(hero),slot,()=>{throw Error('Only Dasha rolls');}),'started');
}
for(const mode of ['jump','fall','ability','invalid-slot']){
  const player=createState('dasha');
  if(mode==='jump')requestJump(player,0);
  if(mode==='fall')requestFall(player);
  if(mode==='ability')requestAbility(player);
  assert.equal(attemptAbility(player,mode==='invalid-slot'?'q':'e',()=>{throw Error('Blocked action must not roll');}),'blocked');
}
const phone=createState('dasha');phone.mode='phone';phone.idleTime=15000;
assert.equal(attemptAbility(phone,'e',()=>0),'refused');assert.equal(phone.mode,'idle');assert.equal(phone.idleTime,0);

for(const hero of ['slavik','dasha','katya'])for(const trigger of ['ability-e','ability-r']){
  const lines=DIALOGUE_DATA.lines.filter(line=>line.speaker===hero&&line.trigger===trigger);
  assert.equal(lines.length,4);assert(lines.every(line=>line.text.length<=60));
  const dialogue=createDialogueDirector({random:()=>.99});
  dialogue.startConversation('intro');dialogue.advance(1);
  assert(dialogue.onEvent(hero,trigger,{priority:true}));const first=dialogue.advance(1);
  assert.equal(first.speaker,hero);assert.equal(first.trigger,trigger,'Ability feedback overrides other speech, including Slavik silence chance');
  assert(!dialogue.onEvent(hero,'hands',{priority:true}),'Nearby warning cannot immediately erase ability feedback');
  assert(dialogue.onEvent(hero,trigger,{priority:true}));assert.notEqual(dialogue.advance(1).id,first.id);
  assert(dialogue.onEvent(hero,'hands-hit',{priority:true}));assert.equal(dialogue.advance(1).trigger,'hands-hit');
}
assert.equal(DIALOGUE_DATA.lines.filter(line=>line.trigger==='ability-refused').length,8);
const refusal=createDialogueDirector({random:()=>0});assert(refusal.onEvent('dasha','ability-refused',{priority:true}));
assert.equal(refusal.advance(1).trigger,'ability-refused');
console.log('Passed: exact 25% boundary for E/R; other heroes unaffected; blocked attempts never roll; refusals emit no spell and allow retry; 32 voiced-text-ready reactions; feedback priority, distinct lines, hit interruption.');
