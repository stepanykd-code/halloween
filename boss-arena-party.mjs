import {step,WORLD} from './engine.mjs';

export const BOSS_ARENA_PARTY=Object.freeze({separation:195,speed:WORLD.speed,edge:80});
export function createBossArenaParty(){
  let goals={},entering=false,entryGoals={};
  function beginEntry(players,view){
    const order=Object.values(players).sort((a,b)=>a.x-b.x);
    entryGoals=Object.fromEntries(order.map((p,i)=>[p.character,view.x+[130,365,680][i]]));entering=true;
  }
  function updateEntry(players,seconds){
    const dt=Math.max(0,Math.min(.05,seconds)),spacing=BOSS_ARENA_PARTY.separation;
    const order=Object.values(players).sort((a,b)=>b.x-a.x);
    for(const player of order){
      if(player.airborne||player.mode==='fall'||player.mode==='ability'){step(player,0,dt);continue;}
      const distance=entryGoals[player.character]-player.x,dir=Math.sign(distance);
      let allowed=Math.min(Math.abs(distance),BOSS_ARENA_PARTY.speed*dt);
      for(const other of Object.values(players)){
        if(other===player)continue;const gap=dir*(other.x-player.x);if(gap>0)allowed=Math.min(allowed,Math.max(0,gap-spacing));
      }
      step(player,allowed>.001?dir:0,dt,false,false,dt?allowed/dt:0);player.facing=1;
    }
    if(Object.values(players).every(p=>Math.abs(p.x-entryGoals[p.character])<1&&!p.airborne&&p.mode!=='fall'&&p.mode!=='ability'))entering=false;
  }
  function update(players,controlled,view,seconds,{crouchFor=()=>false}={}){
    const dt=Math.max(0,Math.min(.05,seconds)),active=players[controlled];
    const others=Object.values(players).filter(p=>p.character!==controlled).sort((a,b)=>a.x-b.x);
    const spacing=BOSS_ARENA_PARTY.separation;
    const slots=view.slots??[.075,.22,.365,.51].map(f=>view.x+Math.min(1600,view.width)*f);
    const available=slots.filter(x=>Math.abs(x-active.x)>=spacing);
    let best=null;
    for(let a=0;a<available.length;a++)for(let b=a+1;b<available.length;b++){
      const pair=[available[a],available[b]],cost=others.reduce((sum,p,i)=>sum+Math.abs(p.x-pair[i]),0);
      if(!best||cost<best.cost)best={pair,cost};
    }
    goals=Object.fromEntries(others.map((p,i)=>[p.character,best?.pair[i]??Math.max(view.x+80,p.x)]));
    // Move the front character first when walking right, the rear one first
    // when walking left. A character waits rather than walking through a peer.
    const movers=[...others].sort((a,b)=>{
      const da=Math.sign(goals[a.character]-a.x),db=Math.sign(goals[b.character]-b.x);
      return da===db?(da>0?b.x-a.x:a.x-b.x):da-db;
    });
    for(const player of movers){
      if(crouchFor(player)){step(player,0,dt,true);player.facing=1;continue;}
      if(player.airborne||player.mode==='fall'||player.mode==='ability'){step(player,0,dt);continue;}
      const distance=goals[player.character]-player.x,dir=Math.sign(distance);
      let allowed=Math.min(Math.abs(distance),BOSS_ARENA_PARTY.speed*dt);
      for(const other of Object.values(players)){
        if(other===player)continue;
        const gap=dir*(other.x-player.x);if(gap>0)allowed=Math.min(allowed,Math.max(0,gap-spacing));
      }
      step(player,allowed>.001?dir:0,dt,false,false,dt?allowed/dt:0);
      if(player.mode==='idle'||player.mode==='phone')player.facing=1;
    }
  }
  return {update,beginEntry,updateEntry,reset(){goals={};entryGoals={};entering=false;},get entering(){return entering;},get goals(){return {...goals};}};
}
