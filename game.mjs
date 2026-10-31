import {createPumpkinBoss} from './pumpkin-boss.mjs';
import {createBossArenaParty} from './boss-arena-party.mjs';
import {createPumpkinBossRig,PUMPKIN_BOSS} from './pumpkin-boss-rig.mjs';
import {createPumpkinDialogue} from './pumpkin-dialogue.mjs';
import {abilitySpell,createSpellProjectiles,createSpellProjectileRenderer,spellProjectilePose,SPELL_OPACITY} from './spell-projectiles.mjs';
import {createGirlsAbilityRig,drawGirlsCircle} from './girls-ability.mjs';
import {createSlavikAbilityRig,drawSlavikMagicCircle} from './slavik-ability.mjs';
import {createScreamerDirector} from './screamer.mjs';
import {createScreamerRig,SCREAMER_FLIGHT} from './screamer-rig.mjs';
import {createGhostHandsEnemies,ghostHandsLocalPose,GHOST_HANDS_LAYOUT,createGhostHandsRig,advanceGhostHands,nearestGhostTarget,applyGhostHandsContact} from './ghost-hands.mjs';
import {createPoltavaBackground,cameraLeft,POLTAVA_LANDMARKS} from './parallax.mjs';
import {DIALOGUE_DATA} from './dialogue-data.mjs';
import {createDialogueDirector} from './dialogue.mjs';
import {FALL_LAYOUTS,FALL_ANIMATION,requestFall,attemptAbility,WORLD,CHARACTERS,createState,step,selectCharacter,requestJump,requestTouchJump,noteActivity} from './engine.mjs';
import {createPhoneRig} from './phone-rig.mjs';
import {createTouchControls} from './controls.mjs';
import {createPartyFollowers} from './followers.mjs';

