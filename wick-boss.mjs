import {WORLD,CHARACTERS,SLAVIK_ABILITY_MS,requestHitFall,requestJump} from './engine.mjs';
import {POLTAVA_LANDMARKS} from './parallax.mjs';
import {abilitySpell,spellOrigin} from './spell-projectiles.mjs';
import {pumpkinSpellIntersection} from './pumpkin-boss.mjs';
import {objectBossPose,OBJECT_BOSS_ANIMATIONS} from './object-boss-animation.mjs';

export const WICK_ENCOUNTER=Object.freeze({x:POLTAVA_LANDMARKS[3].worldX+450,left:-252,right:252,height:650,cameraSeconds:1.2,inactiveAt:OBJECT_BOSS_ANIMATIONS.defeat.duration,warning:1.05,speed:560,lowWidth:100,lowHeight:92,highWidth:150,highBottom:270,highTop:600,openingSeconds:3});
export const WICK_SEQUENCE=Object.freeze([['slavik','r'],['slavik','e'],['dasha','e'],['dasha','r'],['katya','e'],['katya','r']].map(([character,slot])=>Object.freeze({character,slot,spell:abilitySpell(character,slot)})));
export function wickAttackPattern(progress,random=Math.random,finale=false){
  if(finale)return ['jump','duck','jump','duck'];
  const count=2+Math.min(2,Math.floor(progress/2)),first=random()<.5?'jump':'duck';
  return Array.from({length:count},(_,i)=>i%2?(first==='jump'?'duck':'jump'):first);
}
const wickBlend=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
const wickHeight=p=>(p.mode==='crouch'?292:436)*.8*CHARACTERS[p.character].scale*(p.mode==='crouch'?(CHARACTERS[p.character].crouchScale??1):1);

