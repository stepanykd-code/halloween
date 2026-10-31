// Approved paintings stay intact. All coordinates refer to original pixels;
// only the face and the specified accessory move on a continuous surface.
export const OBJECT_BOSSES=Object.freeze({
  halushun:{name:'Галушун',sourceWidth:1536,sourceHeight:1024,width:1664,height:1152,anchorX:838.5,anchorY:986,scale:.51,cardScale:.29,sceneX:1190,eye:[281,550],eyeSeed:[302,548],eyeBounds:[220,505,362,582],faceBounds:[145,370,450,760]},
  wick:{name:'Пан Ґніт',sourceWidth:1145,sourceHeight:1374,width:1273,height:1502,anchorX:650,anchorY:1400,scale:.48,cardScale:.285,sceneX:1240,eye:[414,651],eyeSeed:[422,650],eyeBounds:[325,580,502,708],faceBounds:[265,490,565,875]}
});
export const OBJECT_BOSS_ANIMATIONS=Object.freeze({
  idle:{name:'Спокій',duration:4.8,keyPose:1.25},fear:{name:'Страх',duration:4.8,keyPose:1.25},
  anger:{name:'Злість',duration:4.8,keyPose:2.05},defeat:{name:'Поразка',duration:4.8,keyPose:4.8,loop:false}
});
const objectEase=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);};
const objectRamp=(a,b,v)=>objectEase((v-a)/(b-a));
const objectBox=(a,b,c,d,v)=>objectRamp(a,b,v)*(1-objectRamp(c,d,v));
const objectPulse=(a,b,c,d,t)=>objectRamp(a,b,t)*(1-objectRamp(c,d,t));

export function objectBossPose(kind,state,time){
  const t=state==='defeat'?Math.max(0,Math.min(4.8,time)):((time%4.8)+4.8)%4.8,w=t*Math.PI*2/4.8;
  const p={time:t,eyeOpen:1,eyeTilt:0,browRaise:0,mouthOpen:1,mouthCorner:0,butterAngle:0,flameSway:0,flameStretch:1,glow:1,extinction:0};
  const candle=kind==='wick';
  if(state==='defeat'){
    const settle=objectRamp(.08,1.6,t),moving=1-settle;
    p.eyeOpen=1-.83*settle;p.browRaise=5*settle;p.mouthOpen=1-.16*settle;p.mouthCorner=(candle?7:14)*settle;
    p.eyeTilt=.008*Math.sin(t*13)*moving;p.butterAngle=.014*Math.sin(t*8)*moving;
    p.flameSway=16*Math.sin(t*12)*moving;p.flameStretch=1-.04*settle;p.extinction=objectRamp(.3,2.7,t);
  }else if(state==='fear'){
    const fear=objectPulse(.08,.5,3.4,4.65,t);
    p.eyeOpen=1+(candle?.32:.34)*fear;p.eyeTilt=(candle?.12:.1)*fear;
    p.browRaise=(candle?-16:-15)*fear;p.mouthOpen=1+(candle?.28:.16)*fear;
    p.mouthCorner=(candle?5:16)*fear+fear*Math.sin(t*25)*1.3;
    p.butterAngle=fear*(.026*Math.sin(t*25)-.012);p.flameSway=fear*(13*Math.sin(t*27)+8*Math.sin(t*11));
    p.flameStretch=1-.1*fear;p.glow=1-.38*fear;
  }else if(state==='anger'){
    const angry=objectPulse(.12,.7,3.45,4.7,t);
    p.eyeOpen=1-.4*angry;p.eyeTilt=-.04*angry;p.browRaise=8*angry;
    p.mouthOpen=1+(candle?.14:.08)*angry;p.mouthCorner=(candle?11:-12)*angry;
    p.butterAngle=-.035*angry+.012*angry*Math.sin(t*8);
    p.flameSway=angry*(23*Math.sin(w*2)+8*Math.sin(w*4));p.flameStretch=1+angry*(.045+.025*Math.sin(w*3));p.glow=1+.13*angry;
  }else{
    const blink=objectPulse(3.34,3.52,3.63,3.85,t),chew=objectPulse(.3,.95,1.9,2.6,t);
    p.eyeOpen=(1-.06*chew)*(1-.86*blink);p.browRaise=-3*Math.sin(w);p.eyeTilt=.008*Math.sin(w);
    p.mouthOpen=1+(candle?.025:.045)*chew;p.mouthCorner=(candle?1:-3)*chew;
    p.butterAngle=.017*Math.sin(w);p.flameSway=14*Math.sin(w*2)+5*Math.sin(w*3);p.flameStretch=1+.022*Math.sin(w*3);p.glow=1+.035*Math.sin(w*3);
  }
  return p;
}