const canvas=document.getElementById('game');
const context=canvas.getContext('2d',{alpha:false});
const gameCard=document.getElementById('game-card');
const stage=document.getElementById('stage');
const status=document.getElementById('player-status');
const statusText=document.getElementById('status-text');
const loading=document.getElementById('loading');
const errorState=document.getElementById('error-state');
const leftButton=document.getElementById('move-left');
const rightButton=document.getElementById('move-right');
const jumpButton=document.getElementById('jump');
const forwardJumpButton=document.getElementById('jump-forward');
const crouchButton=document.getElementById('crouch');
const abilityButton=document.getElementById('ability');
const secondaryAbilityButton=document.getElementById('ability-secondary');
const fullscreenButton=document.getElementById('fullscreen');
const assetFiles={'screamer':'./assets/enemy-screamer.png','ghost-hands':'./assets/enemy-ghost-hands.png','dasha-fall':'./assets/dasha-fall-right.png','katya-fall':'./assets/katya-fall-right.png','slavik-fall':'./assets/slavik-fall-right.png','poltava-moon':'./assets/poltava-moon.png','poltava-far':'./assets/poltava-far.png','poltava-middle':'./assets/poltava-middle.png','poltava-ground':'./assets/poltava-ground.png','poltava-landmarks':'./assets/poltava-landmarks.png','slavik-walk':'./assets/slavik-walk-right.png','slavik-idle':'./assets/slavik-idle-right.png','dasha-walk':'./assets/dasha-walk-right.png','dasha-idle':'./assets/dasha-idle-right.png','katya-walk':'./assets/katya-walk-right.png','katya-idle':'./assets/katya-idle-right.png','slavik-crouch':'./assets/slavik-crouch-right.png','dasha-crouch':'./assets/dasha-crouch-right.png','katya-crouch':'./assets/katya-crouch-right.png','slavik-phone':'./assets/slavik-phone-right.png','dasha-phone':'./assets/dasha-phone-right.png','katya-phone':'./assets/katya-phone-right.png','katya-phone-rig':'./assets/katya-phone-rig.png','slavik-phone-rig':'./assets/slavik-phone-rig.png','dasha-phone-rig':'./assets/dasha-phone-rig.png','dasha-phone-arm':'./assets/dasha-phone-arm-full-rig.png'};
const characterButtons=Array.from(document.querySelectorAll('button[data-character]'));
Object.assign(assetFiles,{
  'pumpkin-boss':'./assets/enemy-pumpkin-boss.png',
  'spell-slavik-strength':'./assets/spell-slavik-strength.png','spell-slavik-calm':'./assets/spell-slavik-calm.png',
  'spell-dasha-pofih':'./assets/spell-dasha-pofih.png','spell-dasha-hatfu':'./assets/spell-dasha-hatfu.png',
  'spell-katya-claws':'./assets/spell-katya-claws.png','spell-katya-teeth':'./assets/spell-katya-teeth.png'
});
const images={};
let phoneRigs,poltavaBackground,ghostHandsRig,screamerRig,slavikAbilityRig,dashaAbilityRig,katyaAbilityRig,spellRenderer,pumpkinRig;
const screamers=createScreamerDirector();
const spells=createSpellProjectiles();
const boss=createPumpkinBoss();
const bossProgress=document.createElement('div');bossProgress.className='boss-status';bossProgress.hidden=true;bossProgress.setAttribute('role','status');bossProgress.setAttribute('aria-live','polite');stage.append(bossProgress);
function freshGhosts(){const left=boss.arenaLeft(1600),right=left+1600;return createGhostHandsEnemies().filter(e=>e.x+160<left||e.x-160>right).map(enemy=>({...enemy,pose:{lean:0,lift:0},warned:new Set(),hitFlash:0}));}
let ghosts=freshGhosts();
const testOptions=new URLSearchParams(window.location.search),handsTestMode=testOptions.get('test')==='hands';
const bossTestMode=testOptions.get('test')==='boss';if(bossTestMode)boss.lockArena();
const initialCharacter=(handsTestMode||bossTestMode)&&Object.hasOwn(CHARACTERS,testOptions.get('hero'))?testOptions.get('hero'):'slavik';
const mapPosition=document.getElementById('map-position');
const keys=new Set();
let touchControls;
function runStartingScene(){if(bossTestMode)return Object.fromEntries(Object.keys(CHARACTERS).map((id,index)=>[id,{x:boss.actor.x-900+index*250,facing:1}]));if(!ghosts.length)return DIALOGUE_DATA.scene.startingPositions;const first=(ghosts.find(enemy=>enemy.screen===Number(testOptions.get('screen')))||ghosts[0]).x;return handsTestMode?Object.fromEntries(Object.keys(CHARACTERS).map((id,index)=>[id,{x:id===initialCharacter?first-220:first-750+index*120,facing:1}])):DIALOGUE_DATA.scene.startingPositions;}
let startingScene=runStartingScene();
let startingPositions=Object.fromEntries(Object.entries(startingScene).map(([id,pose])=>[id,pose.x]));
const players=Object.fromEntries(Object.keys(CHARACTERS).map(id=>[id,{...createState(id),x:startingPositions[id],facing:startingScene[id].facing}]));
let state=players[initialCharacter];
const partyFollowers=createPartyFollowers();
const arenaParty=createBossArenaParty();let arenaWasLocked=false,pendingBossIntro=false;
function enteringArena(){return boss.cameraLocked&&(arenaParty.entering||!boss.cameraReady);}
partyFollowers.reset(players,initialCharacter);
let partyCameraDirection=0;
let ready=false;
let lastTime=0;
let lastStatus='';
let elapsedTime=0;
let speechCamera={x:0,y:0,width:1600,scale:1};
const speechBubble=document.getElementById('speech-bubble');
const speechText=document.getElementById('speech-text');
let speechLineId='',speechWidth=0,speechHeight=0,speechLayoutWidth=0;
function isSpeakerAvailable(id){
  if(id==='pumpkin')return ready&&boss.phase!=='inactive'&&boss.visible(speechCamera);
  const player=players[id];
  return ready&&!!player&&!player.airborne&&player.mode!=='fall'&&player.x>=speechCamera.x+20&&player.x<=speechCamera.x+speechCamera.width-20;
}
const dialogueDirector=createDialogueDirector({isAvailable:isSpeakerAvailable});
const pumpkinDialogue=createPumpkinDialogue(dialogueDirector,{isAvailable:isSpeakerAvailable});
function startChat(){if(enteringArena())return;if(boss.phase==='active'&&boss.near(state)){pumpkinDialogue.hint(boss.next,true);return;}dialogueDirector.startConversation('ambient',true);}
function heroSpeechRect(player,unit){
  if(player.character==='pumpkin')return {left:(boss.bounds.left-speechCamera.x)*unit,right:(boss.bounds.right-speechCamera.x)*unit,top:(boss.bounds.top-speechCamera.y)*unit,bottom:(WORLD.groundY-speechCamera.y)*unit,center:(boss.actor.x-speechCamera.x)*unit};
  const character=CHARACTERS[player.character];
  const poseScale=player.mode==='crouch'?(character.crouchScale??1):1;
  const scale=.8*character.scale*poseScale;
  const crown=player.mode==='fall'&&player.frame<7?FALL_LAYOUTS[player.character][player.frame].headBox[1]:player.mode==='crouch'?188:44;
  const center=(player.x-speechCamera.x)*unit;
  const half=(player.mode==='fall'?224:130)*scale*unit;
  return {left:center-half,right:center+half,top:(WORLD.groundY+player.y+(crown-480)*scale-speechCamera.y)*unit,bottom:(WORLD.groundY+player.y-speechCamera.y)*unit,center};
}
function drawSpeechBubble(){
  const line=dialogueDirector.getCurrent();
  if(!line){speechBubble.hidden=true;speechLineId='';return;}
  const player=line.speaker==='pumpkin'?boss.actor:players[line.speaker];
  if(line.id!==speechLineId){
    speechLineId=line.id;speechText.textContent=line.text;
    speechBubble.dataset.speaker=line.speaker;speechBubble.dataset.lineId=line.id;
    speechBubble.dataset.conversationId=line.conversationId??'';speechLayoutWidth=0;
  }
  speechBubble.hidden=false;
  const width=stage.clientWidth,height=stage.clientHeight;
  function measure(maxWidth){speechBubble.style.maxWidth=maxWidth+'px';speechWidth=speechBubble.offsetWidth;speechHeight=speechBubble.offsetHeight;}
  if(speechLayoutWidth!==width){measure(Math.min(280,width-16));speechLayoutWidth=width;}
  const unit=canvas.clientWidth/canvas.width*speechCamera.scale;
  const heroes=[...Object.values(players),boss.actor].map(p=>heroSpeechRect(p,unit)).filter(b=>b.right>0&&b.left<width);
  const speaker=heroSpeechRect(player,unit);
  const headX=speaker.center,headY=speaker.top;
  let left=Math.max(8,Math.min(width-speechWidth-8,headX-speechWidth/2));
  let top=headY-speechHeight-10,placement='above';
  // Keep the entire box above every intersecting character, including a
  // taller neighbour. A short screen can use an empty horizontal gap instead.
  for(const box of heroes)if(left<box.right+7&&left+speechWidth>box.left-7)top=Math.min(top,box.top-speechHeight-8);
  if(top<8){
    const ordered=[...heroes].sort((a,b)=>a.left-b.left),gaps=[];let edge=8;
    for(const box of ordered){if(box.left-8>edge)gaps.push({left:edge,right:box.left-8});edge=Math.max(edge,box.right+8);}
    if(edge<width-8)gaps.push({left:edge,right:width-8});
    const safe=gaps.filter(g=>g.right-g.left>=120).sort((a,b)=>Math.abs((a.left+a.right)/2-headX)-Math.abs((b.left+b.right)/2-headX));
    if(!safe.length){speechBubble.hidden=true;return;}
    const gap=safe[0];measure(Math.min(280,gap.right-gap.left));
    if(speechHeight>height-16){speechBubble.hidden=true;return;}
    left=Math.max(gap.left,Math.min(gap.right-speechWidth,headX-speechWidth/2));
    top=Math.max(8,Math.min(height-speechHeight-8,headY-speechHeight/2));
    placement=left+speechWidth<headX?'left':'right';
  }
  speechBubble.dataset.placement=placement;
  speechBubble.style.left=left+'px';speechBubble.style.top=top+'px';
  speechBubble.style.setProperty('--tail-left',Math.max(12,Math.min(speechWidth-12,headX-left))+'px');
  speechBubble.style.setProperty('--tail-top',Math.max(10,Math.min(speechHeight-10,headY-top))+'px');
}


