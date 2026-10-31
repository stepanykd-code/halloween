import {WORLD,CHARACTERS,requestHitFall,requestJump} from './engine.mjs';
import {POLTAVA_LANDMARKS} from './parallax.mjs';
import {abilitySpell,spellOrigin} from './spell-projectiles.mjs';
import {pumpkinSpellIntersection} from './pumpkin-boss.mjs';
import {eggBossPose,EGG_BOSS_ANIMATIONS} from './egg-boss-rig.mjs';

export const EGG_ENCOUNTER=Object.freeze({x:POLTAVA_LANDMARKS[1].worldX+350,left:-218,right:216,height:650,cameraSeconds:1.2,inactiveAt:EGG_BOSS_ANIMATIONS.defeat.duration,counterSeconds:2,waveSpeed:500,waveWidth:104,waveHeight:104,warningSeconds:1.05});
const eggBlend=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export function createEggBoss({random=Math.random}={}){
  const actor={character:'egg',x:EGG_ENCOUNTER.x,y:0};
  const bounds={left:actor.x+EGG_ENCOUNTER.left,right:actor.x+EGG_ENCOUNTER.right,top:WORLD.groundY-EGG_ENCOUNTER.height,bottom:WORLD.groundY};
  let phase,animation,animationTime,turn,age,clock,progress,wrongHits,events,pending,impacts,returns,waves,serial,arenaLocked,cameraFrom,cameraAge,introduced,started,bluffs,firstAttack,nextHint,nextTaunt,reservation;
  const emit=(type,extra={})=>events.push({type,progress,...extra});
  function reset(){phase='active';animation='idle';animationTime=0;turn='waiting';age=0;clock=0;progress=0;wrongHits=0;events=[];pending=[];impacts=[];returns=[];waves=[];serial=0;arenaLocked=false;cameraFrom=null;cameraAge=0;introduced=false;started=false;bluffs=0;firstAttack=true;nextHint=33;nextTaunt=12;reservation=null;}
  reset();
  const visible=view=>bounds.right>view.x&&bounds.left<view.x+view.width;
  const near=player=>Math.abs(player.x-actor.x)<1300;
  const vulnerable=()=>phase==='active'&&turn==='counter'&&(age<EGG_ENCOUNTER.counterSeconds||!!reservation&&reservation.remaining>0);
  function react(state){animation=state;animationTime=0;}
  function openCounter(){turn='counter';age=0;reservation=null;react('fear');emit('opening');}
  function chooseAction(){
    age=0;
    if(firstAttack||bluffs>=2||random()<.6){firstAttack=false;bluffs=0;turn='windup';react('anger');emit('warning');}
    else{bluffs++;turn='bluff';react(random()<.55?'fear':'idle');emit('bluff');}
  }
  function advance(seconds,player,view,{combatReady=true}={}){
    const dt=Math.max(0,Math.min(.05,Number.isFinite(seconds)?seconds:0));animationTime+=dt;
    if(arenaLocked)cameraAge=Math.min(EGG_ENCOUNTER.cameraSeconds,cameraAge+dt);
    impacts=impacts.filter(effect=>(effect.age+=dt)<effect.duration);
    if(phase==='defeat'&&animationTime>=EGG_ENCOUNTER.inactiveAt){phase='inactive';arenaLocked=false;emit('defeated');}
    if(phase!=='active')return;
    if(!arenaLocked&&visible(view)){arenaLocked=true;cameraFrom=view.x;cameraAge=0;}
    if(arenaLocked&&!introduced){introduced=true;emit('intro');}
    if(!arenaLocked||!combatReady)return;
    if(!started){started=true;age=0;}
    clock+=dt;age+=dt;if(reservation)reservation.remaining-=dt;
    if(animationTime>=4.8){animation='idle';animationTime=0;}
    for(const wave of waves){wave.beforeX=wave.x;wave.x-=EGG_ENCOUNTER.waveSpeed*dt;wave.age+=dt;}
    for(const shot of returns){shot.beforeX=shot.x;shot.x+=shot.direction*shot.speed*dt;shot.age+=dt;}
    returns=returns.filter(s=>s.age<5&&s.x>view.x-300&&s.x<view.x+view.width+300);
    if(turn==='waiting'&&age>=18||turn==='recover'&&age>=5.5||turn==='bluff'&&age>=4.6)chooseAction();
    else if(turn==='windup'&&age>=EGG_ENCOUNTER.warningSeconds){
      waves.push({id:++serial,x:bounds.left-24,beforeX:bounds.left-24,age:0,hit:new Set()});turn='wave';age=0;react('anger');emit('wave');
    }else if(turn==='counter'&&!vulnerable()){turn='recover';age=0;reservation=null;react('idle');emit('missed');}
    if(clock>=nextHint){nextHint=clock+23;emit('hint');}
    else if(clock>=nextTaunt&&['waiting','bluff','recover'].includes(turn)){nextTaunt=clock+13+random()*4;emit('taunt');}
  }
  function reserveCast(player){
    if(!vulnerable()||age>=EGG_ENCOUNTER.counterSeconds||reservation)return false;
    const spell=abilitySpell(player.character,player.abilitySlot),origin=spellOrigin(player);
    if(!spell||player.facing<0)return false;
    // The two-second input opportunity includes slow casts and travel time.
    // Only this already-started spell extends the current opening.
    reservation={character:player.character,serial:player.abilitySerial,remaining:spell.launchMs/1000+Math.max(0,bounds.left-origin.x)/spell.speed+1.0};
    return true;
  }
  function autoJump(players,controlled){
    if(phase!=='active')return;
    for(const player of Object.values(players)){
      if(player.character===controlled||player.airborne||player.mode==='fall'||player.mode==='ability')continue;
      const radius=34*.8*CHARACTERS[player.character].scale;
      const threshold=EGG_ENCOUNTER.waveWidth/2+radius+EGG_ENCOUNTER.waveSpeed*.34;
      if(waves.some(w=>w.x>player.x&&w.x-player.x<=threshold))requestJump(player,0,{inPlace:true});
    }
  }
  function hurt(player,direction,type){
    if(requestHitFall(player,direction,130)){
      player.eggHitPending=true;player.pumpkinHitPending=false;player.ghostHitPending=false;
      emit(type,{character:player.character});return true;
    }
    return false;
  }
  function sweptTouch(from,to,centerFrom,centerTo,radius){
    const a=from.x-centerFrom,b=to.x-centerTo,d=b-a;
    if(Math.abs(d)<1e-9)return Math.abs(a)<=radius?[0,1]:null;
    let enter=(-radius-a)/d,exit=(radius-a)/d;if(enter>exit)[enter,exit]=[exit,enter];
    enter=Math.max(0,enter);exit=Math.min(1,exit);return enter<=exit?[enter,exit]:null;
  }
  function applyHazards(players,beforePlayers){
    if(phase!=='active')return;
    for(const wave of waves)for(const player of Object.values(players)){
      if(wave.hit.has(player.character))continue;
      const before=beforePlayers[player.character]??player,radius=EGG_ENCOUNTER.waveWidth/2+34*.8*CHARACTERS[player.character].scale;
      const range=sweptTouch(before,player,wave.beforeX,wave.x,radius);if(!range)continue;
      const feet=t=>before.y+(player.y-before.y)*t;
      if(Math.max(feet(range[0]),feet(range[1]))>-EGG_ENCOUNTER.waveHeight){wave.hit.add(player.character);hurt(player,-1,'wave-hit');}
    }
    for(const shot of returns)for(const player of Object.values(players)){
      if(shot.hit.has(player.character))continue;
      const before=beforePlayers[player.character]??player,range=sweptTouch(before,player,shot.beforeX,shot.x,shot.width*.27+30);
      if(!range)continue;
      const top=y=>WORLD.groundY+y-348*CHARACTERS[player.character].scale,bottom=y=>WORLD.groundY+y;
      const y=before.y+(player.y-before.y)*range[0];
      if(shot.y+shot.width*.2>=top(y)&&shot.y-shot.width*.2<=bottom(y)){shot.hit.add(player.character);hurt(player,shot.direction,'reflection-hit');}
    }
    if(waves.length){
      const last=Math.min(...Object.values(players).map(p=>p.x));
      waves=waves.filter(w=>w.x+EGG_ENCOUNTER.waveWidth/2+65>=last);
      if(!waves.length&&turn==='wave')openCounter();
    }
  }
  function blockPlayers(players,beforePlayers,arenaLeft=null){
    if(phase==='inactive')return;
    for(const player of Object.values(players)){
      if(arenaLocked&&arenaLeft!==null){player.x=Math.max(arenaLeft+80,Math.min(bounds.right+45-80,player.x));if(player.x<=arenaLeft+80&&player.jumpVelocity<0)player.jumpVelocity=0;}
      const before=beforePlayers[player.character]??player,min=bounds.left-34,max=bounds.right+34;
      if(Math.max(before.x,player.x)<min||Math.min(before.x,player.x)>max)continue;
      if(WORLD.groundY+Math.max(before.y,player.y)<bounds.top)continue;
      const side=before.x<=actor.x?-1:1;player.x=side<0?min-.01:max+.01;
      hurt(player,side,'contact');
    }
  }
  function catchSpell(shot,from,to,view){
    if(phase!=='active'||!visible(view))return false;
    const hit=pumpkinSpellIntersection(shot,from,to,bounds);if(!hit)return false;
    pending.push({shot,hit});return true;
  }
  function resolveHits(){
    pending.sort((a,b)=>a.hit.fraction-b.hit.fraction||a.shot.id-b.shot.id);
    for(const {shot,hit} of pending){
      if(phase!=='active')break;
      const reserved=reservation&&reservation.character===shot.character&&reservation.serial===shot.castSerial;
      const correct=vulnerable()&&(age<EGG_ENCOUNTER.counterSeconds||reserved);
      impacts.push({id:++serial,...hit,age:0,duration:correct?.85:.9,result:correct?'correct':'wrong',spell:shot.spell,width:shot.width,direction:shot.direction});
      if(correct){
        progress++;reservation=null;waves=[];returns=[];age=0;
        if(progress>=3){phase='defeat';turn='defeat';react('defeat');emit('defeating',{character:shot.character});}
        else{turn='recover';react('fear');emit('correct',{character:shot.character});}
      }else{
        wrongHits++;if(turn!=='counter')react('anger');
        returns.push({id:++serial,reflected:true,spell:shot.spell,width:shot.width*.78,x:bounds.left-36,beforeX:bounds.left-36,y:hit.y,direction:-1,speed:440,age:0,hit:new Set()});
        emit('reflected',{character:shot.character});
      }
    }
    pending=[];
  }
  return {actor,bounds,reset,advance,autoJump,applyHazards,blockPlayers,catchSpell,resolveHits,reserveCast,visible,near,
    lockArena(){arenaLocked=true;cameraFrom=null;cameraAge=EGG_ENCOUNTER.cameraSeconds;},
    arenaLeft(width){return Math.max(0,bounds.right+45-width);},
    cameraLeft(width){const target=Math.max(0,bounds.right+45-width);return cameraFrom===null?target:cameraFrom+(target-cameraFrom)*eggBlend(cameraAge/EGG_ENCOUNTER.cameraSeconds);},
    takeEvents(){const out=events;events=[];return out;},
    get phase(){return phase;},get turn(){return turn;},get turnAge(){return age;},get animation(){return animation;},get animationTime(){return animationTime;},
    get pose(){return eggBossPose(animation,animationTime);},get progress(){return progress;},get wrongHits(){return wrongHits;},get blocking(){return phase!=='inactive';},
    get cameraLocked(){return arenaLocked;},get cameraReady(){return cameraFrom===null||cameraAge>=EGG_ENCOUNTER.cameraSeconds;},get cameraBlend(){return eggBlend(cameraAge/EGG_ENCOUNTER.cameraSeconds);},
    get vulnerable(){return vulnerable();},get counterRemaining(){return vulnerable()?Math.max(0,EGG_ENCOUNTER.counterSeconds-age):0;},get castingGrace(){return !!reservation&&vulnerable()&&age>=EGG_ENCOUNTER.counterSeconds;},
    get ribbon(){return phase!=='active'||vulnerable()?0:turn==='windup'?.65+.35*Math.sin(age*28):.18;},
    get impacts(){return impacts;},get waves(){return waves;},get returns(){return returns;},get knownSteps(){return [];},get next(){return null;}
  };
}