export function objectBossVertex(kind,x,y,edgeLock,p){
  const candle=kind==='wick',spread=Math.max(0,p.eyeOpen-1)/.34;
  const eye=candle?objectBox(305,346,489,549,x)*objectBox(548-30*spread,606,704,765+25*spread,y):objectBox(192,229,357,412,x)*objectBox(476-30*spread,515,584,639+25*spread,y);
  const ex=x-(candle?414:281),ey=y-(candle?651:550),weight=eye*edgeLock;
  let px=x+(ex*(Math.cos(p.eyeTilt)-1)-ey*Math.sin(p.eyeTilt))*weight;
  let py=y+(ey*(p.eyeOpen-1)+ex*Math.sin(p.eyeTilt))*weight;
  const brow=candle?objectBox(274,310,502,563,x)*objectBox(488,531,640,703,y):objectBox(154,187,397,455,x)*objectBox(369,414,518,565,y);
  py+=p.browRaise*brow*edgeLock*(1-eye*.35);
  const mouth=candle?objectBox(283,318,440,505,x)*objectBox(709,746,818,875,y):objectBox(54,100,404,463,x)*objectBox(570,607,710,764,y);
  py+=(y-(candle?781:659))*(p.mouthOpen-1)*mouth*edgeLock;
  const corner=1-objectRamp(.25,1,Math.hypot((x-(candle?428:381))/(candle?51:63),(y-(candle?785:618))/(candle?55:56)));
  py+=p.mouthCorner*corner*edgeLock;
  if(candle){
    const flame=objectBox(370,426,650,720,x)*(1-objectRamp(252,297,y));
    px+=p.flameSway*Math.pow(Math.max(0,(295-y)/285),1.6)*flame;
    py+=(y-295)*(p.flameStretch-1)*flame;
  }else{
    const butter=objectBox(281,306,533,575,x)*objectBox(109,144,275,326,y),bx=x-418,by=y-294;
    px+=(bx*(Math.cos(p.butterAngle)-1)-by*Math.sin(p.butterAngle))*butter;
    py+=(bx*Math.sin(p.butterAngle)+by*(Math.cos(p.butterAngle)-1))*butter;
  }
  return [px+64,py+64];
}

