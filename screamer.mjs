import {WORLD,CHARACTERS,requestHitFall} from './engine.mjs';
import {SCREAMER_FLIGHT,screamerWave} from './screamer-rig.mjs';

export function screamerContact(ghost,beforeGhost,player,before){
 if(player.mode==='fall')return false;
 let enter=0,exit=1;
 function clip(a,b){const delta=b-a;if(Math.abs(delta)<1e-9)return a>=0;const root=-a/delta;if(delta>0)enter=Math.max(enter,root);else exit=Math.min(exit,root);return enter<=exit;}
 const a=beforeGhost.x-before.x,b=ghost.x-player.x;
 if(!clip(a+62,b+62)||!clip(62-a,62-b))return false;
 const scale=.8*CHARACTERS[player.character].scale;
 const top=p=>WORLD.groundY+p.y-(480-(p.mode==='crouch'?188:44))*scale*(p.mode==='crouch'?(CHARACTERS[player.character].crouchScale??1):1);
 return clip(beforeGhost.y+46-top(before),ghost.y+46-top(player))&&clip(WORLD.groundY+before.y-beforeGhost.y+42,WORLD.groundY+player.y-ghost.y+42)&&enter<=exit;
}

export function createScreamerDirector(random=Math.random){
 let clears=0,serial=0,flights=new Map(),ghosts=[];
 function reset(){clears=0;serial=0;flights.clear();ghosts=[];}
 function spawn(view,leader){ghosts.push({id:++serial,x:Math.max(view.x+view.width+200,leader.x+460),y:480,age:0,touched:new Set()});}
 function observe(players,beforePlayers,controlledId,enemies,view){
  for(const [id,player] of Object.entries(players)){
   const before=beforePlayers[id];
   if(!flights.has(id)&&(before.airborne||player.airborne))flights.set(id,{start:before.x,controlled:id===controlledId&&before.airborne&&before.mode==='jump'});
   const flight=flights.get(id);if(!flight)continue;
   if(player.mode==='fall'){flights.delete(id);continue;}
   if(player.airborne)continue;
   flights.delete(id);
   if(!flight.controlled||id!==controlledId)continue;
   for(const enemy of enemies){
    const radius=enemy.halfWidth+18,start=flight.start-enemy.x,end=player.x-enemy.x;
    if(Math.abs(start)<=radius||Math.abs(end)<=radius||start*end>=0)continue;
    clears++;
    if(clears===2||(clears>2&&random()<.5))spawn(view,players[controlledId]);
   }
  }
 }
 function advance(players,beforePlayers,seconds,view){
  const dt=Math.max(0,Math.min(.05,seconds));
  for(const ghost of ghosts){
   const before={x:ghost.x,y:ghost.y};ghost.age+=dt;ghost.x-=SCREAMER_FLIGHT.speed*dt;ghost.y=480+screamerWave(ghost.age);
   for(const [id,player] of Object.entries(players)){
    if(ghost.touched.has(id)||!screamerContact(ghost,before,player,beforePlayers[id]))continue;
    if(requestHitFall(player,-1,0)){ghost.touched.add(id);player.screamerHits=(player.screamerHits??0)+1;}
   }
  }
  const left=Math.min(view.x,...Object.values(players).map(p=>p.x))-650;
  ghosts=ghosts.filter(ghost=>ghost.x>left);
 }
 return {reset,observe,advance,get clears(){return clears;},get ghosts(){return ghosts;}};
}
