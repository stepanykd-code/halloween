export const EGG_BOSS=Object.freeze({width:1408,height:1408,sourceSize:1280,padding:64,anchorX:704,anchorY:1332,scale:.52});
export const EGG_BOSS_ANIMATIONS=Object.freeze({
  idle:{name:'Спокій / удавана люб’язність',duration:4.8,keyPose:1.3},
  fear:{name:'Страх',duration:4.8,keyPose:1.25},
  anger:{name:'Єхидність / злість',duration:4.8,keyPose:2.1},
  defeat:{name:'Поразка',duration:4.8,keyPose:4.8,loop:false}
});
const eggEase=x=>{const t=Math.max(0,Math.min(1,x));return t*t*(3-2*t);};
const eggRamp=(a,b,x)=>eggEase((x-a)/(b-a));
const eggPulse=(a,b,c,d,t)=>eggRamp(a,b,t)*(1-eggRamp(c,d,t));
export function eggBossPose(state,time){
  const t=state==='defeat'?Math.max(0,Math.min(4.8,time)):((time%4.8)+4.8)%4.8,w=t*Math.PI*2/4.8;
  const p={time:t,eyeOpen:1,eyeTilt:0,browRaise:0,mouthOpen:1,mouthCorner:0,glow:1,extinction:0};
  if(state==='fear'){
    const fear=eggPulse(.08,.45,3.35,4.55,t);
    p.eyeOpen=1+.4*fear;p.eyeTilt=fear*(.15+.006*Math.sin(t*29));
    p.browRaise=-22*fear;p.mouthOpen=1+.25*fear;
    p.mouthCorner=fear*(18+1.1*Math.sin(t*30));p.glow=1-fear*(.1+.04*Math.sin(t*22));
  }else if(state==='anger'){
    const malice=eggPulse(.12,.8,3.4,4.7,t),chuckle=eggPulse(1.3,1.55,2.45,2.8,t);
    p.eyeOpen=1-.36*malice;p.eyeTilt=-.035*malice;p.browRaise=7*malice;
    p.mouthOpen=1+.06*chuckle*(.5+.5*Math.sin(t*15));p.mouthCorner=-12*malice-1.5*chuckle*Math.sin(t*15);
    p.glow=1+.08*malice;
  }else if(state==='defeat'){
    const settle=eggRamp(.1,1.6,t),moving=1-settle;
    p.eyeOpen=1-.82*settle;p.eyeTilt=.009*Math.sin(t*12)*moving;
    p.browRaise=6*settle;p.mouthOpen=1-.13*settle;p.mouthCorner=8*settle;
    p.extinction=eggRamp(.3,2.7,t);
  }else{
    const flatter=eggPulse(.25,.9,1.9,2.7,t),blink=eggPulse(3.38,3.53,3.63,3.84,t);
    p.eyeOpen=(1-.12*flatter)*(1-.86*blink);p.eyeTilt=.012*Math.sin(w);
    p.browRaise=-7*flatter;p.mouthCorner=-9*flatter-1.2*Math.sin(w);
    p.mouthOpen=1+.035*flatter;p.glow=1+.02*Math.sin(w);
  }
  return p;
}

// Only the face moves. The original shell outline, hat, body scale and ground
// anchor are identical in every frame and during every state transition.
export function eggBossVertex(x,y,edgeLock,p){
  const box=(a,b,c,d,v)=>eggRamp(a,b,v)*(1-eggRamp(c,d,v));
  const spread=Math.max(0,p.eyeOpen-1)/.26;
  const eye=box(264,303,465,520,x)*box(602-40*spread,648,762,804+24*spread,y)*edgeLock;
  const ex=x-379,ey=y-718;
  let px=x+(ex*(Math.cos(p.eyeTilt)-1)-ey*Math.sin(p.eyeTilt))*eye;
  let py=y+(ey*(p.eyeOpen-1)+ex*Math.sin(p.eyeTilt))*eye;
  const brow=box(270,302,490,553,x)*box(518,552,660,712,y)*edgeLock*(1-eye*.35);
  py+=p.browRaise*brow;
  const mouth=box(225,260,355,416,x)*box(772,796,874,911,y)*edgeLock;
  py+=(y-842)*(p.mouthOpen-1)*mouth;
  const corner=(1-eggRamp(.3,1,Math.hypot((x-339)/52,(y-819)/43)))*edgeLock;
  py+=p.mouthCorner*corner;
  return [px+64,py+64];
}

