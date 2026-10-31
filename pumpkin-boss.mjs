import {WORLD,requestHitFall} from './engine.mjs';
import {POLTAVA_LANDMARKS} from './parallax.mjs';
import {abilitySpell} from './spell-projectiles.mjs';
import {pumpkinBossPose,PUMPKIN_BOSS_ANIMATIONS} from './pumpkin-boss-rig.mjs';

export const PUMPKIN_ENCOUNTER=Object.freeze({x:POLTAVA_LANDMARKS[0].worldX+1100,left:-276,right:300,height:560,bodyRadius:34,inactiveAt:PUMPKIN_BOSS_ANIMATIONS.defeat.duration,defeatDuration:PUMPKIN_BOSS_ANIMATIONS.defeat.duration,cameraSeconds:1.2});
export function createPumpkinSequence(random=Math.random){
  const heroes=['slavik','dasha','katya'],unit=()=>Math.max(0,Math.min(.999999999,random()));
  for(let i=heroes.length-1;i>0;i--){const j=Math.floor(unit()*(i+1));[heroes[i],heroes[j]]=[heroes[j],heroes[i]];}
  return heroes.map(character=>({character,slot:unit()<.5?'e':'r'}));
}
export function pumpkinSpellIntersection(shot,from,to,bounds){
  const radiusX=shot.width*.34,radiusY=shot.width*.22;
  let enter=0,exit=1;
  for(const [a,b,min,max] of [[from.x,to.x,bounds.left-radiusX,bounds.right+radiusX],[from.y,to.y,bounds.top-radiusY,bounds.bottom+radiusY]]){
    const delta=b-a;
    if(Math.abs(delta)<1e-9){if(a<min||a>max)return null;continue;}
    let first=(min-a)/delta,last=(max-a)/delta;if(first>last)[first,last]=[last,first];
    enter=Math.max(enter,first);exit=Math.min(exit,last);if(enter>exit)return null;
  }
  if(enter<0||enter>1)return null;
  return {fraction:enter,x:from.x+(to.x-from.x)*enter,y:from.y+(to.y-from.y)*enter};
}