export function drawEggBossEffects(c,boss){
  const {x}=boss.actor,s=.52;
  c.save();c.translate(x-640*s,WORLD.groundY-1268*s);c.scale(s,s);
  // Trace only the existing ribbon; the hat and shell never change position.
  c.beginPath();c.moveTo(439,273);c.bezierCurveTo(568,237,770,291,891,370);c.lineTo(887,420);c.bezierCurveTo(725,365,559,338,419,327);c.closePath();
  c.fillStyle=boss.ribbon?`rgba(201,130,255,${boss.ribbon*.65})`:'rgba(13,10,28,.72)';
  c.shadowColor='#dc96ff';c.shadowBlur=boss.ribbon*30;c.fill();c.shadowBlur=0;
  if(boss.vulnerable){
    c.strokeStyle='#fff1bf';c.lineWidth=5;c.shadowColor='#fff1bf';c.shadowBlur=12;c.globalAlpha=.65+.25*Math.sin(boss.turnAge*9);
    for(const [dx,dy] of [[760,590],[850,850],[650,1110]]){c.beginPath();c.moveTo(dx,dy);c.lineTo(dx-22,dy+38);c.lineTo(dx+8,dy+51);c.lineTo(dx-12,dy+83);c.stroke();}
  }
  c.restore();
  for(const wave of boss.waves){
    c.save();c.translate(wave.x,WORLD.groundY);c.shadowColor='#ce9bff';c.shadowBlur=16;
    const g=c.createLinearGradient(0,-EGG_ENCOUNTER.waveHeight,0,5);g.addColorStop(0,'#f2d6ff');g.addColorStop(.5,'#c080e5cc');g.addColorStop(1,'#603cad22');c.fillStyle=g;
    c.beginPath();c.moveTo(-52,0);c.bezierCurveTo(-24,-42,-43,-92,8,-104);c.bezierCurveTo(-6,-53,54,-60,52,0);c.closePath();c.fill();
    c.strokeStyle='#f7deff';c.lineWidth=3;c.beginPath();c.moveTo(-38,-5);c.quadraticCurveTo(-10,-32,-16,-70);c.stroke();c.restore();
  }
}
