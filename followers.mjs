import {WORLD,ANIMATIONS,step,requestJump} from './engine.mjs';

// Two footsteps per original walk cycle. Keep full walking silhouettes apart,
// not just the much narrower idle poses.
const followerStepLength=WORLD.speed*ANIMATIONS.walk.durations.reduce((a,b)=>a+b,0)/2000;
export const PARTY_FOLLOW=Object.freeze({stepLength:followerStepLength,gaps:[5*followerStepLength,8*followerStepLength],separation:260,catchUp:1.18,feetRadius:18,jumpMargin:6,maxFrame:.05});

export function followerJumpPlan(enemy){
  const flight=2*WORLD.jumpSpeed/WORLD.gravity;
  const range=flight*WORLD.airSpeed;
  const expanded=enemy.halfWidth+PARTY_FOLLOW.feetRadius;
  const discriminant=WORLD.jumpSpeed**2-2*WORLD.gravity*(enemy.height+PARTY_FOLLOW.jumpMargin);
  if(discriminant<=0)return null;
  const root=Math.sqrt(discriminant);
  const minimum=expanded+WORLD.airSpeed*(WORLD.jumpSpeed-root)/WORLD.gravity;
  const maximum=WORLD.airSpeed*(WORLD.jumpSpeed+root)/WORLD.gravity-expanded;
  if(maximum-minimum<WORLD.speed*PARTY_FOLLOW.catchUp*PARTY_FOLLOW.maxFrame)return null;
  return {minimum,maximum,takeoff:(minimum+maximum)/2,flight,range,maxRange:range+WORLD.airSpeed*PARTY_FOLLOW.maxFrame};
}

function nextFollowerHands(player,direction,enemies){
  return enemies.filter(enemy=>direction*(enemy.x-player.x)>0).sort((a,b)=>direction*(a.x-b.x))[0]??null;
}