function objectBossMasks(image,kind){
  const cfg=OBJECT_BOSSES[kind],probe=document.createElement('canvas');probe.width=cfg.sourceWidth;probe.height=cfg.sourceHeight;
  const pc=probe.getContext('2d',{willReadFrequently:true});pc.drawImage(image,0,0,probe.width,probe.height);
  const pixels=pc.getImageData(0,0,probe.width,probe.height),data=pixels.data,w=probe.width,h=probe.height;
  const left=new Int32Array(h).fill(w),right=new Int32Array(h).fill(-1),top=new Int32Array(w).fill(h),bottom=new Int32Array(w).fill(-1);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>128){left[y]=Math.min(left[y],x);right[y]=Math.max(right[y],x);top[x]=Math.min(top[x],y);bottom[x]=Math.max(bottom[x],y);}
  const iris=new Uint8Array(w*h),fire=new Uint8Array(w*h),visited=new Uint8Array(w*h),queue=[];
  const [xl,yt,xr,yb]=cfg.eyeBounds;
  function light(x,y){const i=(y*w+x)*4,r=data[i],g=data[i+1],b=data[i+2];return kind==='wick'?g>95&&g>r*1.05&&g>b*1.1:Math.max(r,g,b)>115&&g>65&&r>b*1.12;}
  let [sx,sy]=cfg.eyeSeed;
  if(!light(sx,sy))for(let radius=1;radius<20;radius++){let found=false;for(let y=sy-radius;y<=sy+radius&&!found;y++)for(let x=sx-radius;x<=sx+radius;x++)if(x>=xl&&x<xr&&y>=yt&&y<yb&&light(x,y)){sx=x;sy=y;found=true;break;}if(found)break;}
  if(light(sx,sy)){queue.push(sy*w+sx);visited[sy*w+sx]=1;}
  for(let head=0;head<queue.length;head++){
    const at=queue[head],x=at%w,y=Math.floor(at/w);iris[at]=255;
    for(const [nx,ny] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]])if(nx>=xl&&nx<xr&&ny>=yt&&ny<yb){const next=ny*w+nx;if(!visited[next]&&light(nx,ny)){visited[next]=1;queue.push(next);}}
  }
  if(kind==='wick')for(let y=0;y<304;y++)for(let x=393;x<687;x++){
    const i=(y*w+x)*4,r=data[i],g=data[i+1],b=data[i+2];
    if(data[i+3]>0&&(y<235||g>=r*.97&&g>b*1.15||x<481&&x>457&&y>268&&y<295&&r>150&&r>g*1.8&&g>b*1.5))fire[y*w+x]=255;
  }
  // Expand one pixel into the painted edge so defeat leaves no bright fringe.
  function dilate(mask){const out=new Uint8Array(mask);for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=y*w+x;out[i]=Math.max(mask[i],mask[i-1],mask[i+1],mask[i-w],mask[i+w]);}return out;}
  const flame=dilate(fire),eye=dilate(iris),mask=document.createElement('canvas');mask.width=w;mask.height=h;
  const mc=mask.getContext('2d'),m=mc.createImageData(w,h);
  for(let i=0;i<w*h;i++){m.data[i*4]=flame[i];m.data[i*4+1]=eye[i];m.data[i*4+3]=255;}mc.putImageData(m,0,0);
  function lock(u,v){const x=Math.max(0,Math.min(w-1,Math.round(u*(w-1)))),y=Math.max(0,Math.min(h-1,Math.round(v*(h-1))));return objectRamp(0,36,Math.min(x-left[y],right[y]-x,y-top[x],bottom[x]-y));}
  return {mask,flame,eye,pixels,lock};
}