export function createEggBossRig(image){
  const canvas=document.createElement('canvas');canvas.width=768;canvas.height=768;
  const probe=document.createElement('canvas');probe.width=image.naturalWidth||image.width;probe.height=image.naturalHeight||image.height;
  const pc=probe.getContext('2d',{willReadFrequently:true});pc.drawImage(image,0,0);
  const {data}=pc.getImageData(0,0,probe.width,probe.height),iw=probe.width,ih=probe.height;
  const left=new Int32Array(ih).fill(iw),right=new Int32Array(ih).fill(-1),top=new Int32Array(iw).fill(ih),bottom=new Int32Array(iw).fill(-1);
  for(let y=0;y<ih;y++)for(let x=0;x<iw;x++)if(data[(y*iw+x)*4+3]>128){left[y]=Math.min(left[y],x);right[y]=Math.max(right[y],x);top[x]=Math.min(top[x],y);bottom[x]=Math.max(bottom[x],y);}
  function lock(u,v){
    const x=Math.min(iw-1,Math.max(0,Math.round(u*(iw-1)))),y=Math.min(ih-1,Math.max(0,Math.round(v*(ih-1))));
    return eggRamp(0,42,Math.min(x-left[y],right[y]-x,y-top[x],bottom[x]-y));
  }
  const gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:true,preserveDrawingBuffer:true,antialias:true});
  if(!gl)return createEggCanvasRig(canvas,image,lock);
  const vertex=`attribute vec3 mesh;varying vec2 tex;uniform vec4 face;uniform float corner;
float ramp(float a,float b,float v){return smoothstep(a,b,v);}
float box(float a,float b,float c,float d,float v){return ramp(a,b,v)*(1.-ramp(c,d,v));}
void main(){tex=mesh.xy;vec2 s=tex*1280.;vec2 p=s;
 float spread=max(0.,face.x-1.)/.26;
 float eye=box(264.,303.,465.,520.,s.x)*box(602.-40.*spread,648.,762.,804.+24.*spread,s.y)*mesh.z;
 vec2 e=s-vec2(379.,718.);
 p.x+=(e.x*(cos(face.y)-1.)-e.y*sin(face.y))*eye;
 p.y+=(e.y*(face.x-1.)+e.x*sin(face.y))*eye;
 float brow=box(270.,302.,490.,553.,s.x)*box(518.,552.,660.,712.,s.y)*mesh.z*(1.-eye*.35);
 p.y+=face.z*brow;
 float mouth=box(225.,260.,355.,416.,s.x)*box(772.,796.,874.,911.,s.y)*mesh.z;
 p.y+=(s.y-842.)*(face.w-1.)*mouth;
 p.y+=corner*(1.-ramp(.3,1.,length((s-vec2(339.,819.))/vec2(52.,43.))))*mesh.z;
 p+=64.;gl_Position=vec4(p.x/704.-1.,1.-p.y/704.,0.,1.);
}`;
  const fragment=`precision mediump float;varying vec2 tex;uniform sampler2D art;uniform float glow;uniform float extinction;
float gold(vec4 c){return smoothstep(.17,.36,c.r-c.b)*smoothstep(.25,.55,c.g);}
void main(){vec4 color=texture2D(art,tex);vec2 s=tex*1280.;
 float region=smoothstep(295.,312.,s.x)*(1.-smoothstep(465.,492.,s.x))*smoothstep(632.,655.,s.y)*(1.-smoothstep(770.,795.,s.y));
 float pigment=max(gold(color),max(gold(texture2D(art,tex+vec2(0.,.0048))),gold(texture2D(art,tex-vec2(0.,.0048)))));
 float iris=region*pigment;
 vec3 lit=color.rgb*(1.+(glow-1.)*iris);
 lit=mix(lit,vec3(.052,.036,.065)*color.a+color.rgb*.025,extinction*iris);
 gl_FragColor=vec4(min(lit,vec3(color.a)),color.a);
}`;
  function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
  const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
  const vertices=[],resolution=96;
  function point(u,v){vertices.push(u,v,lock(u,v));}
  for(let y=0;y<resolution;y++)for(let x=0;x<resolution;x++){
    const a=x/resolution,b=(x+1)/resolution,c=y/resolution,d=(y+1)/resolution;
    point(a,c);point(b,c);point(a,d);point(a,d);point(b,c);point(b,d);
  }
  gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
  const mesh=gl.getAttribLocation(program,'mesh');gl.enableVertexAttribArray(mesh);gl.vertexAttribPointer(mesh,3,gl.FLOAT,false,0,0);
  gl.bindTexture(gl.TEXTURE_2D,gl.createTexture());gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
  for(const axis of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,axis,gl.CLAMP_TO_EDGE);
  for(const filter of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,filter,gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);gl.uniform1i(gl.getUniformLocation(program,'art'),0);
  const uniforms=Object.fromEntries(['face','corner','glow','extinction'].map(name=>[name,gl.getUniformLocation(program,name)]));
  gl.viewport(0,0,768,768);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.clearColor(0,0,0,0);
  return {backend:'webgl',render(state,time){
    const p=eggBossPose(state,time);gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform4f(uniforms.face,p.eyeOpen,p.eyeTilt,p.browRaise,p.mouthOpen);gl.uniform1f(uniforms.corner,p.mouthCorner);
    gl.uniform1f(uniforms.glow,p.glow);gl.uniform1f(uniforms.extinction,p.extinction);
    gl.drawArrays(gl.TRIANGLES,0,vertices.length/3);return canvas;
  }};
}