function updateSize(){
  const bounds=canvas.getBoundingClientRect();
  const dpr=Math.min(window.devicePixelRatio||1,2);
  canvas.width=Math.round(bounds.width*dpr);
  canvas.height=Math.round(bounds.height*dpr);
}
new ResizeObserver(updateSize).observe(canvas);
updateSize();

function inputAxis(){
  const touch=touchControls?.getState();
  const left=keys.has('ArrowLeft')||keys.has('KeyA')||touch?.left;
  const right=keys.has('ArrowRight')||keys.has('KeyD')||touch?.right;
  leftButton.classList.toggle('is-held',left);
  rightButton.classList.toggle('is-held',right);
  return Number(!!right)-Number(!!left);
}
function inputCrouch(){const down=keys.has('ArrowDown')||keys.has('KeyS')||!!touchControls?.getState().crouch;crouchButton.classList.toggle('is-held',down);return down;}
function clearInputs(){keys.clear();touchControls?.clear();inputAxis();inputCrouch();}
function chooseCharacter(id){
  if(enteringArena())return;
  if(!Object.hasOwn(players,id))return;
  state=players[id];
  if(!selectCharacter(state,id))return;
  partyFollowers.select(players,id);
  clearInputs();
  for(const button of characterButtons)button.setAttribute('aria-pressed',String(button.dataset.character===id));
  for(const [slot,button] of [['e',abilityButton],['r',secondaryAbilityButton]]){
    const spell=abilitySpell(id,slot);button.disabled=false;button.dataset.hero=id;
    button.setAttribute('aria-label',CHARACTERS[id].name+': '+spell.name+' ('+slot.toUpperCase()+')');
    button.title=spell.name+' — '+slot.toUpperCase();button.querySelector('.button-caption').textContent=spell.name;button.querySelector('small').textContent=slot.toUpperCase();
  }
  canvas.setAttribute('aria-label',CHARACTERS[id].name+' у хелоуїнському містечку. Рух: стрілки або A та D. Стрибок: пробіл. Присісти: стрілка вниз або S. Здібності: E та R.');
  canvas.focus({preventScroll:true});
}
for(const button of characterButtons)button.addEventListener('click',()=>chooseCharacter(button.dataset.character));
function jumpActive(){
  if(!ready||enteringArena())return;
  requestJump(state,inputAxis());
  canvas.focus({preventScroll:true});
}
function abilityActive(slot='e'){
  if(!ready||enteringArena())return;
  const outcome=attemptAbility(state,slot);
  if(outcome==='blocked')return;
  state.lastAbilityOutcome=outcome;
  dialogueDirector.onEvent(state.character,outcome==='refused'?'ability-refused':'ability-'+slot,{priority:true});
}
document.getElementById('talk').addEventListener('click',startChat);
document.addEventListener('keydown',event=>{
  if(['KeyE','KeyR'].includes(event.code)&&!event.ctrlKey&&!event.metaKey&&!event.altKey){
    if(event.target instanceof Element&&event.target.closest('button,input,textarea,select,[contenteditable]'))return;
    event.preventDefault();const first=!keys.has(event.code);keys.add(event.code);if(first&&!event.repeat)abilityActive(event.code==='KeyR'?'r':'e');return;
  }

  if(event.code==='KeyT'&&!event.ctrlKey&&!event.metaKey&&!event.altKey){
    if(event.target instanceof Element&&event.target.closest('button,input,textarea,select,[contenteditable]'))return;
    event.preventDefault();if(!event.repeat)startChat();return;
  }

  if(['Enter','NumpadEnter'].includes(event.code)&&!event.ctrlKey&&!event.metaKey&&!event.altKey){
    if(event.target instanceof Element&&event.target.closest('button,input,textarea,select,[contenteditable]'))return;
    event.preventDefault();const first=!keys.has(event.code);keys.add(event.code);
    if(ready&&!enteringArena()&&first&&!event.repeat)requestFall(state);
    return;
  }
  if(event.code==='Space'&&!event.ctrlKey&&!event.metaKey&&!event.altKey){
    if(event.target instanceof Element&&event.target.closest('button'))return;
    event.preventDefault();keys.add(event.code);noteActivity(state);if(!event.repeat)jumpActive();return;
  }
  const characterKey={Digit1:'slavik',Digit2:'dasha',Digit3:'katya'}[event.code];
  if(characterKey&&!event.ctrlKey&&!event.metaKey&&!event.altKey){event.preventDefault();if(!event.repeat)chooseCharacter(characterKey);return;}
  if(['ArrowLeft','ArrowRight','KeyA','KeyD','ArrowDown','KeyS'].includes(event.code)&&!event.ctrlKey&&!event.metaKey&&!event.altKey){event.preventDefault();noteActivity(state);keys.add(event.code);}
});
document.addEventListener('keyup',event=>{if(keys.delete(event.code))event.preventDefault();});
window.addEventListener('blur',clearInputs);
document.addEventListener('visibilitychange',()=>{if(document.hidden)clearInputs();lastTime=0;});

