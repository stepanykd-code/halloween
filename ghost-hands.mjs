import {requestHitFall,WORLD} from './engine.mjs';
import {POLTAVA_LANDMARKS} from './parallax.mjs';
export const GHOST_HANDS_SPAWN=Object.freeze({minPerScreen:2,maxPerScreen:3,firstScreen:2,lastScreen:8,edgePadding:160,minSpacing:440,landmarkGap:80,minVisibleWidth:1200});
export function ghostHandsBlockedZones(){
  // At an encounter, middle-plane scenery is compressed by its .5 parallax.
  // Protect its full painted width plus the hands, including narrower screens.
  const halfSprite=120,extra=2*(halfSprite+GHOST_HANDS_SPAWN.landmarkGap);
  const narrowShift=(WORLD.screenWidth-GHOST_HANDS_SPAWN.minVisibleWidth)/2;
  return POLTAVA_LANDMARKS.map(place=>({id:place.id,start:place.worldX-place.width-extra,end:place.worldX+place.width+extra+narrowShift}));
}
function subtractGhostInterval(intervals,start,end){
  return intervals.flatMap(([a,b])=>end<=a||start>=b?[[a,b]]:[...(start>a?[[a,start]]:[]),...(end<b?[[end,b]]:[])]).filter(([a,b])=>b-a>.01);
}
export function ghostHandsSpawnIntervals(){
  let intervals=[[(GHOST_HANDS_SPAWN.firstScreen-1)*WORLD.screenWidth+GHOST_HANDS_SPAWN.edgePadding,GHOST_HANDS_SPAWN.lastScreen*WORLD.screenWidth-GHOST_HANDS_SPAWN.edgePadding]];
  for(const zone of ghostHandsBlockedZones())intervals=subtractGhostInterval(intervals,zone.start,zone.end);
  return intervals;
}
export function createGhostHandsEnemies(random=Math.random){
  const unit=()=>Math.max(0,Math.min(1-Number.EPSILON,random()));
  const allowed=ghostHandsSpawnIntervals(),spacing=GHOST_HANDS_SPAWN.minSpacing,result=[];
  for(let screen=GHOST_HANDS_SPAWN.firstScreen;screen<=GHOST_HANDS_SPAWN.lastScreen;screen++){
    const start=(screen-1)*WORLD.screenWidth,end=screen*WORLD.screenWidth-.01;
    const previous=result.at(-1)?.x??-Infinity;
    let intervals=allowed.map(([a,b])=>[Math.max(a,start,previous+spacing),Math.min(b,end)]).filter(([a,b])=>b-a>.01);
    let remaining=GHOST_HANDS_SPAWN.minPerScreen+Math.floor(unit()*(GHOST_HANDS_SPAWN.maxPerScreen-GHOST_HANDS_SPAWN.minPerScreen+1));
    const requested=remaining;
    while(remaining>0&&intervals.length){
      // Pack from the right to reserve enough room for later hands before
      // choosing a random first position. Never squeeze hands together.
      const reserved=[];let limit=Infinity;
      for(let i=intervals.length-1;i>=0&&reserved.length<remaining;i--){
        let x=Math.min(intervals[i][1],limit);
        while(x>=intervals[i][0]&&reserved.length<remaining){reserved.push(x);limit=x-spacing;x=limit;}
      }
      if(!reserved.length)break;
      remaining=Math.min(remaining,reserved.length);
      const latest=reserved[remaining-1];
      const choices=intervals.map(([a,b])=>[a,Math.min(b,latest)]).filter(([a,b])=>b>=a);
      const length=choices.reduce((sum,[a,b])=>sum+b-a,0);let draw=unit()*length,chosen=choices[0],x=chosen[0];
      for(const range of choices){chosen=range;if(draw<=range[1]-range[0])break;draw-=range[1]-range[0];}
      x=chosen[0]+Math.min(draw,chosen[1]-chosen[0]);
      result.push({id:'ghost-hands-'+(result.length+1),x,screen,requestedOnScreen:requested,scale:3,halfWidth:64,height:124,flipX:unit()<.5,phase:unit()*Math.PI*2});
      remaining--;intervals=intervals.map(([a,b])=>[Math.max(a,x+spacing),b]).filter(([a,b])=>b>=a);
    }
  }
  // Keep both silhouettes represented, with a random distribution each run.
  if(result.length>1&&result.every(enemy=>enemy.flipX===result[0].flipX))result[Math.floor(unit()*result.length)].flipX=!result[0].flipX;
  return result.sort((a,b)=>a.x-b.x);
}
export function ghostHandsLocalPose(enemy){return {lean:enemy.pose.lean*(enemy.flipX?-1:1),lift:enemy.pose.lift};}
export function nearestGhostTarget(players,enemy){
  return Object.values(players).reduce((a,b)=>Math.hypot(a.x-enemy.x,a.y)<=Math.hypot(b.x-enemy.x,b.y)?a:b);
}
export function ghostHandsContact(player,before,enemy){
  if(player.mode==='fall'||player.hitCooldown>0)return false;
  const min=enemy.x-enemy.halfWidth-18,max=enemy.x+enemy.halfWidth+18,dx=player.x-before.x;
  let enter=0,exit=1;
  if(Math.abs(dx)<1e-9){if(player.x<min||player.x>max)return false;}
  else{const a=(min-before.x)/dx,b=(max-before.x)/dx;enter=Math.max(0,Math.min(a,b));exit=Math.min(1,Math.max(a,b));if(enter>exit)return false;}
  const lift=t=>-(before.y+(player.y-before.y)*t);
  return Math.min(lift(enter),lift(exit))<=enemy.height;
}
export function applyGhostHandsContact(player,before,enemy){
  if(!ghostHandsContact(player,before,enemy))return false;
  const motion=Math.sign(player.x-before.x)||Math.sign(player.jumpVelocity);
  const direction=motion?-motion:(Math.sign(before.x-enemy.x)||-player.facing);
  const safeX=enemy.x+direction*(enemy.halfWidth+18+70),distance=Math.max(150,Math.abs(player.x-safeX));
  if(!requestHitFall(player,direction,distance))return false;
  player.ghostHitPending=true;return true;
}
export const GHOST_HANDS_LAYOUT=Object.freeze({width:80,height:72,anchorX:40,anchorY:60,solidEnvelope:{width:64,height:56},source:{width:1374,height:1145,solidCenterX:698,baseline:1084,scale:54/1218}});
export function ghostHandTarget(time,heroX,enemyX){
  const distance=Math.abs(heroX-enemyX),near=Math.max(0,1-distance/360),direction=heroX<enemyX?-1:1;
  const reach=.64+.36*Math.sin(time*1.65);
  return {lean:direction*(.35+4.25*near)*reach,lift:near*(.45+.35*Math.sin(time*1.65-.7))};
}
export function advanceGhostHands(state,time,heroX,enemyX,dt){
  const target=ghostHandTarget(time,heroX,enemyX),ease=1-Math.exp(-Math.min(.05,Math.max(0,dt))*4.5);
  state.lean+=(target.lean-state.lean)*ease;state.lift+=(target.lift-state.lift)*ease;
  return state;
}
export function handVertex(x,y,pose){
  const s=GHOST_HANDS_LAYOUT.source,t=Math.max(0,Math.min(1,(y-820)/190)),weight=1-t*t*(3-2*t);
  return {x:40+(x-s.solidCenterX)*s.scale+pose.lean*weight,y:60+(y-s.baseline)*s.scale-pose.lift*weight};
}
export function createGhostHandsRig(image,{resolution=10}={}){
  const output=document.createElement('canvas');output.width=80*resolution;output.height=72*resolution;
  const gl=output.getContext('webgl',{alpha:true,premultipliedAlpha:true,preserveDrawingBuffer:true,antialias:true});
  if(!gl){
    const c=output.getContext('2d'),s=GHOST_HANDS_LAYOUT.source;
    return {canvas:output,renderer:'canvas',render(pose){
      c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,output.width,output.height);
      const rows=[0,820,...Array.from({length:20},(_,i)=>820+(i+1)*190/20),1145];
      for(let i=0;i<rows.length-1;i++){
        const y0=rows[i],y1=rows[i+1],top=handVertex(0,y0,pose),bottom=handVertex(0,y1,pose);
        const shear=(bottom.x-top.x)/(y1-y0),stretch=(bottom.y-top.y)/(y1-y0);
        c.setTransform(s.scale*resolution,0,shear*resolution,stretch*resolution,(top.x-shear*y0)*resolution,(top.y-stretch*y0)*resolution);
        c.drawImage(image,0,y0,1374,y1-y0,0,y0,1374,y1-y0);
      }
      return output;
    }};
  }
  const vertex=`attribute vec2 uv;varying vec2 tex;uniform vec2 pose;
    void main(){vec2 src=uv*vec2(1374.0,1145.0);float weight=1.0-smoothstep(820.0,1010.0,src.y);
    vec2 p=vec2(40.0,60.0)+(src-vec2(698.0,1084.0))*(54.0/1218.0);
    p+=vec2(pose.x,-pose.y)*weight;gl_Position=vec4(p.x/40.0-1.0,1.0-p.y/36.0,0.0,1.0);tex=uv;}`;
  const fragment=`precision mediump float;varying vec2 tex;uniform sampler2D art;void main(){gl_FragColor=texture2D(art,tex);}`;
  function shader(type,source){const value=gl.createShader(type);gl.shaderSource(value,source);gl.compileShader(value);if(!gl.getShaderParameter(value,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(value));return value;}
  const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));gl.useProgram(program);
  const vertices=[];for(let i=0;i<96;i++){const a=i/96,b=(i+1)/96;vertices.push(0,a,1,a,0,b,0,b,1,a,1,b);}
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
  const attribute=gl.getAttribLocation(program,'uv');gl.enableVertexAttribArray(attribute);gl.vertexAttribPointer(attribute,2,gl.FLOAT,false,0,0);
  const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);gl.uniform1i(gl.getUniformLocation(program,'art'),0);
  const poseUniform=gl.getUniformLocation(program,'pose');gl.viewport(0,0,output.width,output.height);
  gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.clearColor(0,0,0,0);
  return {canvas:output,renderer:'webgl',render(pose){gl.clear(gl.COLOR_BUFFER_BIT);gl.uniform2f(poseUniform,pose.lean,pose.lift);gl.drawArrays(gl.TRIANGLES,0,vertices.length/2);return output;}};
}