export function createWickBoss({random=Math.random,previewEnding=false}={}){
  const actor={character:'wick',x:WICK_ENCOUNTER.x,y:0};
  const bounds={left:actor.x+WICK_ENCOUNTER.left,right:actor.x+WICK_ENCOUNTER.right,top:WORLD.groundY-WICK_ENCOUNTER.height,bottom:WORLD.groundY};
  let phase,turn,age,clock,progress,wrongHits,animation,animationTime,waves,impacts,events,pending,serial,pattern,emitted,cleared,seenActive,failed,arenaLocked,cameraFrom,cameraAge,introduced,started,reservation,recoverSeconds,nextTaunt,nextHint,controlled,castReadyAge;
  const emit=(type,extra={})=>events.push({type,progress,stage:stage(),next:WICK_SEQUENCE[progress]??null,...extra});
  const stage=()=>Math.min(3,Math.floor(progress/2)+1);
  const interval=()=>progress>=6?1.7:[2.0,1.85,1.7][stage()-1];
  const canHit=()=>phase==='active'&&turn==='opening'&&(age<WICK_ENCOUNTER.openingSeconds||!!reservation&&reservation.remaining>0);
  function reset(){phase=previewEnding?'defeat':'active';turn=previewEnding?'defeat':'intro';age=0;clock=0;progress=previewEnding?6:0;wrongHits=0;animation=previewEnding?'defeat':'idle';animationTime=0;waves=[];impacts=[];events=[];pending=[];serial=0;pattern=[];emitted=0;cleared=0;seenActive=0;failed=false;arenaLocked=false;cameraFrom=null;cameraAge=0;introduced=false;started=false;reservation=null;recoverSeconds=2.4;nextTaunt=15;nextHint=25;controlled='slavik';castReadyAge=0;}
  reset();
  const visible=view=>bounds.right>view.x&&bounds.left<view.x+view.width;
  const near=p=>Math.abs(p.x-actor.x)<1400;
  function react(state){animation=state;animationTime=0;}
  function beginSeries(){pattern=wickAttackPattern(progress,random,progress>=6);emitted=0;cleared=0;seenActive=0;failed=false;waves=[];reservation=null;turn='series';age=0;react('anger');emit(progress>=6?'finale':'series',{count:pattern.length});}
  function recover(seconds=2.4){turn='recover';age=0;reservation=null;recoverSeconds=seconds;}
  function advance(seconds,player,view,{combatReady=true,players=null}={}){
    const dt=Math.max(0,Math.min(.05,Number.isFinite(seconds)?seconds:0));animationTime+=dt;controlled=player.character;
    if(arenaLocked)cameraAge=Math.min(WICK_ENCOUNTER.cameraSeconds,cameraAge+dt);
    impacts=impacts.filter(i=>(i.age+=dt)<i.duration);
    if(phase==='defeat'&&animationTime>=WICK_ENCOUNTER.inactiveAt){phase='inactive';arenaLocked=false;emit('defeated');}
    if(phase!=='active')return;
    if(!arenaLocked&&visible(view)){arenaLocked=true;cameraFrom=view.x;cameraAge=0;}
    if(arenaLocked&&!introduced){introduced=true;emit('intro');}
    if(!arenaLocked||!combatReady)return;
    if(!started){started=true;age=0;}
    const party=players?Object.values(players):[player];
    castReadyAge=party.some(p=>p.mode==='ability')?0:Math.min(1,(castReadyAge??0)+dt);
    age+=dt;clock+=dt;if(reservation)reservation.remaining-=dt;
    if(animationTime>=4.8){animation='idle';animationTime=0;}
    for(const wave of waves){wave.beforeX=wave.x;wave.x-=WICK_ENCOUNTER.speed*dt;wave.age+=dt;}
    if(castReadyAge>=.8&&(turn==='intro'&&age>=17||turn==='recover'&&age>=recoverSeconds))beginSeries();
    if(turn==='series'&&emitted<pattern.length&&age>=WICK_ENCOUNTER.warning+emitted*interval()){
      const kind=pattern[emitted++];waves.push({id:++serial,kind,width:kind==='jump'?WICK_ENCOUNTER.lowWidth:WICK_ENCOUNTER.highWidth,x:bounds.left-22,beforeX:bounds.left-22,age:0,activeSeen:false,hit:new Set()});emit('attack',{kind,index:emitted,count:pattern.length});
    }
    if(turn==='opening'&&!canHit()){react('idle');recover();emit('missed');}
    if(clock>=nextHint){nextHint=clock+27;emit('hint');}
    else if(clock>=nextTaunt&&['intro','recover'].includes(turn)){nextTaunt=clock+15+random()*5;emit('taunt');}
  }
  function threatFor(player){
    if(phase!=='active'||turn!=='series')return null;
    const radius=32*.8*CHARACTERS[player.character].scale,candidates=[];
    for(const wave of waves){const half=wave.width/2+radius,tail=(wave.x-player.x+half)/WICK_ENCOUNTER.speed;if(tail>=-.06)candidates.push({kind:wave.kind,eta:(wave.x-player.x-half)/WICK_ENCOUNTER.speed,tail,id:wave.id});}
    if(emitted<pattern.length){const spawnIn=WICK_ENCOUNTER.warning+emitted*interval()-age;if(spawnIn<=WICK_ENCOUNTER.warning){const kind=pattern[emitted],half=(kind==='jump'?WICK_ENCOUNTER.lowWidth:WICK_ENCOUNTER.highWidth)/2+radius,delta=bounds.left-22-player.x;candidates.push({kind,eta:spawnIn+(delta-half)/WICK_ENCOUNTER.speed,tail:spawnIn+(delta+half)/WICK_ENCOUNTER.speed,id:'next'});}}
    return candidates.sort((a,b)=>a.eta-b.eta)[0]??null;
  }
  function dodgeFor(player){const threat=threatFor(player);return {crouch:!!threat&&threat.kind==='duck'&&threat.eta<=.65&&threat.tail>=-.06,jump:!!threat&&threat.kind==='jump'&&threat.eta<=.34&&threat.tail>=-.06};}
  function autoDodge(players,selected){for(const p of Object.values(players))if(p.character!==selected&&dodgeFor(p).jump&&!p.airborne&&p.mode!=='fall'&&p.mode!=='ability')requestJump(p,0,{inPlace:true});}
  function hurt(player,type,direction=-1){if(!requestHitFall(player,direction,130))return false;player.wickHitPending=true;player.halushunHitPending=false;player.eggHitPending=false;player.pumpkinHitPending=false;player.ghostHitPending=false;emit(type,{character:player.character});return true;}
  function applyHazards(players,beforePlayers,selected,view){
    if(phase!=='active'||turn!=='series')return;
    for(const wave of waves)for(const p of Object.values(players)){
      const before=beforePlayers[p.character]??p,radius=wave.width/2+32*.8*CHARACTERS[p.character].scale,a=before.x-wave.beforeX,b=p.x-wave.x,d=b-a;
      let first=0,last=1;if(Math.abs(d)<1e-9){if(Math.abs(a)>radius)continue;}else{first=(-radius-a)/d;last=(radius-a)/d;if(first>last)[first,last]=[last,first];first=Math.max(0,first);last=Math.min(1,last);if(first>last)continue;}
      const y1=before.y+(p.y-before.y)*first,y2=before.y+(p.y-before.y)*last;
      const safe=wave.kind==='jump'?p.airborne&&-Math.max(y1,y2)>WICK_ENCOUNTER.lowHeight:p.mode==='crouch'&&!p.airborne&&wickHeight(p)-Math.min(y1,y2)<WICK_ENCOUNTER.highBottom;
      if(p.character===selected){wave.activeSeen=true;if(!safe)failed=true;}
      if(!safe&&!wave.hit.has(p.character)){wave.hit.add(p.character);hurt(p,'hit');}
    }
    const remaining=[];for(const wave of waves){if(wave.x+wave.width/2<view.x-35){cleared++;if(wave.activeSeen)seenActive++;else failed=true;}else remaining.push(wave);}waves=remaining;
    if(emitted===pattern.length&&!waves.length&&cleared===pattern.length){
      if(failed||seenActive!==pattern.length){react('anger');recover();emit('failed',{character:selected});}
      else if(progress===6){phase='defeat';turn='defeat';react('defeat');emit('defeating');}
      else{turn='opening';age=0;reservation=null;react('fear');emit('opening');}
    }
  }
  function reserveCast(player){
    if(!canHit()||age>=WICK_ENCOUNTER.openingSeconds||reservation||player.facing<0)return false;
    const spell=abilitySpell(player.character,player.abilitySlot),origin=spellOrigin(player);if(!spell)return false;
    reservation={character:player.character,serial:player.abilitySerial,remaining:spell.launchMs/1000+Math.max(0,bounds.left-origin.x)/spell.speed+1.0};return true;
  }
  function blockPlayers(players,beforePlayers,left=null){
    if(phase==='inactive')return;
    for(const p of Object.values(players)){
      if(arenaLocked&&left!==null){p.x=Math.max(left+80,Math.min(bounds.right+45-80,p.x));if(p.x<=left+80&&p.jumpVelocity<0)p.jumpVelocity=0;}
      const before=beforePlayers[p.character]??p,min=bounds.left-34,max=bounds.right+34;if(Math.max(before.x,p.x)<min||Math.min(before.x,p.x)>max||WORLD.groundY+Math.max(before.y,p.y)<bounds.top)continue;
      const side=before.x<=actor.x?-1:1;p.x=side<0?min-.01:max+.01;if(hurt(p,'contact',side)&&p.character===controlled&&turn==='series')failed=true;
    }
  }
  function catchSpell(shot,from,to,view){if(phase!=='active'||!visible(view))return false;const hit=pumpkinSpellIntersection(shot,from,to,bounds);if(!hit)return false;pending.push({shot,hit});return true;}
  function resolveHits(){
    pending.sort((a,b)=>a.hit.fraction-b.hit.fraction||a.shot.id-b.shot.id);
    for(const {shot,hit} of pending){
      if(phase!=='active')break;
      const reserved=reservation&&reservation.character===shot.character&&reservation.serial===shot.castSerial,expected=WICK_SEQUENCE[progress];
      const correct=!!expected&&canHit()&&(age<WICK_ENCOUNTER.openingSeconds||reserved)&&shot.character===expected.character&&shot.spell.id===expected.spell.id;
      impacts.push({id:++serial,...hit,age:0,duration:.85,result:correct?'correct':'wrong',spell:shot.spell,width:shot.width,direction:shot.direction});
      const remainingCast=Math.max(0,SLAVIK_ABILITY_MS/1000-shot.spell.launchMs/1000-(shot.age??0));
      if(correct){const oldStage=stage();progress++;react('fear');recover(Math.max(2.4,remainingCast+.7));emit(progress===6?'last-seal':stage()!==oldStage?'stage-cleared':'correct',{character:shot.character,spell:shot.spell});}
      else{wrongHits++;react('anger');if(turn==='opening')recover(Math.max(2.4,remainingCast+.7));emit('wrong',{character:shot.character});}
    }
    pending=[];
  }
  return {actor,bounds,reset,advance,applyHazards,autoDodge,dodgeFor,threatFor,reserveCast,blockPlayers,catchSpell,resolveHits,visible,near,
    lockArena(){arenaLocked=true;cameraFrom=null;cameraAge=WICK_ENCOUNTER.cameraSeconds;},
    arenaLeft(width){return Math.max(0,bounds.right+45-width);},cameraLeft(width){const target=Math.max(0,bounds.right+45-width);return cameraFrom===null?target:cameraFrom+(target-cameraFrom)*wickBlend(cameraAge/WICK_ENCOUNTER.cameraSeconds);},
    takeEvents(){const out=events;events=[];return out;},get phase(){return phase;},get turn(){return turn;},get turnAge(){return age;},get stage(){return stage();},get progress(){return progress;},get wrongHits(){return wrongHits;},get blocking(){return phase!=='inactive';},
    get animation(){return animation;},get animationTime(){return animationTime;},get pose(){const p=objectBossPose('wick',animation,animationTime);if(phase==='active'&&turn==='series'){p.flameSway*=1+(stage()-1)*.18;p.glow*=1+(stage()-1)*.04;}return p;},
    get cameraLocked(){return arenaLocked;},get cameraReady(){return cameraFrom===null||cameraAge>=WICK_ENCOUNTER.cameraSeconds;},get cameraBlend(){return wickBlend(cameraAge/WICK_ENCOUNTER.cameraSeconds);},
    get vulnerable(){return canHit();},get castingGrace(){return !!reservation&&canHit()&&age>=WICK_ENCOUNTER.openingSeconds;},get next(){return WICK_SEQUENCE[progress]??null;},get knownSteps(){return [];},get impacts(){return impacts;},get waves(){return waves;},get pattern(){return [...pattern];},get emitted(){return emitted;},get failed(){return failed;}
  };
}