touchControls=createTouchControls({left:leftButton,right:rightButton,crouch:crouchButton,jump:jumpButton,forward:forwardJumpButton,ability:abilityButton,'ability-secondary':secondaryAbilityButton},{
  onActivity:()=>noteActivity(state),
  onAbility:abilityActive,
  onChange:()=>{inputAxis();inputCrouch();},
  onJump:action=>{
    if(!ready||enteringArena())return;
    requestTouchJump(state,action,inputAxis());
  }
});
canvas.addEventListener('pointerdown',()=>{noteActivity(state);canvas.focus({preventScroll:true});});
document.getElementById('reset').addEventListener('click',()=>{const id=state.character;clearInputs();ghosts=freshGhosts();screamers.reset();spells.reset();boss.reset();pumpkinDialogue.reset();arenaParty.reset();arenaWasLocked=false;pendingBossIntro=false;if(bossTestMode)boss.lockArena();startingScene=runStartingScene();startingPositions=Object.fromEntries(Object.entries(startingScene).map(([hero,pose])=>[hero,pose.x]));for(const key of Object.keys(players))players[key]={...createState(key),x:startingPositions[key],facing:startingScene[key].facing};state=players[id];partyFollowers.reset(players,id);partyCameraDirection=0;dialogueDirector.reset();speechBubble.hidden=true;for(const enemy of ghosts){enemy.warned.clear();enemy.pose={lean:0,lift:0};enemy.hitFlash=0;}canvas.focus({preventScroll:true});});
document.getElementById('retry').addEventListener('click',()=>window.location.reload());