export function createPumpkinBoss({random=Math.random}={}){
  let sequence,progress,phase,animation,animationTime,clock,introduced,nextTaunt,nextHint,wrongHits,events,pending,impacts,impactId,arenaLocked,cameraFrom,cameraAge;
  const actor={character:'pumpkin',x:PUMPKIN_ENCOUNTER.x,y:0};
  const bounds={left:actor.x+PUMPKIN_ENCOUNTER.left,right:actor.x+PUMPKIN_ENCOUNTER.right,top:WORLD.groundY-PUMPKIN_ENCOUNTER.height,bottom:WORLD.groundY};
  const emit=(type,extra={})=>events.push({type,progress,...extra});
  function reset(){sequence=createPumpkinSequence(random);progress=0;phase='active';animation='idle';animationTime=0;clock=0;introduced=false;nextTaunt=0;nextHint=0;wrongHits=0;events=[];pending=[];impacts=[];impactId=0;arenaLocked=false;cameraFrom=null;cameraAge=0;}
  reset();
  function visible(view){return bounds.right>view.x&&bounds.left<view.x+view.width;}
  function near(player){return Math.abs(player.x-actor.x)<1150;}
  function react(state){animation=state;animationTime=0;}
  function advance(seconds,player,view){
    const dt=Math.max(0,Math.min(.05,Number.isFinite(seconds)?seconds:0));clock+=dt;animationTime+=dt;
    if(arenaLocked)cameraAge=Math.min(PUMPKIN_ENCOUNTER.cameraSeconds,cameraAge+dt);
    impacts=impacts.filter(effect=>(effect.age+=dt)<effect.duration);
    if(phase==='defeat'&&animationTime>=PUMPKIN_ENCOUNTER.inactiveAt){phase='inactive';arenaLocked=false;emit('defeated');}
    if(phase!=='active')return;
    if(!arenaLocked&&visible(view)){arenaLocked=true;cameraFrom=view.x;cameraAge=0;}
    if(animation!=='idle'&&animationTime>=4.8){animation='idle';animationTime=0;}
    if(!near(player)||!visible(view))return;
    if(!introduced){introduced=true;nextTaunt=clock+13;nextHint=clock+12;emit('intro');return;}
    if(clock>=nextHint){nextHint=clock+17;emit('hint',{next:{...sequence[progress]}});}
    else if(clock>=nextTaunt){nextTaunt=clock+10+random()*4;emit('taunt');}
  }
  function blockPlayers(players,beforePlayers,arenaLeft=null){
    if(phase==='inactive')return;
    for(const [id,player] of Object.entries(players)){
      if(arenaLocked&&arenaLeft!==null){player.x=Math.max(arenaLeft+80,player.x);if(player.jumpVelocity<0&&player.x<=arenaLeft+80)player.jumpVelocity=0;}
      const before=beforePlayers[id]??player,r=PUMPKIN_ENCOUNTER.bodyRadius;
      const min=bounds.left-r,max=bounds.right+r;
      if(Math.max(before.x,player.x)<min||Math.min(before.x,player.x)>max)continue;
      // The boss is taller than every allowed jump, so its whole body blocks
      // the lane. This clamp also applies while a child is temporarily immune.
      if(WORLD.groundY+Math.max(before.y,player.y)<bounds.top)continue;
      const side=before.x<=actor.x?-1:1;
      player.x=side<0?min-.01:max+.01;
      if(requestHitFall(player,side,150)){
        player.pumpkinHitPending=true;player.ghostHitPending=false;
        emit('contact',{character:id});
        if(phase==='active')react('anger');
      }
    }
  }
  function catchSpell(shot,from,to,view){
    if(phase!=='active'||!visible(view))return false;
    const hit=pumpkinSpellIntersection(shot,from,to,bounds);
    if(!hit)return false;
    pending.push({shot,hit});return true;
  }
  function resolveHits(){
    pending.sort((a,b)=>a.hit.fraction-b.hit.fraction||a.shot.id-b.shot.id);
    for(const {shot,hit} of pending){
      if(phase!=='active')break;
      const expected=sequence[progress],correct=shot.character===expected.character&&shot.spell.id===abilitySpell(expected.character,expected.slot).id;
      const result=correct?'correct':'wrong';
      impacts.push({id:++impactId,...hit,age:0,duration:correct?.85:.9,result,spell:shot.spell,width:shot.width,direction:shot.direction});
      if(correct){
        progress++;
        if(progress===3){phase='defeat';react('defeat');emit('defeating',{character:shot.character});}
        else{react('fear');emit('correct',{character:shot.character,next:{...sequence[progress]}});}
      }else{
        progress=0;wrongHits++;react('anger');emit('wrong',{character:shot.character,next:{...sequence[0]}});
      }
      nextHint=clock+13;nextTaunt=clock+15;
    }
    pending=[];
  }
  return {actor,bounds,reset,advance,blockPlayers,catchSpell,resolveHits,visible,near,
    lockArena(){if(phase!=='inactive'){arenaLocked=true;cameraFrom=null;cameraAge=PUMPKIN_ENCOUNTER.cameraSeconds;}},
    arenaLeft(width){return Math.max(0,bounds.right+45-width);},
    cameraLeft(width){const target=Math.max(0,bounds.right+45-width),t=cameraFrom===null?1:Math.min(1,cameraAge/PUMPKIN_ENCOUNTER.cameraSeconds),blend=t*t*(3-2*t);return cameraFrom===null?target:cameraFrom+(target-cameraFrom)*blend;},
    takeEvents(){const result=events;events=[];return result;},
    get phase(){return phase;},get animation(){return animation;},get animationTime(){return animationTime;},
    get progress(){return progress;},get wrongHits(){return wrongHits;},get blocking(){return phase!=='inactive';},
    get cameraLocked(){return arenaLocked;},
    get cameraReady(){return cameraFrom===null||cameraAge>=PUMPKIN_ENCOUNTER.cameraSeconds;},
    get cameraBlend(){const t=cameraFrom===null?1:Math.min(1,cameraAge/PUMPKIN_ENCOUNTER.cameraSeconds);return t*t*(3-2*t);},
    get pose(){return {...pumpkinBossPose(animation,animationTime),dx:0,dy:0,tilt:0};},
    get next(){return phase==='active'?{...sequence[progress]}:null;},get impacts(){return impacts;},
    get knownSteps(){return sequence.slice(0,progress).map(step=>({...step}));}
  };
}