export function createPartyFollowers(){
  let activeId=null,enabled=false,direction=1,lastLeaderX=0,anchor=null;
  let order=[],waiting={};
  const backing=new Set();
  function reset(players,id){
    activeId=id;enabled=false;direction=players[id].facing;lastLeaderX=players[id].x;anchor=null;order=[];waiting={};backing.clear();
  }
  function select(players,id){
    if(activeId===null){reset(players,id);return;}
    if(activeId===id)return;
    activeId=id;lastLeaderX=players[id].x;anchor=null;waiting={};backing.clear();
  }
  function update(players,id,enemies,seconds){
    const dt=Math.max(0,Math.min(Number.isFinite(seconds)?seconds:0,PARTY_FOLLOW.maxFrame));
    if(activeId!==id)select(players,id);
    const leader=players[id],others=Object.values(players).filter(player=>player.character!==id);
    const moved=Math.abs(leader.x-lastLeaderX)>.001;
    if(moved&&leader.mode!=='fall')enabled=true;
    lastLeaderX=leader.x;
    const inFlight=others.some(player=>player.airborne);
    if(!inFlight){
      anchor=null;
      if(enabled&&leader.mode!=='fall'){
        if(direction!==leader.facing)backing.clear();
        direction=leader.facing;
      }
    }else{
      // Finish committed jumps before changing the party's direction. The
      // ground companions still clear already reserved landing positions.
      anchor=anchor===null?leader.x:direction*Math.max(direction*anchor,direction*leader.x);
    }
    const leadX=anchor??leader.x;
    order=others.sort((a,b)=>direction*(b.x-a.x)).map(player=>player.character);
    const goals=Object.fromEntries(order.map((hero,index)=>[hero,leadX-direction*PARTY_FOLLOW.gaps[index]]));
    waiting={};

    // A newly inactive hero may already be too close for a safe takeoff.
    // Back away first, asking the rear companion to make room if necessary.
    const retreats={};
    if(enabled)for(const hero of order){
      const player=players[hero],enemy=nextFollowerHands(player,direction,enemies);
      if(!enemy||player.airborne||player.mode==='fall'){backing.delete(hero);continue;}
      const plan=followerJumpPlan(enemy),distance=direction*(enemy.x-player.x);
      if(!plan)continue;
      if(distance<plan.minimum&&direction*(goals[hero]-player.x)>0)backing.add(hero);
      if(backing.has(hero)){
        if(distance>=plan.takeoff-.001)backing.delete(hero);
        else retreats[hero]=enemy.x-direction*plan.takeoff;
      }
    }
    for(let i=0;i<order.length;i++)if(Object.hasOwn(retreats,order[i])){
      for(let j=i+1;j<order.length;j++){
        const hero=order[j],limit=retreats[order[i]]-direction*(j-i)*PARTY_FOLLOW.separation;
        if(direction*(players[hero].x-limit)>0)retreats[hero]=limit;
      }
    }
    for(const hero of [...order].reverse())if(Object.hasOwn(retreats,hero)){
      const player=players[hero];if(player.airborne||player.mode==='fall')continue;
      let allowed=Math.min(Math.max(0,direction*(player.x-retreats[hero])),WORLD.speed*dt);
      for(const other of Object.values(players)){
        if(other===player)continue;
        const gap=direction*(player.x-other.x);
        if(gap>0)allowed=Math.min(allowed,Math.max(0,gap-PARTY_FOLLOW.separation));
      }
      if(allowed>.001)step(player,-direction,dt,false,false,dt?allowed/dt:0);
      else step(player,0,dt);
      waiting[hero]='takeoff-space';
    }

    function projectedFront(other,horizon){
      if(other.character===id||other.mode==='fall')return other.x;
      const goal=goals[other.character];
      let x=other.x,time=horizon;
      if(other.airborne){
        if(Math.sign(other.jumpVelocity)!==direction)return other.x;
        const remaining=Math.max(0,2*WORLD.jumpSpeed/WORLD.gravity-other.jumpAge);
        const airTime=Math.min(time,remaining);
        x+=other.jumpVelocity*airTime;time-=airTime;
        if(time<=0)return x;
      }
      let available=Math.max(0,direction*(goal-x));
      // A companion can wait at the following hands. Never assume it will
      // begin another jump just to make the current landing look clear.
      const obstacle=nextFollowerHands({x},direction,enemies);
      if(obstacle){const plan=followerJumpPlan(obstacle);if(plan)available=Math.min(available,Math.max(0,direction*(obstacle.x-x)-plan.takeoff));}
      return x+direction*Math.min(available,WORLD.speed*time);
    }

    for(const hero of order){
      const player=players[hero];
      if(Object.hasOwn(retreats,hero)&&!player.airborne&&player.mode!=='fall')continue;
      if(!enabled||player.airborne||player.mode==='fall'){
        // Axis zero retains the exact launch velocity, even if the selected
        // hero stops, turns, or changes while this character is in the air.
        step(player,0,dt);continue;
      }
      let travel=Math.max(0,direction*(goals[hero]-player.x));
      const speed=WORLD.speed*Math.min(PARTY_FOLLOW.catchUp,1+travel/2000);
      let allowed=Math.min(travel,speed*dt);
      for(const other of Object.values(players)){
        if(other===player)continue;
        const gap=direction*(other.x-player.x);
        if(gap>0)allowed=Math.min(allowed,Math.max(0,gap-PARTY_FOLLOW.separation));
      }
      const enemy=nextFollowerHands(player,direction,enemies);
      if(enemy){
        const plan=followerJumpPlan(enemy),distance=direction*(enemy.x-player.x);
        if(plan&&distance-allowed<=plan.takeoff+.001){
          const landing=player.x+direction*plan.maxRange;
          let safe=direction*(goals[hero]-landing)>=0&&landing>=WORLD.minX&&landing<=WORLD.maxX;
          for(const other of Object.values(players)){
            if(other===player||direction*(other.x-player.x)<=0)continue;
            if(direction*(projectedFront(other,plan.flight)-landing)<PARTY_FOLLOW.separation+2)safe=false;
          }
          if(safe&&distance>=plan.minimum&&distance<=plan.maximum){
            requestJump(player,direction);step(player,0,dt);continue;
          }
          allowed=Math.min(allowed,Math.max(0,distance-plan.takeoff));
          waiting[hero]='hands';
        }
      }
      if(allowed>.001)step(player,direction,dt,false,false,dt?allowed/dt:0);
      else step(player,0,dt);
    }
  }
  return {update,reset,select,get enabled(){return enabled;},get direction(){return direction;},get order(){return [...order];},get waiting(){return {...waiting};}};
}