fullscreenButton.addEventListener('click',async()=>{
  try{if(document.fullscreenElement)await document.exitFullscreen();else await gameCard.requestFullscreen();canvas.focus({preventScroll:true});}catch{fullscreenButton.title='Повний екран недоступний у цьому вікні';}
});
document.addEventListener('fullscreenchange',()=>{const active=!!document.fullscreenElement;fullscreenButton.setAttribute('aria-pressed',String(active));fullscreenButton.setAttribute('aria-label',active?'Вийти з повного екрана':'Повний екран');clearInputs();updateSize();});
document.getElementById('exit-fullscreen').addEventListener('click',()=>document.exitFullscreen());

function draw(){
  stage.classList.toggle('clear-jump-view',Object.values(players).some(player=>player.airborne&&player.x<650));
  const ordinaryScale=Math.max(canvas.height/WORLD.height,canvas.width/WORLD.screenWidth),arenaScale=Math.min(canvas.height/WORLD.height,canvas.width/WORLD.screenWidth);
  const displayScale=boss.cameraLocked?ordinaryScale+(arenaScale-ordinaryScale)*boss.cameraBlend:ordinaryScale;
  const visibleWidth=canvas.width/displayScale;
  const baseCameraY=Math.max(0,WORLD.height-canvas.height/displayScale);
  const selectedHead=WORLD.groundY+state.y-(480-44)*.8*CHARACTERS[state.character].scale;
  const cameraY=boss.cameraLocked?Math.min(0,(WORLD.height-canvas.height/displayScale)/2):Math.min(baseCameraY,Math.max(0,selectedHead-24));
  const cameraX=boss.cameraLocked?boss.cameraLeft(visibleWidth):cameraLeft(state.x-partyCameraDirection*Math.min(160,visibleWidth*.12),visibleWidth,WORLD.width);
  stage.classList.toggle('is-exploring',cameraX>180);
  speechCamera={x:cameraX,y:cameraY,width:visibleWidth,scale:displayScale};
  context.setTransform(1,0,0,1,0,0);context.fillStyle='#11111b';context.fillRect(0,0,canvas.width,canvas.height);
  context.setTransform(displayScale,0,0,displayScale,-cameraX*displayScale,-cameraY*displayScale);
  context.imageSmoothingEnabled=true;
  const ambience=poltavaBackground.draw(context,cameraX,visibleWidth,{time:elapsedTime,cameraY,reducedMotion:window.matchMedia('(prefers-reduced-motion: reduce)').matches});
  canvas.dataset.batFlocks=ambience.visibleFlocks.join(',');canvas.dataset.batCount=String(ambience.batCount);
  const particles=window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:14;
  for(let i=0;i<particles;i++){
    const x=cameraX+(i*137.5+Math.sin(elapsedTime*.19+i*2)*28+1600)%1600;
    const y=470+(i*41)%290+Math.sin(elapsedTime*.35+i)*14;
    context.globalAlpha=.15+(.5+.5*Math.sin(elapsedTime*1.5+i))*.45;
    context.fillStyle='#ffcc82';context.beginPath();context.arc(x,y,1.2+(i%3)*.5,0,Math.PI*2);context.fill();
  }
  context.globalAlpha=1;
  for(const enemy of ghosts){
    if(enemy.x+140<cameraX||enemy.x-140>cameraX+visibleWidth)continue;
    if(enemy.hitFlash>0){context.fillStyle='rgba(100,255,158,'+(enemy.hitFlash*.35)+')';context.beginPath();context.ellipse(enemy.x,WORLD.groundY+2,110,17,0,0,Math.PI*2);context.fill();}
    const frame=ghostHandsRig.render(ghostHandsLocalPose(enemy)),layout=GHOST_HANDS_LAYOUT;
    context.save();context.translate(enemy.x,WORLD.groundY);context.scale(enemy.flipX?-1:1,1);
    context.drawImage(frame,-layout.anchorX*enemy.scale,-layout.anchorY*enemy.scale,layout.width*enemy.scale,layout.height*enemy.scale);context.restore();
  }
  if(boss.visible(speechCamera)){
    context.fillStyle='rgba(10,9,25,.4)';context.beginPath();context.ellipse(boss.actor.x,WORLD.groundY+1,260,17,0,0,Math.PI*2);context.fill();
    const frame=pumpkinRig.render(boss.animation,boss.animationTime,boss.pose),scale=PUMPKIN_BOSS.scale;
    context.drawImage(frame,boss.actor.x-PUMPKIN_BOSS.anchorX*scale,WORLD.groundY-PUMPKIN_BOSS.anchorY*scale,PUMPKIN_BOSS.width*scale,PUMPKIN_BOSS.height*scale);
  }
  function drawPlayer(player){
    const selected=player===state;
    const elevation=Math.max(0,-player.y);
    const shadowScale=1-Math.min(elevation/260,.45);
    context.fillStyle='rgba(12,12,26,'+(.3-Math.min(elevation/900,.14))+')';context.beginPath();context.ellipse(player.x,WORLD.groundY+1,(player.mode==='walk'?49:41)*shadowScale,9*shadowScale,0,0,Math.PI*2);context.fill();
    if(selected){context.strokeStyle='rgba(255,208,145,.65)';context.lineWidth=1.6;context.beginPath();context.ellipse(player.x,WORLD.groundY+3,47,11,0,0,Math.PI*2);context.stroke();}
    const character=CHARACTERS[player.character];
    const poseScale=player.mode==='crouch'?(character.crouchScale??1):1;
    const scale=.8*character.scale*poseScale;
    context.save();context.translate(player.x,WORLD.groundY+player.y);context.scale(player.facing*scale,scale);
    const animation=(player.mode==='jump'||player.mode==='land')?'walk':player.mode;
    const sheet=images[player.character+'-'+animation];
    if(player.mode==='ability'){context.save();context.translate(-192,-480);const time=player.abilityTime/1000,pose=(player.character==='slavik'?slavikAbilityRig:player.character==='dasha'?dashaAbilityRig:katyaAbilityRig).draw(context,time);if(player.character==='slavik')drawSlavikMagicCircle(context,time,pose.ring);else drawGirlsCircle(context,time,pose.ring,player.character);context.restore();}
    else if(player.mode==='fall'){if(player.frame===7)context.drawImage(images[player.character+'-idle'],0,0,384,512,-192,-480,384,512);else for(const part of FALL_LAYOUTS[player.character][player.frame].segments){const d=part.destination;context.drawImage(sheet,...part.crop,d[0]-224,d[1]-480,d[2],d[3]);}}
    else if(player.mode==='phone'&&player.frame>=3)context.drawImage(phoneRigs[player.character].render(player),-192,-480);
    else if(player.mode==='crouch')context.drawImage(sheet,0,0,384,512,-192,-480,384,512);
    else context.drawImage(sheet,player.frame%4*384,Math.floor(player.frame/4)*512,384,512,-192,-480,384,512);
    context.restore();
  }
  for(const player of Object.values(players))if(player!==state)drawPlayer(player);
  drawPlayer(state);
  for(const ghost of screamers.ghosts){
    if(ghost.x<cameraX-650||ghost.x>cameraX+visibleWidth+650)continue;
    context.save();context.translate(ghost.x,ghost.y);context.scale(SCREAMER_FLIGHT.scale,SCREAMER_FLIGHT.scale);
    context.drawImage(screamerRig.render(ghost.age),-SCREAMER_FLIGHT.anchorX,-SCREAMER_FLIGHT.anchorY);context.restore();
  }
  spellRenderer.draw(context,spells.projectiles,{reducedMotion:window.matchMedia('(prefers-reduced-motion: reduce)').matches});
  spellRenderer.drawImpacts(context,boss.impacts);
  bossProgress.hidden=!boss.visible(speechCamera)||!boss.near(state);
  const bossLabel=enteringArena()?'Герої заходять на арену…':boss.phase==='inactive'?'Гарбузич · Шлях вільний':boss.phase==='defeat'?'Гарбузич · Світло згасає…':'Гарбузич · Правильних поспіль: '+boss.progress+' / 3';
  if(bossProgress.textContent!==bossLabel)bossProgress.textContent=bossLabel;
  const character=CHARACTERS[state.character];
  const action=state.mode==='ability'?' чарує: «'+abilitySpell(state.character,state.abilitySlot).name+'»':state.mode==='fall'?(state.frame<4?' падає на попку':' піднімається'):state.airborne?(Math.abs(state.jumpVelocity)<1?' стрибає на місці':state.jumpVelocity>0?' стрибає праворуч':' стрибає ліворуч'):state.mode==='phone'?(state.phoneReturning?' ховає смартфон':state.frame<4?' дістає смартфон':' свайпає смартфон'):state.mode==='crouch'?' присідає':state.mode==='land'?' приземляється':state.mode==='walk'?(state.facing===1?' іде праворуч':' іде ліворуч'):' відпочиває';
  const nextStatus=character.name+action;
  if(nextStatus!==lastStatus){statusText.textContent=nextStatus;status.classList.toggle('is-walking',state.mode==='walk');lastStatus=nextStatus;}
  canvas.dataset.mode=state.mode;canvas.dataset.facing=String(state.facing);canvas.dataset.x=String(Math.round(state.x));
  canvas.dataset.character=state.character;canvas.dataset.abilityMs=String(Math.round(state.abilityTime??0));
  canvas.dataset.abilitySlot=state.abilitySlot??'e';canvas.dataset.spellOpacity=String(SPELL_OPACITY);
  canvas.dataset.abilityOutcome=state.lastAbilityOutcome??'';
  canvas.dataset.boss=JSON.stringify({name:'Гарбузич',x:boss.actor.x,phase:boss.phase,animation:boss.animation,progress:boss.progress,wrongHits:boss.wrongHits,blocking:boss.blocking,cameraLocked:boss.cameraLocked,cameraReady:boss.cameraReady,entering:enteringArena(),known:boss.knownSteps.map(s=>({hero:s.character,name:abilitySpell(s.character,s.slot).name})),impacts:boss.impacts.map(i=>i.result)});
  canvas.dataset.spells=JSON.stringify(spells.projectiles.map(p=>{const pose=spellProjectilePose(p);return {id:p.id,hero:p.character,name:p.spell.name,direction:p.direction,x:Math.round(pose.x),y:Math.round(pose.y)};}));
  canvas.dataset.handClears=String(screamers.clears);canvas.dataset.screamers=JSON.stringify(screamers.ghosts.map(g=>({x:Math.round(g.x),direction:-1})));canvas.dataset.screamerHits=String(Object.values(players).reduce((n,p)=>n+(p.screamerHits??0),0));
  const closestGhost=ghosts.length?ghosts.reduce((a,b)=>Math.abs(a.x-state.x)<Math.abs(b.x-state.x)?a:b):null;
  canvas.dataset.ghostHandsX=closestGhost?String(Math.round(closestGhost.x)):'';canvas.dataset.ghostHandsScale='3';
  canvas.dataset.ghostHandsPositions=ghosts.map(enemy=>enemy.x.toFixed(2)).join(',');canvas.dataset.ghostHandsMirrors=ghosts.map(enemy=>enemy.flipX?'mirrored':'normal').join(',');canvas.dataset.ghostHitCount=String(state.ghostHitCount??0);
  canvas.dataset.ghostNearest=closestGhost?nearestGhostTarget(players,closestGhost).character:'';
  canvas.dataset.cameraX=String(Math.round(cameraX));canvas.dataset.mapWidth=String(WORLD.width);
  canvas.dataset.parallaxOffsets=[.14,.5,1].map(rate=>(cameraX*rate).toFixed(2)).join(',');
  const screenNumber=Math.max(1,Math.min(WORLD.screens,Math.floor(state.x/WORLD.screenWidth)+1));
  const nearby=POLTAVA_LANDMARKS.find(place=>Math.abs(place.worldX-state.x)<850);
  const mapLabel=(nearby?nearby.name:'Полтава')+' · '+screenNumber+' / '+WORLD.screens;
  if(mapPosition.textContent!==mapLabel)mapPosition.textContent=mapLabel;
  canvas.dataset.y=String(Math.round(state.y));canvas.dataset.airborne=String(state.airborne);
  canvas.dataset.idleMs=String(Math.round(state.idleTime));canvas.dataset.frame=String(state.frame);
  canvas.dataset.idleDelayMs=String(Math.round(state.idleDelay));canvas.dataset.phoneDurationMs=String(Math.round(state.phoneDuration));canvas.dataset.phoneMs=String(Math.round(state.phoneTime));
  canvas.dataset.phoneCharacters=Object.values(players).filter(player=>player.mode==='phone').map(player=>player.character).join(',');
  canvas.dataset.party=JSON.stringify(Object.fromEntries(Object.entries(players).map(([id,p])=>[id,{x:Math.round(p.x),y:Math.round(p.y),mode:p.mode,hits:p.ghostHitCount,frame:p.frame}])));
  canvas.dataset.following=String(partyFollowers.enabled);canvas.dataset.followOrder=partyFollowers.order.join(',');canvas.dataset.followWaiting=JSON.stringify(partyFollowers.waiting);
  forwardJumpButton.dataset.facing=String(state.facing);
  drawSpeechBubble();
}
function loop(now){
  const seconds=lastTime?Math.min((now-lastTime)/1000,.05):0;
  lastTime=now;elapsedTime+=seconds;
  if(ready){const axis=inputAxis(),crouch=inputCrouch(),controlHeld=keys.size>0||touchControls.getState().active;
  const beforePlayers=Object.fromEntries(Object.entries(players).map(([id,p])=>[id,{x:p.x,y:p.y,mode:p.mode,airborne:p.airborne}]));
  boss.advance(seconds,state,speechCamera);
  const arenaWidth=canvas.width/Math.min(canvas.height/WORLD.height,canvas.width/WORLD.screenWidth);
  if(boss.cameraLocked!==arenaWasLocked){
    partyFollowers.reset(players,state.character);arenaParty.reset();arenaWasLocked=boss.cameraLocked;
    if(boss.cameraLocked){clearInputs();arenaParty.beginEntry(players,{x:boss.arenaLeft(arenaWidth),width:arenaWidth});}
  }
  if(!enteringArena())step(state,axis,seconds,crouch,controlHeld);
  if(boss.cameraLocked){
    const width=arenaWidth,left=boss.arenaLeft(width),view={x:left,width};
    const clearFrom=arenaParty.entering?Math.min(left,...Object.values(players).map(p=>p.x)):left;
    ghosts=ghosts.filter(e=>e.x+160<clearFrom||e.x-160>left+width);
    if(arenaParty.entering)arenaParty.updateEntry(players,seconds);else arenaParty.update(players,state.character,view,seconds);
    boss.blockPlayers(players,beforePlayers,arenaParty.entering?null:left);
  }else{
    partyFollowers.update(players,state.character,ghosts,seconds);boss.blockPlayers(players,beforePlayers);
  }
  partyCameraDirection+=((partyFollowers.enabled?partyFollowers.direction:0)-partyCameraDirection)*(1-Math.exp(-seconds*3));
  for(const player of Object.values(players)){
    const before=beforePlayers[player.character],previous=before.mode;
    for(const enemy of ghosts)if(applyGhostHandsContact(player,before,enemy))enemy.hitFlash=1;
    if(elapsedTime<2)continue;
    if(previous==='fall'&&player.mode!=='fall'){if(player.pumpkinHitPending){player.pumpkinHitPending=false;dialogueDirector.onEvent(player.character,'boss-contact',{priority:true});}else if(player.ghostHitPending){player.ghostHitPending=false;dialogueDirector.onEvent(player.character,'hands-hit',{priority:true});}else dialogueDirector.onEvent(player.character,'fall');}
    else if(previous==='land'&&player.mode!=='land')dialogueDirector.onEvent(player.character,'jump');
    else if(previous!==player.mode&&['walk','crouch','phone'].includes(player.mode))dialogueDirector.onEvent(player.character,player.mode);
  }
  for(const enemy of ghosts){
    const nearest=nearestGhostTarget(players,enemy);advanceGhostHands(enemy.pose,elapsedTime+enemy.phase,nearest.x,enemy.x,seconds);enemy.hitFlash=Math.max(0,enemy.hitFlash-seconds*2.5);
    const distance=Math.abs(state.x-enemy.x),approaching=(enemy.x-state.x)*state.facing>0;
    if(approaching&&distance<450&&distance>155&&!enemy.warned.has(state.character)&&dialogueDirector.onEvent(state.character,'hands',{priority:true}))enemy.warned.add(state.character);
  }
  screamers.observe(players,beforePlayers,state.character,ghosts,speechCamera);
  screamers.advance(players,beforePlayers,seconds,speechCamera);
  spells.advance(seconds,speechCamera,(shot,from,to)=>boss.catchSpell(shot,from,to,speechCamera));spells.observe(players);boss.resolveHits();
  for(const event of boss.takeEvents()){if(event.type==='intro'&&enteringArena())pendingBossIntro=true;else pumpkinDialogue.handle(event);}
  if(pendingBossIntro&&!enteringArena()){pendingBossIntro=false;pumpkinDialogue.handle({type:'intro'});}
  for(const ghost of screamers.ghosts){
    if(ghost.commented||dialogueDirector.getCurrent()?.trigger==='screamer')continue;
    const speakers=Object.values(players).filter(p=>isSpeakerAvailable(p.character)&&ghost.x-p.x>-80&&ghost.x-p.x<620)
      .sort((a,b)=>Number(b===state)-Number(a===state)||Math.abs(ghost.x-a.x)-Math.abs(ghost.x-b.x));
    if(speakers.length&&dialogueDirector.onEvent(speakers[0].character,'screamer',{priority:true}))ghost.commented=true;
  }
  dialogueDirector.advance(seconds*1000);draw();}
  requestAnimationFrame(loop);
}
function loadImage(src){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('Asset failed: '+src));image.src=src;});}

