export const WORLD = Object.freeze({screenWidth:1600,screens:10,width:16000,height:900,groundY:756,minX:150,maxX:15850,speed:240,airSpeed:320,gravity:16200/19,jumpSpeed:540,fallGravity:1800});
export const SLAVIK_ABILITY_MS=2000;
export const PHONE_TIMING=Object.freeze({idleMin:8000,idleMax:15000,durationMin:3000,durationMax:5000,putAwayMs:640});
export const FALL_ANIMATION = Object.freeze({"durationsMs":[100,90,90,110,100,130,130,80],"anchor":[224,480],"frames":[{"segments":[{"crop":[0,0,368,177],"destination":[46.586206896551715,15.662337662337649,310.89655172413796,160.14285714285714]},{"crop":[0,177,368,335],"destination":[46.586206896551715,175.8051948051948,310.89655172413796,320.45679163603694]}],"headBox":[145.4310344827586,80.80519480519479,98,95]},{"segments":[{"crop":[368,0,384,193],"destination":[28.000000000000007,17.662175830400145,318.91525423728814,171.3551401869159]},{"crop":[368,193,384,319],"destination":[28.000000000000007,189.01731601731603,318.91525423728814,307.3625039419741]}],"headBox":[119.35593220338984,94.01731601731603,98,95]},{"segments":[{"crop":[752,0,408,290],"destination":[34.017543859649116,20.652781181083043,350.7368421052632,259.9056603773585]},{"crop":[752,290,408,222],"destination":[34.017543859649116,280.55844155844153,350.7368421052632,214.9321649224562]}],"headBox":[130.2982456140351,185.55844155844153,98,95]},{"segments":[{"crop":[1160,0,376,316],"destination":[44.896551724137936,20.13419913419912,317.65517241379314,285.9047619047619]},{"crop":[1160,316,376,196],"destination":[44.896551724137936,306.038961038961,317.65517241379314,189.42424242424244]}],"headBox":[127.68965517241378,211.03896103896102,98,95]},{"segments":[{"crop":[0,512,384,282],"destination":[82.81355932203391,52.359389038634305,318.91525423728814,252.73584905660377]},{"crop":[0,794,384,230],"destination":[82.81355932203391,305.0952380952381,318.91525423728814,223.48941798941803]}],"headBox":[235.62711864406782,210.09523809523807,98,95]},{"segments":[{"crop":[384,512,384,204],"destination":[89.35652173913044,42.99232214326554,327.23478260869564,182.83018867924528]},{"crop":[384,716,384,308],"destination":[89.35652173913044,225.82251082251082,327.23478260869564,296.54040404040404]}],"headBox":[255.53043478260872,130.82251082251082,98,95]},{"segments":[{"crop":[768,512,384,158],"destination":[66.5,34.795654184003695,336.0,145.72815533980582]},{"crop":[768,670,384,354],"destination":[66.5,180.52380952380952,336.0,336.55419501133787]}],"headBox":[217.0,85.52380952380952,98,95]},{"segments":[{"crop":[1152,512,384,117],"destination":[41.363636363636374,30.029411764705884,342.1090909090909,108.97058823529412]},{"crop":[1152,629,384,395],"destination":[41.363636363636374,139.0,342.1090909090909,374.15277777777777]}],"headBox":[170.54545454545453,44.0,98,95]}]});
export const FALL_LAYOUTS = Object.freeze({"slavik":[{"segments":[{"crop":[0,0,368,177],"destination":[46.586206896551715,15.662337662337649,310.89655172413796,160.14285714285714]},{"crop":[0,177,368,335],"destination":[46.586206896551715,175.8051948051948,310.89655172413796,320.45679163603694]}],"headBox":[145.4310344827586,80.80519480519479,98,95]},{"segments":[{"crop":[368,0,384,193],"destination":[28.000000000000007,17.662175830400145,318.91525423728814,171.3551401869159]},{"crop":[368,193,384,319],"destination":[28.000000000000007,189.01731601731603,318.91525423728814,307.3625039419741]}],"headBox":[119.35593220338984,94.01731601731603,98,95]},{"segments":[{"crop":[752,0,408,290],"destination":[34.017543859649116,20.652781181083043,350.7368421052632,259.9056603773585]},{"crop":[752,290,408,222],"destination":[34.017543859649116,280.55844155844153,350.7368421052632,214.9321649224562]}],"headBox":[130.2982456140351,185.55844155844153,98,95]},{"segments":[{"crop":[1160,0,376,316],"destination":[44.896551724137936,20.13419913419912,317.65517241379314,285.9047619047619]},{"crop":[1160,316,376,196],"destination":[44.896551724137936,306.038961038961,317.65517241379314,189.42424242424244]}],"headBox":[127.68965517241378,211.03896103896102,98,95]},{"segments":[{"crop":[0,512,384,282],"destination":[82.81355932203391,52.359389038634305,318.91525423728814,252.73584905660377]},{"crop":[0,794,384,230],"destination":[82.81355932203391,305.0952380952381,318.91525423728814,223.48941798941803]}],"headBox":[235.62711864406782,210.09523809523807,98,95]},{"segments":[{"crop":[384,512,384,204],"destination":[89.35652173913044,42.99232214326554,327.23478260869564,182.83018867924528]},{"crop":[384,716,384,308],"destination":[89.35652173913044,225.82251082251082,327.23478260869564,296.54040404040404]}],"headBox":[255.53043478260872,130.82251082251082,98,95]},{"segments":[{"crop":[768,512,384,158],"destination":[66.5,34.795654184003695,336.0,145.72815533980582]},{"crop":[768,670,384,354],"destination":[66.5,180.52380952380952,336.0,336.55419501133787]}],"headBox":[217.0,85.52380952380952,98,95]},{"segments":[{"crop":[1152,512,384,117],"destination":[41.363636363636374,30.029411764705884,342.1090909090909,108.97058823529412]},{"crop":[1152,629,384,395],"destination":[41.363636363636374,139.0,342.1090909090909,374.15277777777777]}],"headBox":[170.54545454545453,44.0,98,95]}],"dasha":[{"segments":[{"crop":[0,0,384,172],"destination":[-10.69026548672565,21.05903152480886,346.61946902654864,177.31958762886597]},{"crop":[0,172,384,340],"destination":[-10.69026548672565,198.37861915367483,346.61946902654864,323.48401853969784]}],"headBox":[100.33628318584073,98.37861915367483,102,100]},{"segments":[{"crop":[384,0,384,212],"destination":[-19.30275229357798,18.951865824280716,359.3394495412844,216.3265306122449]},{"crop":[384,212,384,300],"destination":[-19.30275229357798,235.2783964365256,359.3394495412844,285.6672415137833]}],"headBox":[122.0,135.2783964365256,102,100]},{"segments":[{"crop":[768,0,384,277],"destination":[49.52631578947367,26.55125737885703,343.57894736842104,268.93203883495147]},{"crop":[768,277,384,235],"destination":[49.52631578947367,295.4832962138085,343.57894736842104,228.2180283671316]}],"headBox":[113.05263157894737,195.4832962138085,102,100]},{"segments":[{"crop":[1152,0,384,280],"destination":[46.60869565217391,39.10072698239276,340.59130434782605,264.1509433962264]},{"crop":[1152,280,384,232],"destination":[46.60869565217391,303.25167037861917,340.59130434782605,229.08163392268355]}],"headBox":[107.80869565217392,203.25167037861917,102,100]},{"segments":[{"crop":[0,512,384,243],"destination":[46.60869565217391,53.090029124550284,340.59130434782605,233.65384615384616]},{"crop":[0,755,384,269],"destination":[46.60869565217391,286.74387527839644,340.59130434782605,262.55503813187556]}],"headBox":[228.43478260869563,186.74387527839644,102,100]},{"segments":[{"crop":[384,512,384,199],"destination":[69.17857142857144,40.899353059709426,349.7142857142857,189.52380952380952]},{"crop":[384,711,384,313],"destination":[69.17857142857144,230.42316258351894,349.7142857142857,306.3433337700336]}],"headBox":[214.8928571428571,130.42316258351894,102,100]},{"segments":[{"crop":[768,512,384,135],"destination":[60.071428571428584,38.179254870586234,349.7142857142857,131.06796116504856]},{"crop":[768,647,384,377],"destination":[60.071428571428584,169.24721603563478,349.7142857142857,366.10562360801777]}],"headBox":[203.05357142857142,69.24721603563478,102,100]},{"segments":[{"crop":[1152,512,384,113],"destination":[42.87850467289721,33.21568627450981,366.05607476635515,110.7843137254902]},{"crop":[1152,625,384,399],"destination":[42.87850467289721,144.0,366.05607476635515,386.35158501440924]}],"headBox":[171.57009345794393,44.0,102,100]}],"katya":[{"segments":[{"crop":[0,0,384,165],"destination":[-8.63157894736841,50.1659388646288,343.57894736842104,150.0]},{"crop":[0,165,384,347],"destination":[-8.63157894736841,200.1659388646288,343.57894736842104,335.9945301521585]}],"headBox":[116.63157894736841,100.1659388646288,102,100]},{"segments":[{"crop":[384,0,384,219],"destination":[4.172413793103459,58.28137459654451,337.6551724137931,190.43478260869566]},{"crop":[384,219,384,293],"destination":[4.172413793103459,248.71615720524017,337.6551724137931,290.8419139007066]}],"headBox":[108.81034482758622,148.71615720524017,102,100]},{"segments":[{"crop":[768,0,384,267],"destination":[48.13793103448276,72.20102932002496,337.6551724137931,238.39285714285717]},{"crop":[768,267,384,245],"destination":[48.13793103448276,310.5938864628821,337.6551724137931,242.71636150054903]}],"headBox":[114.08620689655172,210.5938864628821,102,100]},{"segments":[{"crop":[1152,0,384,289],"destination":[32.75,80.91007327362888,349.7142857142857,244.91525423728814]},{"crop":[1152,289,384,151],"destination":[32.75,325.825327510917,349.7142857142857,156.24413118021164]}],"headBox":[100.14285714285714,225.82532751091702,102,100]},{"segments":[{"crop":[0,512,384,271],"destination":[44.48000000000002,69.52911208151383,313.344,225.83333333333334]},{"crop":[0,783,384,241],"destination":[44.48000000000002,295.3624454148472,313.344,248.590227123027]}],"headBox":[232.976,195.36244541484717,102,100]},{"segments":[{"crop":[384,512,384,181],"destination":[70.19047619047618,58.536714249018374,310.8571428571429,152.10084033613447]},{"crop":[384,693,384,331],"destination":[70.19047619047618,210.63755458515283,310.8571428571429,331.44598301975617]}],"headBox":[226.42857142857144,110.63755458515283,102,100]},{"segments":[{"crop":[768,512,384,148],"destination":[55.47826086956522,54.75094367552366,340.59130434782605,125.42372881355932]},{"crop":[768,660,384,364],"destination":[55.47826086956522,180.17467248908298,340.59130434782605,361.37887156944964]}],"headBox":[206.26086956521738,80.17467248908298,102,100]},{"segments":[{"crop":[1152,512,384,108],"destination":[47.98230088495575,49.26315789473684,346.61946902654864,94.73684210526315]},{"crop":[1152,620,384,404],"destination":[47.98230088495575,144.0,346.61946902654864,394.6046511627907]}],"headBox":[172.5486725663717,44.0,102,100]}]});
export const ANIMATIONS = Object.freeze({walk:{durations:Array(8).fill(100)},idle:{durations:[450,350,450,350,700,80,100,80]},phone:{durations:[200,280,320,450,260,260,220,700],loopStart:4}});
export const CHARACTERS=Object.freeze({slavik:{name:'Славік',scale:1,crouchScale:96/88},dasha:{name:'Даша',scale:.91},katya:{name:'Катя',scale:.82}});
function unitRandom(random){return Math.max(0,Math.min(1,random()));}
function phoneTiming(random=Math.random){return {idleDelay:PHONE_TIMING.idleMin+unitRandom(random)*(PHONE_TIMING.idleMax-PHONE_TIMING.idleMin),phoneDuration:PHONE_TIMING.durationMin+unitRandom(random)*(PHONE_TIMING.durationMax-PHONE_TIMING.durationMin)};}
function idlePhase(random=Math.random){const frame=Math.min(7,Math.floor(unitRandom(random)*8));return {frame,elapsed:unitRandom(random)*(ANIMATIONS.idle.durations[frame]-.001)};}
export function createState(character='slavik',random=Math.random){return {x:450,y:0,vy:0,jumpVelocity:0,jumpAge:0,jumpInPlace:false,airborne:false,landingMs:0,facing:1,mode:'idle',fallTime:0,hitCooldown:0,hitFall:false,knockbackAge:0,knockbackDistance:0,knockbackDirection:0,ghostHitCount:0,...idlePhase(random),idleTime:0,...phoneTiming(random),abilityTime:0,phoneTime:0,phoneReturning:false,rescheduleIdle:false,character:Object.hasOwn(CHARACTERS,character)?character:'slavik'};}
export function noteActivity(state){
  state.idleTime=0;state.phoneTime=0;state.phoneReturning=false;state.rescheduleIdle=true;
  if(state.mode==='phone'){state.mode='idle';state.frame=0;state.elapsed=0;}
}
export function selectCharacter(state,character){
  if(!Object.hasOwn(CHARACTERS,character)||(state.mode==='fall'&&character!==state.character))return false;
  noteActivity(state);
  state.character=character;
  if(!state.airborne&&state.mode!=='fall'&&state.mode!=='ability'){state.mode='idle';state.frame=0;state.elapsed=0;}
  return true;
}
function releaseAbilityForDodge(state){
  if(state.mode!=='ability')return true;
  if(!state.abilitySerial||state.abilityReleasedSerial!==state.abilitySerial)return false;
  Object.assign(state,{mode:'idle',frame:0,elapsed:0});return true;
}
export function requestJump(state,axis=0,{inPlace=false}={}){
  if(state.airborne||state.y<0||state.mode==='fall'||!releaseAbilityForDodge(state))return false;
  noteActivity(state);
  const direction=inPlace?0:Number.isFinite(axis)?Math.sign(axis):0;
  if(direction)state.facing=direction;
  state.vy=-WORLD.jumpSpeed;state.jumpVelocity=direction*WORLD.airSpeed;
  state.y=0;state.airborne=true;state.jumpAge=0;state.landingMs=0;state.jumpInPlace=inPlace;
  state.mode='jump';state.frame=1;state.elapsed=0;
  return true;
}
export const DASHA_ABILITY_REFUSAL_CHANCE=.25;
function canStartAbility(state,slot){
  return ['e','r'].includes(slot)&&['slavik','dasha','katya'].includes(state.character)&&!state.airborne&&state.y>=0&&state.mode!=='fall'&&state.mode!=='ability';
}
export function attemptAbility(state,slot='e',random=Math.random){
  // Roll once per valid player request, never on a frame update, held-key
  // repeat, or an unavailable action. A refusal emits no circle or projectile.
  if(!canStartAbility(state,slot))return 'blocked';
  if(state.character==='dasha'&&random()<DASHA_ABILITY_REFUSAL_CHANCE){noteActivity(state);return 'refused';}
  requestAbility(state,slot);return 'started';
}
export function requestAbility(state,slot='e'){
  if(!canStartAbility(state,slot))return false;
  noteActivity(state);
  Object.assign(state,{mode:'ability',abilitySlot:slot,abilitySerial:(state.abilitySerial??0)+1,abilityTime:0,frame:0,elapsed:0,landingMs:0,vy:0,jumpVelocity:0});
  return true;
}
export function requestFall(state){
  if(!Object.hasOwn(FALL_LAYOUTS,state.character)||state.airborne||state.y<0||state.mode==='fall'||state.mode==='ability')return false;
  noteActivity(state);
  Object.assign(state,{mode:'fall',frame:0,elapsed:0,fallTime:0,landingMs:0,vy:0,jumpVelocity:0});
  return true;
}
export function requestHitFall(state,direction,distance=150){
  if(state.mode==='fall'||state.hitCooldown>0)return false;
  noteActivity(state);
  Object.assign(state,{mode:'fall',frame:0,elapsed:0,fallTime:0,landingMs:0,airborne:false,jumpVelocity:0,jumpInPlace:false,hitFall:true,hitCooldown:1400,knockbackAge:0,knockbackDistance:distance,knockbackDirection:Math.sign(direction)||-state.facing,vy:state.y<0?Math.max(140,state.vy):0});
  state.ghostHitCount=(state.ghostHitCount??0)+1;return true;
}
function advanceFall(state,ms){
  state.fallTime+=ms;state.elapsed+=ms;
  const durations=FALL_ANIMATION.durationsMs;
  while(state.elapsed>=durations[state.frame]-1e-6){
    state.elapsed=Math.max(0,state.elapsed-durations[state.frame]);
    if(++state.frame>=durations.length){
      Object.assign(state,{mode:'idle',frame:0,elapsed:0,fallTime:0,idleTime:0,rescheduleIdle:true,hitFall:false});return;
    }
  }
}
export function advanceAnimation(state,ms){
  if(!Number.isFinite(ms)||ms<0)return;
  const times=ANIMATIONS[state.mode]?.durations;
  if(!times)return;
  state.elapsed+=ms;
  while(state.elapsed>=times[state.frame]){state.elapsed-=times[state.frame];state.frame=state.frame+1<times.length?state.frame+1:(ANIMATIONS[state.mode].loopStart??0);}
}
export function requestTouchJump(state,action,axis=0){
  if(action==='jump')return requestJump(state,0,{inPlace:true});
  if(action==='forward')return requestJump(state,(Number.isFinite(axis)?Math.sign(axis):0)||state.facing);
  return false;
}
function advancePhone(state,ms){
  state.phoneTime+=ms;
  if(state.phoneTime>=state.phoneDuration-1e-6){
    const overflow=Math.max(0,state.phoneTime-state.phoneDuration);
    Object.assign(state,phoneTiming(),idlePhase(),{mode:'idle',idleTime:overflow,phoneTime:0,phoneReturning:false,rescheduleIdle:false});
    advanceAnimation(state,overflow);return;
  }
  const returnAge=state.phoneTime-state.phoneDuration+PHONE_TIMING.putAwayMs;
  if(returnAge>=0){
    state.phoneReturning=true;state.elapsed=0;
    state.frame=returnAge<180?3:returnAge<360?2:returnAge<520?1:0;
    return;
  }
  advanceAnimation(state,ms);
}
export function step(state,axis,seconds,crouching=false,controlHeld=false,walkSpeed=WORLD.speed){
  const dt=Math.max(0,Math.min(Number.isFinite(seconds)?seconds:0,0.05));
  state.hitCooldown=Math.max(0,(state.hitCooldown??0)-dt*1000);
  if(state.mode==='ability'){
    noteActivity(state);state.abilityTime=Math.min(SLAVIK_ABILITY_MS,state.abilityTime+dt*1000);
    // Defence takes priority over the decorative return after a real launch.
    // Before release, keep the wind-up intact so a cast cannot lose its shot.
    if(!(crouching&&releaseAbilityForDodge(state))){
      if(state.abilityTime>=SLAVIK_ABILITY_MS-1e-6)Object.assign(state,{mode:'idle',frame:0,elapsed:0,abilityTime:SLAVIK_ABILITY_MS});
      return state;
    }
  }
  if(state.mode==='fall'){
    if(state.hitFall){
      const old=Math.min(1,state.knockbackAge/.42);state.knockbackAge+=dt;const next=Math.min(1,state.knockbackAge/.42);
      const distance=state.knockbackDistance*((2*next-next*next)-(2*old-old*old))*state.knockbackDirection;
      state.x=Math.max(WORLD.minX,Math.min(WORLD.maxX,state.x+distance));
      if(state.y<0){state.y=Math.min(0,state.y+state.vy*dt+.5*WORLD.fallGravity*dt*dt);state.vy=state.y<0?state.vy+WORLD.fallGravity*dt:0;}
    }
    advanceFall(state,dt*1000);return state;
  }
  const direction=Math.sign(axis);
  const active=!!direction||crouching||controlHeld;
  if(active||state.airborne)noteActivity(state);
  if(direction)state.facing=direction;
  if(state.airborne){
    if(direction&&!state.jumpInPlace)state.jumpVelocity=direction*WORLD.airSpeed;
    const intendedX=state.x+state.jumpVelocity*dt;
    state.x=Math.max(WORLD.minX,Math.min(WORLD.maxX,intendedX));
    if(state.x!==intendedX)state.jumpVelocity=0;
    state.y+=state.vy*dt+.5*WORLD.gravity*dt*dt;
    state.vy+=WORLD.gravity*dt;state.jumpAge+=dt;
    if(state.y>=0&&state.vy>=0){
      state.y=0;state.vy=0;state.airborne=false;state.jumpVelocity=0;state.jumpInPlace=false;
      state.landingMs=80;state.mode='land';state.frame=1;state.elapsed=0;
    }else{
      state.mode='jump';state.frame=state.jumpAge<.06||state.vy>180?1:2;
    }
    return state;
  }
  if(crouching){
    state.mode='crouch';state.frame=0;state.elapsed=0;state.landingMs=0;
    return state;
  }
  const previous=state.x;
  const groundSpeed=Number.isFinite(walkSpeed)?Math.max(0,walkSpeed):WORLD.speed;
  state.x=Math.max(WORLD.minX,Math.min(WORLD.maxX,state.x+direction*groundSpeed*dt));
  if(state.landingMs>0){
    state.idleTime=0;
    state.landingMs=Math.max(0,state.landingMs-dt*1000);
    if(state.landingMs>0){state.mode='land';state.frame=1;return state;}
  }
  const mode=Math.abs(state.x-previous)>0.0001?'walk':'idle';
  if(mode==='idle'&&!active){
    if(state.mode==='phone'){advancePhone(state,dt*1000);return state;}
    if(state.rescheduleIdle){Object.assign(state,phoneTiming());state.rescheduleIdle=false;}
    const before=state.idleTime;
    state.idleTime=Math.min(state.idleDelay,before+dt*1000);
    if(state.idleTime>=state.idleDelay-1e-6){
      state.idleTime=state.idleDelay;state.mode='phone';state.frame=0;state.elapsed=0;state.phoneTime=0;state.phoneReturning=false;
      advancePhone(state,Math.max(0,before+dt*1000-state.idleDelay));return state;
    }
  }else state.idleTime=0;
  if(mode!==state.mode){state.mode=mode;state.frame=0;state.elapsed=0;}
  advanceAnimation(state,dt*1000*(mode==='walk'?groundSpeed/WORLD.speed:1));
  return state;
}