function createEggCanvasRig(canvas,image,lock){
  const c=canvas.getContext('2d'),n=32,step=1280/n,points=[];
  const lighting=document.createElement('canvas');lighting.width=image.naturalWidth||image.width;lighting.height=image.naturalHeight||image.height;
  const lc=lighting.getContext('2d');lc.drawImage(image,0,0);
  const overlay=document.createElement('canvas');overlay.width=lighting.width;overlay.height=lighting.height;
  const oc=overlay.getContext('2d'),pixels=lc.getImageData(0,0,lighting.width,lighting.height),original=new Uint8ClampedArray(pixels.data);
  function gold(x,y){const i=(Math.max(0,Math.min(lighting.height-1,y))*lighting.width+x)*4;return eggRamp(.17,.36,(original[i]-original[i+2])/255)*eggRamp(.25,.55,original[i+1]/255);}
  for(let y=0;y<lighting.height;y++)for(let x=0;x<lighting.width;x++){
    const i=(y*lighting.width+x)*4,r=original[i]/255,g=original[i+1]/255,b=original[i+2]/255,sx=x/lighting.width*1280,sy=y/lighting.height*1280;
    const region=eggRamp(295,312,sx)*(1-eggRamp(465,492,sx))*eggRamp(632,655,sy)*(1-eggRamp(770,795,sy));
    const mask=region*Math.max(gold(x,y),gold(x,y+6),gold(x,y-6));
    pixels.data[i]=255*(.052+r*.025);pixels.data[i+1]=255*(.036+g*.025);pixels.data[i+2]=255*(.065+b*.025);pixels.data[i+3]*=mask;
  }
  oc.putImageData(pixels,0,0);
  for(let y=0;y<=n;y++)for(let x=0;x<=n;x++)points.push({x:x*step,y:y*step,lock:lock(x/n,y/n)});
  const triangles=[];
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){const a=y*(n+1)+x,b=a+1,d=a+n+1,e=d+1;triangles.push([a,b,d],[d,b,e]);}
  return {backend:'canvas',render(state,time){
    const pose=eggBossPose(state,time),dest=points.map(p=>eggBossVertex(p.x,p.y,p.lock,pose));let source=image;
    if(pose.extinction>0){lc.clearRect(0,0,lighting.width,lighting.height);lc.drawImage(image,0,0);lc.globalAlpha=pose.extinction;lc.drawImage(overlay,0,0);lc.globalAlpha=1;source=lighting;}
    c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,768,768);c.setTransform(768/1408,0,0,768/1408,0,0);
    for(const indices of triangles){
      const [s0,s1,s2]=indices.map(i=>points[i]),[d0,d1,d2]=indices.map(i=>dest[i]);
      const ux=s1.x-s0.x,uy=s1.y-s0.y,vx=s2.x-s0.x,vy=s2.y-s0.y,det=ux*vy-vx*uy;
      const a=((d1[0]-d0[0])*vy-(d2[0]-d0[0])*uy)/det,b=((d1[1]-d0[1])*vy-(d2[1]-d0[1])*uy)/det;
      const cc=((d2[0]-d0[0])*ux-(d1[0]-d0[0])*vx)/det,d=((d2[1]-d0[1])*ux-(d1[1]-d0[1])*vx)/det;
      c.save();c.beginPath();c.moveTo(...d0);c.lineTo(...d1);c.lineTo(...d2);c.closePath();c.clip();
      c.transform(a,b,cc,d,d0[0]-a*s0.x-cc*s0.y,d0[1]-b*s0.x-d*s0.y);c.drawImage(source,0,0,1280,1280);c.restore();
    }
    return canvas;
  }};
}
