import assert from 'node:assert/strict';
import {DIALOGUE_DATA} from '../dialogue-data.mjs';
import {createDialogueDirector,speechDuration} from '../dialogue.mjs';
const all=[...DIALOGUE_DATA.lines,...DIALOGUE_DATA.conversations.flatMap(c=>c.turns)];
assert.equal(new Set(all.map(line=>line.id)).size,all.length);
for(const line of all){assert(DIALOGUE_DATA.profiles[line.speaker]);assert(line.text.trim());assert(!/[<>]/.test(line.text));assert(speechDuration(line.text)>=2600);}
assert.equal(DIALOGUE_DATA.profiles.slavik.nickname,'SlaVStaR');assert.equal(DIALOGUE_DATA.profiles.dasha.nickname,'PurpleDog');assert(DIALOGUE_DATA.profiles.katya.aliases.includes('Чорна пантера'));
for(const id of ['slavik','dasha','katya'])assert.equal(DIALOGUE_DATA.lines.filter(l=>l.speaker===id&&l.trigger==='phone').length,12);
for(const id of ['slavik','dasha','katya']){
 assert.equal(DIALOGUE_DATA.lines.filter(l=>l.speaker===id&&l.trigger==='screamer').length,5);
 const ghosts=createDialogueDirector({random:()=>0});
 assert(ghosts.onEvent(id,'screamer',{priority:true}));const first=ghosts.advance(1);
 assert.equal(first.speaker,id);assert.equal(first.trigger,'screamer');
 assert(ghosts.onEvent(id,'screamer',{priority:true}));assert.notEqual(ghosts.advance(1).id,first.id);
}
const scene=DIALOGUE_DATA.scene.startingPositions;
assert(scene.slavik.x<scene.dasha.x&&scene.dasha.x<scene.katya.x);
assert(scene.katya.x-scene.dasha.x>=180);
assert(scene.katya.x-scene.dasha.x<scene.dasha.x-scene.slavik.x);
assert.deepEqual([scene.slavik.facing,scene.dasha.facing,scene.katya.facing],[1,-1,-1]);
assert(Math.abs(Object.values(scene).reduce((s,p)=>s+p.x,0)/3-800)<50);
assert.equal(DIALOGUE_DATA.conversations.filter(c=>c.trigger==='intro').length,1);
assert(DIALOGUE_DATA.conversations.find(c=>c.trigger==='intro').turns.some(l=>l.text.includes('Полтаві')));
const d=createDialogueDirector({random:()=>0});
assert(d.startConversation('intro'));let seen=[],last='';
for(let i=0;i<2000;i++){const line=d.advance(50);if(line&&line.id!==last){seen.push(line);last=line.id;}}
assert(seen.some(l=>l.speaker==='slavik'));assert(seen.some(l=>l.speaker==='dasha'));assert(seen.some(l=>l.speaker==='katya'));
for(let i=1;i<seen.length;i++)assert(seen[i].startedAt>=seen[i-1].until,'speakers overlap');
let available=true;const event=createDialogueDirector({random:()=>0,isAvailable:()=>available});
assert(event.onEvent('katya','fall'));const first=event.advance(1);assert.equal(first.speaker,'katya');assert.equal(event.onEvent('dasha','fall'),false);
available=false;assert.equal(event.advance(1),null);event.reset();available=true;assert.equal(event.getCurrent(),null);
const far=createDialogueDirector({isAvailable:id=>id==='slavik',random:()=>0});assert.equal(far.startConversation('intro'),false);
assert(far.onEvent('slavik','fall'));assert.equal(far.advance(1).speaker,'slavik');
const repeat=createDialogueDirector({random:()=>0});repeat.startConversation('ambient',true);const a=repeat.advance(1).conversationId;repeat.startConversation('ambient',true);const b=repeat.advance(1).conversationId;assert.notEqual(a,b);
console.log(`Passed: ${all.length} unique voiced-text-ready lines, speaker metadata, serialized conversations, reading durations, event cooldown, unavailable/offscreen speakers, reset and no consecutive dialogue repeats.`);
