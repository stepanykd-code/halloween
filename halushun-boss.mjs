import {WORLD,CHARACTERS,SLAVIK_ABILITY_MS,requestHitFall} from './engine.mjs';
import {POLTAVA_LANDMARKS} from './parallax.mjs';
import {abilitySpell} from './spell-projectiles.mjs';
import {pumpkinSpellIntersection} from './pumpkin-boss.mjs';
import {objectBossPose,OBJECT_BOSS_ANIMATIONS} from './object-boss-animation.mjs';

export const HALUSHUN_ENCOUNTER=Object.freeze({x:POLTAVA_LANDMARKS[2].worldX+450,left:-368,right:368,height:395,cameraSeconds:1.2,inactiveAt:OBJECT_BOSS_ANIMATIONS.defeat.duration,steamSpeed:560,steamWidth:180,steamBottom:270,steamTop:600,burstInterval:.95});
export const HALUSHUN_MENU=Object.freeze(['slavik','dasha','katya'].flatMap(character=>['e','r'].map(slot=>Object.freeze({character,slot,spell:abilitySpell(character,slot)}))));
export function halushunHeroHeight(player){const c=CHARACTERS[player.character],crouch=player.mode==='crouch';return (crouch?292:436)*.8*c.scale*(crouch?(c.crouchScale??1):1);}
const halushunBlend=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export function createHalushunBoss({random=Math.random}={}){
  const actor={character:'halushun',x:HALUSHUN_ENCOUNTER.x,y:0};
  const bounds={left:actor.x+HALUSHUN_ENCOUNTER.left,right:actor.x+HALUSHUN_ENCOUNTER.right,top:WORLD.groundY-HALUSHUN_ENCOUNTER.height,bottom:WORLD.groundY};
  let phase,animation,animationTime,turn,age,clock,completed,pendingFlavor,failed,burstCount,emitted,cleared,seenActive,windup,events,pending,impacts,waves,serial,arenaLocked,cameraFrom,cameraAge,introduced,nextTaunt,nextHint,nextChat;
  const emit=(type,extra={})=>events.push({type,progress:completed.size,next:missing()[0]??null,...extra});
  const missing=()=>HALUSHUN_MENU.filter(entry=>!completed.has(entry.spell.id));
  function reset(){phase='active';animation='idle';animationTime=0;turn='hungry';age=0;clock=0;completed=new Set();pendingFlavor=null;failed=false;burstCount=0;emitted=0;cleared=0;seenActive=0;windup=1.25;events=[];pending=[];impacts=[];waves=[];serial=0;arenaLocked=false;cameraFrom=null;cameraAge=0;introduced=false;nextTaunt=13;nextHint=24;nextChat=43;}
  reset();
  const visible=view=>bounds.right>view.x&&bounds.left<view.x+view.width;
  const near=player=>Math.abs(player.x-actor.x)<1400;
  function react(state){animation=state;animationTime=0;}
  function advance(seconds,player,view,{combatReady=true}={}){
    const dt=Math.max(0,Math.min(.05,Number.isFinite(seconds)?seconds:0));animationTime+=dt;
    if(arenaLocked)cameraAge=Math.min(HALUSHUN_ENCOUNTER.cameraSeconds,cameraAge+dt);
    impacts=impacts.filter(i=>(i.age+=dt)<i.duration);
    if(phase==='defeat'&&animationTime>=HALUSHUN_ENCOUNTER.inactiveAt){phase='inactive';arenaLocked=false;emit('defeated');}
    if(phase!=='active')return;
    if(!arenaLocked&&visible(view)){arenaLocked=true;cameraFrom=view.x;cameraAge=0;}
    if(arenaLocked&&!introduced){introduced=true;emit('intro');}
    if(!arenaLocked||!combatReady)return;
    age+=dt;clock+=dt;
    if(animationTime>=4.8){animation='idle';animationTime=0;}
    for(const wave of waves){wave.beforeX=wave.x;wave.x-=HALUSHUN_ENCOUNTER.steamSpeed*dt;wave.age+=dt;}
    if(turn==='windup'&&age>=windup){turn='steam';age=0;react('anger');}
    if(turn==='steam'&&emitted<burstCount&&age+1e-8>=emitted*HALUSHUN_ENCOUNTER.burstInterval){
      emitted++;waves.push({id:++serial,x:bounds.left-22,beforeX:bounds.left-22,age:0,hit:new Set(),activeSeen:false});emit('burst',{index:emitted,total:burstCount});
    }
    if(turn==='recover'&&age>=1.4){turn='hungry';age=0;react('idle');}
    if(clock>=nextHint&&turn==='hungry'){nextHint=clock+23;emit('hint',{next:hintFor(player.character)});}
    else if(clock>=nextChat&&turn==='hungry'){nextChat=clock+35;emit('chat');}
    else if(clock>=nextTaunt&&turn==='hungry'){nextTaunt=clock+12+random()*5;emit('taunt');}
  }
  function hintFor(character){const pool=missing();return pool.find(e=>e.character===character)??pool[0]??null;}
  function hurt(player,type,direction=-1){
    if(requestHitFall(player,direction,130)){player.halushunHitPending=true;player.eggHitPending=false;player.pumpkinHitPending=false;player.ghostHitPending=false;emit(type,{character:player.character});return true;}return false;
  }
  function applyHazards(players,beforePlayers,controlled,view){
    if(phase!=='active'||turn!=='steam')return;
    for(const wave of waves)for(const player of Object.values(players)){
      const before=beforePlayers[player.character]??player,radius=HALUSHUN_ENCOUNTER.steamWidth/2+32*.8*CHARACTERS[player.character].scale;
      const a=before.x-wave.beforeX,b=player.x-wave.x,d=b-a;
      let enter=0,exit=1;
      if(Math.abs(d)<1e-9){if(Math.abs(a)>radius)continue;}
      else{enter=(-radius-a)/d;exit=(radius-a)/d;if(enter>exit)[enter,exit]=[exit,enter];enter=Math.max(0,enter);exit=Math.min(1,exit);if(enter>exit)continue;}
      const y1=before.y+(player.y-before.y)*enter,y2=before.y+(player.y-before.y)*exit;
      const head=halushunHeroHeight(player)-Math.min(y1,y2),feet=-Math.max(y1,y2);
      const safe=player.mode==='crouch'&&!player.airborne&&head<HALUSHUN_ENCOUNTER.steamBottom;
      if(player.character===controlled){wave.activeSeen=true;if(!safe)failed=true;}
      if(!safe&&head>=HALUSHUN_ENCOUNTER.steamBottom&&feet<=HALUSHUN_ENCOUNTER.steamTop&&!wave.hit.has(player.character)){wave.hit.add(player.character);hurt(player,'steam-hit');}
    }
    const left=view?.x??bounds.right+45-1600;
    const remaining=[];
    for(const wave of waves){if(wave.x+HALUSHUN_ENCOUNTER.steamWidth/2<left-35){cleared++;if(wave.activeSeen)seenActive++;else failed=true;}else remaining.push(wave);}waves=remaining;
    if(emitted===burstCount&&!waves.length&&cleared===burstCount){
      const character=pendingFlavor.character;
      if(!failed&&seenActive===burstCount){
        completed.add(pendingFlavor.spell.id);
        if(completed.size===HALUSHUN_MENU.length){phase='defeat';turn='defeat';react('defeat');emit('defeating',{character});}
        else{turn='recover';age=0;react('fear');emit('success',{character,spell:pendingFlavor.spell});}
      }else{turn='recover';age=0;react('anger');emit('failed',{character:controlled});}
      pendingFlavor=null;
    }
  }
  function blockPlayers(players,beforePlayers,arenaLeft=null){
    if(phase==='inactive')return;
    for(const player of Object.values(players)){
      if(arenaLocked&&arenaLeft!==null){player.x=Math.max(arenaLeft+80,Math.min(bounds.right+45-80,player.x));if(player.x<=arenaLeft+80&&player.jumpVelocity<0)player.jumpVelocity=0;}
      const before=beforePlayers[player.character]??player,min=bounds.left-34,max=bounds.right+34;
      if(Math.max(before.x,player.x)<min||Math.min(before.x,player.x)>max||WORLD.groundY+Math.max(before.y,player.y)<bounds.top)continue;
      const side=before.x<=actor.x?-1:1;player.x=side<0?min-.01:max+.01;
      if(hurt(player,'contact',side)&&turn==='hungry')react('anger');
    }
  }
  function catchSpell(shot,from,to,view){
    if(phase!=='active'||!visible(view)||!HALUSHUN_MENU.some(e=>e.spell.id===shot.spell.id))return false;
    const hit=pumpkinSpellIntersection(shot,from,to,bounds);if(!hit)return false;pending.push({shot,hit});return true;
  }
  function resolveHits(){
    pending.sort((a,b)=>a.hit.fraction-b.hit.fraction||a.shot.id-b.shot.id);
    for(const {shot,hit} of pending){
      if(phase!=='active')break;
      impacts.push({id:++serial,...hit,target:{x:actor.x-200,y:WORLD.groundY-150},age:0,duration:.85,result:'absorbed',spell:shot.spell,width:shot.width,direction:shot.direction});
      if(turn!=='hungry'){emit('extra-fed',{character:shot.character});continue;}
      if(completed.has(shot.spell.id)){emit('duplicate',{character:shot.character,next:hintFor(shot.character)});continue;}
      pendingFlavor=HALUSHUN_MENU.find(e=>e.spell.id===shot.spell.id);failed=false;emitted=0;cleared=0;seenActive=0;waves=[];
      burstCount=Math.floor(completed.size/2)+1;
      // Let even a very close, slow cast finish before ducking is required.
      const remainingCast=Math.max(0,SLAVIK_ABILITY_MS/1000-shot.spell.launchMs/1000-(shot.age??0));
      windup=Math.max(1.25,remainingCast+1.0);turn='windup';age=0;react('anger');emit('fed',{character:shot.character,spell:shot.spell,total:burstCount});
    }
    pending=[];
  }
  return {actor,bounds,reset,advance,applyHazards,blockPlayers,catchSpell,resolveHits,visible,near,hintFor,
    lockArena(){arenaLocked=true;cameraFrom=null;cameraAge=HALUSHUN_ENCOUNTER.cameraSeconds;},
    arenaLeft(width){return Math.max(0,bounds.right+45-width);},
    cameraLeft(width){const target=Math.max(0,bounds.right+45-width);return cameraFrom===null?target:cameraFrom+(target-cameraFrom)*halushunBlend(cameraAge/HALUSHUN_ENCOUNTER.cameraSeconds);},
    takeEvents(){const out=events;events=[];return out;},
    get phase(){return phase;},get turn(){return turn;},get turnAge(){return age;},get progress(){return completed.size;},get wrongHits(){return 0;},get blocking(){return phase!=='inactive';},
    get animation(){return animation;},get animationTime(){return animationTime;},get pose(){const p=objectBossPose('halushun',animation,animationTime);if(turn==='windup'||turn==='steam')p.butterAngle=.026*Math.sin(age*28);return p;},
    get cameraLocked(){return arenaLocked;},get cameraReady(){return cameraFrom===null||cameraAge>=HALUSHUN_ENCOUNTER.cameraSeconds;},get cameraBlend(){return halushunBlend(cameraAge/HALUSHUN_ENCOUNTER.cameraSeconds);},
    get requiresCrouch(){return phase==='active'&&(turn==='windup'||turn==='steam');},get waves(){return waves;},get impacts(){return impacts;},get missing(){return missing();},get knownSteps(){return [];},get next(){return missing()[0]??null;},
    get completedSpells(){return [...completed];},get pendingSpell(){return pendingFlavor?.spell??null;},get burstCount(){return burstCount;},get emitted(){return emitted;},get failed(){return failed;}
  };
}