export function createObjectBossRig(image,kind,{backend='auto'}={}){
  const cfg=OBJECT_BOSSES[kind];if(!cfg)throw Error('Unknown object boss');
  const canvas=document.createElement('canvas'),factor=960/Math.max(cfg.width,cfg.height);canvas.width=Math.round(cfg.width*factor);canvas.height=Math.round(cfg.height*factor);
  const masks=objectBossMasks(image,kind);
  const gl=backend==='canvas'?null:canvas.getContext('webgl',{alpha:true,premultipliedAlpha:true,preserveDrawingBuffer:true,antialias:true});
  if(!gl)return createObjectCanvasRig(canvas,image,kind,masks);
  const vertex=`attribute vec3 mesh;varying vec2 tex;uniform vec4 face;uniform vec3 motion;uniform float corner;
float ramp(float a,float b,float v){return smoothstep(a,b,v);}float box(float a,float b,float c,float d,float v){return ramp(a,b,v)*(1.-ramp(c,d,v));}
void main(){tex=mesh.xy;vec2 s=tex*vec2(${cfg.sourceWidth}.,${cfg.sourceHeight}.);vec2 p=s;float spread=max(0.,face.x-1.)/.34;
float eye=${kind==='wick'?'box(305.,346.,489.,549.,s.x)*box(548.-30.*spread,606.,704.,765.+25.*spread,s.y)':'box(192.,229.,357.,412.,s.x)*box(476.-30.*spread,515.,584.,639.+25.*spread,s.y)'};
vec2 e=s-vec2(${cfg.eye[0]}.,${cfg.eye[1]}.);float weight=eye*mesh.z;p.x+=(e.x*(cos(face.y)-1.)-e.y*sin(face.y))*weight;p.y+=(e.y*(face.x-1.)+e.x*sin(face.y))*weight;
float brow=${kind==='wick'?'box(274.,310.,502.,563.,s.x)*box(488.,531.,640.,703.,s.y)':'box(154.,187.,397.,455.,s.x)*box(369.,414.,518.,565.,s.y)'};p.y+=face.z*brow*mesh.z*(1.-eye*.35);
float mouth=${kind==='wick'?'box(283.,318.,440.,505.,s.x)*box(709.,746.,818.,875.,s.y)':'box(54.,100.,404.,463.,s.x)*box(570.,607.,710.,764.,s.y)'};p.y+=(s.y-${kind==='wick'?'781.':'659.'})*(face.w-1.)*mouth*mesh.z;
p.y+=corner*(1.-ramp(.25,1.,length((s-vec2(${kind==='wick'?'428.,785.':'381.,618.'}))/vec2(${kind==='wick'?'51.,55.':'63.,56.'}))))*mesh.z;
${kind==='wick'?`float flame=box(370.,426.,650.,720.,s.x)*(1.-ramp(252.,297.,s.y));p.x+=motion.y*pow(max(0.,(295.-s.y)/285.),1.6)*flame;p.y+=(s.y-295.)*(motion.z-1.)*flame;`:`float butter=box(281.,306.,533.,575.,s.x)*box(109.,144.,275.,326.,s.y);vec2 b=s-vec2(418.,294.);p.x+=(b.x*(cos(motion.x)-1.)-b.y*sin(motion.x))*butter;p.y+=(b.x*sin(motion.x)+b.y*(cos(motion.x)-1.))*butter;`}
p+=64.;gl_Position=vec4(p.x/${(cfg.width/2).toFixed(1)}-1.,1.-p.y/${(cfg.height/2).toFixed(1)},0.,1.);}`;
  const fragment=`precision mediump float;varying vec2 tex;uniform sampler2D art;uniform sampler2D masks;uniform float extinction;uniform float glow;
void main(){vec4 color=texture2D(art,tex);vec2 m=texture2D(masks,tex).rg;vec3 lit=color.rgb*(1.+(glow-1.)*max(m.r,m.g));lit=mix(lit,vec3(.045,.034,.06)*color.a+color.rgb*.018,extinction*m.g);float fade=1.-extinction*m.r;gl_FragColor=vec4(min(lit,vec3(color.a))*fade,color.a*fade);}`;
  function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
  const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
  const vertices=[],nx=96,ny=Math.round(nx*cfg.sourceHeight/cfg.sourceWidth);
  function point(u,v){vertices.push(u,v,masks.lock(u,v));}
  for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){const a=x/nx,b=(x+1)/nx,c=y/ny,d=(y+1)/ny;point(a,c);point(b,c);point(a,d);point(a,d);point(b,c);point(b,d);}
  gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);const attribute=gl.getAttribLocation(program,'mesh');gl.enableVertexAttribArray(attribute);gl.vertexAttribPointer(attribute,3,gl.FLOAT,false,0,0);
  function texture(source,unit,name,premultiply){gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,gl.createTexture());gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,premultiply);for(const a of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,a,gl.CLAMP_TO_EDGE);for(const f of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,f,gl.LINEAR);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);gl.uniform1i(gl.getUniformLocation(program,name),unit);}
  texture(image,0,'art',true);texture(masks.mask,1,'masks',false);
  const uniforms=Object.fromEntries(['face','motion','corner','glow','extinction'].map(k=>[k,gl.getUniformLocation(program,k)]));
  gl.viewport(0,0,canvas.width,canvas.height);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.clearColor(0,0,0,0);
  return {backend:'webgl',render(state,time,poseOverride=null){const p=poseOverride??objectBossPose(kind,state,time);gl.clear(gl.COLOR_BUFFER_BIT);gl.uniform4f(uniforms.face,p.eyeOpen,p.eyeTilt,p.browRaise,p.mouthOpen);gl.uniform3f(uniforms.motion,p.butterAngle,p.flameSway,p.flameStretch);gl.uniform1f(uniforms.corner,p.mouthCorner);gl.uniform1f(uniforms.glow,p.glow);gl.uniform1f(uniforms.extinction,p.extinction);gl.drawArrays(gl.TRIANGLES,0,vertices.length/3);return canvas;}};
}