export function drawWickEffects(c,boss,view){
  if(boss.phase==='active'){
    const hint=boss.pattern[boss.emitted],warning=boss.turn==='series'&&hint&&boss.turnAge>=boss.emitted*[2,1.85,1.7][boss.stage-1];
    if(warning){c.save();c.shadowColor='#a2ffad';c.shadowBlur=24;c.fillStyle='rgba(151,255,173,.38)';c.beginPath();if(hint==='jump')c.ellipse(boss.actor.x,WORLD.groundY,200,15,0,0,Math.PI*2);else c.ellipse(boss.actor.x-83,WORLD.groundY-329,36,20,-.45,0,Math.PI*2);c.fill();c.restore();}
    c.save();c.strokeStyle='#aeffb150';c.lineWidth=2;
    for(let i=Math.floor(boss.progress/2);i<3;i++){const x=boss.actor.x-70+i*65,y=WORLD.groundY-505;c.beginPath();c.arc(x,y,19,0,Math.PI*2);c.stroke();c.beginPath();c.moveTo(x-8,y);c.lineTo(x+8,y);c.moveTo(x,y-9);c.lineTo(x,y+9);c.stroke();}c.restore();
  }
  for(const wave of boss.waves){
    if(wave.x+160<view.x||wave.x-160>view.x+view.width)continue;
    c.save();c.shadowColor='#9dffaf';c.shadowBlur=12;
    if(wave.kind==='jump'){
      const y=WORLD.groundY;c.fillStyle='#c5ffc6b8';c.beginPath();c.moveTo(wave.x-50,y);c.bezierCurveTo(wave.x-22,y-28,wave.x-40,y-83,wave.x+8,y-92);c.bezierCurveTo(wave.x-2,y-50,wave.x+45,y-51,wave.x+50,y);c.closePath();c.fill();
    }else{
      const top=WORLD.groundY-WICK_ENCOUNTER.highTop,bottom=WORLD.groundY-WICK_ENCOUNTER.highBottom,g=c.createLinearGradient(0,top,0,bottom);g.addColorStop(0,'#adffc400');g.addColorStop(.6,'#b5ffcf55');g.addColorStop(1,'#e1ffd79c');c.fillStyle=g;c.beginPath();c.moveTo(wave.x-75,bottom);c.bezierCurveTo(wave.x-110,top+170,wave.x-20,top,wave.x+15,top);c.bezierCurveTo(wave.x+85,top+80,wave.x+110,bottom-100,wave.x+75,bottom);c.closePath();c.fill();c.strokeStyle='#e3ffcfaa';c.lineWidth=3;c.beginPath();c.moveTo(wave.x-72,bottom);c.lineTo(wave.x+72,bottom);c.stroke();
    }
    c.shadowBlur=0;c.font='bold 34px system-ui';c.textAlign='center';c.fillStyle='#efffe5';c.fillText(wave.kind==='jump'?'↑':'↓',wave.x,WORLD.groundY-(wave.kind==='jump'?128:392));c.restore();
  }
}