export function drawHalushunEffects(c,boss,view){
  if(boss.requiresCrouch){
    const pulse=.4+.25*Math.sin(boss.turnAge*25),x=boss.actor.x-180,y=WORLD.groundY-354;
    c.save();c.fillStyle=`rgba(255,228,145,${pulse})`;c.shadowColor='#ffe28e';c.shadowBlur=16;c.beginPath();c.ellipse(x,y,52,12,0,0,Math.PI*2);c.fill();c.restore();
  }
  const bottom=WORLD.groundY-HALUSHUN_ENCOUNTER.steamBottom,top=WORLD.groundY-HALUSHUN_ENCOUNTER.steamTop,height=bottom-top;
  for(const wave of boss.waves){
    if(wave.x+150<view.x||wave.x-150>view.x+view.width)continue;
    c.save();const gradient=c.createLinearGradient(0,top,0,bottom);gradient.addColorStop(0,'#ffe5b500');gradient.addColorStop(.45,'#fff3ce48');gradient.addColorStop(.9,'#fff3ce80');gradient.addColorStop(1,'#ffdc9d80');c.fillStyle=gradient;
    c.beginPath();c.moveTo(wave.x-90,bottom);c.bezierCurveTo(wave.x-145,bottom-height*.3,wave.x-55,top+20,wave.x+20,top);c.bezierCurveTo(wave.x+75,top+40,wave.x+115,bottom-70,wave.x+90,bottom);c.closePath();c.fill();
    c.strokeStyle='#fff0c4a0';c.lineWidth=3;c.beginPath();c.moveTo(wave.x-87,bottom);c.lineTo(wave.x+87,bottom);c.stroke();
    for(let i=0;i<5;i++){const y=bottom-28-i*height*.16,x=wave.x+Math.sin(wave.age*6+i*1.7)*16;c.strokeStyle=i%2?'#fff6dd65':'#ffe1a954';c.lineWidth=5;c.beginPath();c.ellipse(x,y,35+i*4,14+i*2,-.2,wave.age+i,wave.age+i+Math.PI*1.4);c.stroke();}c.restore();
  }
}