function createObjectCanvasRig(canvas,image,kind,masks){
  const cfg=OBJECT_BOSSES[kind],c=canvas.getContext('2d'),nx=40,ny=Math.round(nx*cfg.sourceHeight/cfg.sourceWidth),points=[],triangles=[];
  const lighting=document.createElement('canvas');lighting.width=cfg.sourceWidth;lighting.height=cfg.sourceHeight;const lc=lighting.getContext('2d'),original=masks.pixels.data;
  function layer(pixel){const layer=document.createElement('canvas');layer.width=cfg.sourceWidth;layer.height=cfg.sourceHeight;const ctx=layer.getContext('2d'),d=ctx.createImageData(layer.width,layer.height);for(let i=0;i<cfg.sourceWidth*cfg.sourceHeight;i++)pixel(d.data,i,i*4);ctx.putImageData(d,0,0);return layer;}
  const darkEye=layer((d,i,j)=>{d[j]=.045*255+original[j]*.018;d[j+1]=.034*255+original[j+1]*.018;d[j+2]=.06*255+original[j+2]*.018;d[j+3]=original[j+3]*masks.eye[i]/255;});
  const eraseFlame=layer((d,i,j)=>{d[j+3]=masks.flame[i];});
  const dimLight=layer((d,i,j)=>{d[j+3]=Math.max(masks.flame[i],masks.eye[i]);});
  for(let y=0;y<=ny;y++)for(let x=0;x<=nx;x++)points.push({x:x/nx*cfg.sourceWidth,y:y/ny*cfg.sourceHeight,lock:masks.lock(x/nx,y/ny)});
  for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){const a=y*(nx+1)+x,b=a+1,d=a+nx+1,e=d+1;triangles.push([a,b,d],[d,b,e]);}
  return {backend:'canvas',render(state,time,poseOverride=null){
    const pose=poseOverride??objectBossPose(kind,state,time),dest=points.map(p=>objectBossVertex(kind,p.x,p.y,p.lock,pose));let source=image;
    if(pose.extinction>0||pose.glow<1){
      lc.clearRect(0,0,lighting.width,lighting.height);lc.drawImage(image,0,0);
      if(pose.extinction>0){lc.globalAlpha=pose.extinction;lc.drawImage(darkEye,0,0);lc.globalCompositeOperation='destination-out';lc.drawImage(eraseFlame,0,0);}
      if(pose.glow<1){lc.globalCompositeOperation='source-atop';lc.globalAlpha=1-pose.glow;lc.drawImage(dimLight,0,0);}
      lc.globalAlpha=1;lc.globalCompositeOperation='source-over';source=lighting;
    }
    c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,canvas.width,canvas.height);c.setTransform(canvas.width/cfg.width,0,0,canvas.height/cfg.height,0,0);
    for(const indices of triangles){const [s0,s1,s2]=indices.map(i=>points[i]),[d0,d1,d2]=indices.map(i=>dest[i]),ux=s1.x-s0.x,uy=s1.y-s0.y,vx=s2.x-s0.x,vy=s2.y-s0.y,det=ux*vy-vx*uy;
      const a=((d1[0]-d0[0])*vy-(d2[0]-d0[0])*uy)/det,b=((d1[1]-d0[1])*vy-(d2[1]-d0[1])*uy)/det,cc=((d2[0]-d0[0])*ux-(d1[0]-d0[0])*vx)/det,d=((d2[1]-d0[1])*ux-(d1[1]-d0[1])*vx)/det;
      c.save();c.beginPath();c.moveTo(...d0);c.lineTo(...d1);c.lineTo(...d2);c.closePath();c.clip();c.transform(a,b,cc,d,d0[0]-a*s0.x-cc*s0.y,d0[1]-b*s0.x-d*s0.y);c.drawImage(source,0,0,cfg.sourceWidth,cfg.sourceHeight);c.restore();}
    return canvas;
  }};
}