Promise.all(Object.entries(assetFiles).map(async([name,path])=>{images[name]=await loadImage(path);})).then(()=>{
  phoneRigs=Object.fromEntries(Object.keys(CHARACTERS).map(id=>[id,createPhoneRig(id,images[id+'-phone-rig'],images[id+'-phone'],images[id+'-phone-arm']??images[id+'-phone-rig'])]));
  poltavaBackground=createPoltavaBackground(images);
  slavikAbilityRig=createSlavikAbilityRig(images['slavik-idle']);
  dashaAbilityRig=createGirlsAbilityRig(images['dasha-idle'],'dasha');
  katyaAbilityRig=createGirlsAbilityRig(images['katya-idle'],'katya');
  spellRenderer=createSpellProjectileRenderer(images);
  pumpkinRig=createPumpkinBossRig(images['pumpkin-boss']);
  screamerRig=createScreamerRig(images.screamer);
  ghostHandsRig=createGhostHandsRig(images['ghost-hands'],{resolution:6});
  const phaseAtStart={frame:state.frame,elapsed:state.elapsed};chooseCharacter(initialCharacter);Object.assign(state,phaseAtStart);
  ready=true;loading.hidden=true;draw();canvas.focus({preventScroll:true});
}).catch(error=>{loading.hidden=true;errorState.hidden=false;console.error(error);});
requestAnimationFrame(loop);
