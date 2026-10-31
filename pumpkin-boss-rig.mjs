export const PUMPKIN_BOSS=Object.freeze({width:1408,height:1408,sourceSize:1280,padding:64,anchorX:724,anchorY:1254,scale:.5});
export const PUMPKIN_BOSS_ANIMATIONS=Object.freeze({
  idle:{name:'Спокій',duration:4.8,keyPose:.9},
  fear:{name:'Страх',duration:4.8,keyPose:1.25},
  anger:{name:'Злість / пихатість',duration:4.8,keyPose:2.1},
  defeat:{name:'Поразка',duration:4.8,keyPose:4.8,loop:false}
});
const pumpkinEase=x=>{const t=Math.max(0,Math.min(1,x));return t*t*(3-2*t);};
const pumpkinRamp=(a,b,x)=>pumpkinEase((x-a)/(b-a));
const pumpkinPulse=(a,b,c,d,t)=>pumpkinRamp(a,b,t)*(1-pumpkinRamp(c,d,t));
export function pumpkinBossPose(state,time){
  const duration=PUMPKIN_BOSS_ANIMATIONS[state]?.duration??4.8;
  const t=state==='defeat'?Math.max(0,Math.min(duration,time)):((time%duration)+duration)%duration,w=t*Math.PI*2/duration;
  const pose={time:t,dx:0,dy:0,tilt:0,stem:0,eyeOpen:1,eyeTilt:0,jaw:0,corner:0,glow:1,heat:0,extinction:0,bodyScale:1};
  if(state==='defeat'){
    const moving=1-pumpkinRamp(.15,1.6,t);
    pose.dx=3*Math.sin(t*12)*moving;pose.dy=-3*(.5-.5*Math.cos(t*4))*moving;
    pose.tilt=.006*Math.sin(t*7)*moving;pose.stem=.012*Math.sin(t*10)*moving;
    pose.jaw=.8*Math.sin(t*4)*moving;
    pose.extinction=pumpkinRamp(.25,2.7,t);
  }else if(state==='fear'){
    const alarm=pumpkinPulse(.08,.45,3.35,4.55,t);
    pose.dx=alarm*(14+7*Math.sin(t*34));
    pose.dy=alarm*(-8+3*Math.sin(t*41));
    pose.tilt=alarm*(.012+.006*Math.sin(t*31));
    pose.stem=alarm*(.025*Math.sin(t*20));
    pose.eyeOpen=1+.27*alarm;pose.eyeTilt=.07*alarm;
    pose.jaw=35*alarm;pose.corner=32*alarm;
    pose.glow=1-alarm*(.14+.07*Math.sin(t*27));
  }else if(state==='anger'){
    const proud=pumpkinPulse(.12,.85,3.45,4.7,t);
    const chuckle=pumpkinPulse(1.2,1.45,2.45,2.8,t);
    pose.dx=-8*proud;pose.dy=-18*proud-6*chuckle*(.5+.5*Math.sin(t*17));
    pose.tilt=-.023*proud;pose.stem=-.018*proud+.007*Math.sin(w*2);
    pose.eyeOpen=1-.43*proud;pose.eyeTilt=-.045*proud;
    pose.jaw=8*chuckle*(.5+.5*Math.sin(t*17));pose.corner=-18*proud;
    pose.glow=1+proud*(.18+.08*Math.sin(w*4));pose.heat=.25*proud;
  }else{
    const blink=pumpkinPulse(3.38,3.53,3.63,3.84,t);
    pose.dy=-4*(.5-.5*Math.cos(w));pose.tilt=.0035*Math.sin(w);
    pose.stem=.009*Math.sin(w);pose.eyeOpen=1-.84*blink;
    pose.jaw=1.5*Math.sin(w);pose.glow=1+.06*Math.sin(w);
  }
  return pose;
}

// Continuous deformation of the SAME approved painting. The pumpkin is never
// rescaled; the shell's edge is locked while the carved facial openings move.
export function pumpkinBossVertex(x,y,edgeLock,pose){
  const box=(a,b,c,d,v)=>pumpkinRamp(a,b,v)*(1-pumpkinRamp(c,d,v));
  const spread=Math.max(0,pose.eyeOpen-1)/.27;
  const eye=box(145,190,465,535,x)*box(385-75*spread,435,730,790+50*spread,y)*edgeLock;
  const ex=x-330,ey=y-602;
  let px=x+(ex*(Math.cos(pose.eyeTilt)-1)-ey*Math.sin(pose.eyeTilt))*eye;
  let py=y+(ey*(pose.eyeOpen-1)+ex*Math.sin(pose.eyeTilt))*eye;
  const jaw=box(125,180,510,620,x)*box(745,845,1010,1100,y)*edgeLock;
  py+=pose.jaw*jaw;
  const corner=(1-pumpkinRamp(.3,1,Math.hypot((x-505)/105,(y-680)/100)))*edgeLock;
  py+=pose.corner*corner;
  const stem=(1-pumpkinRamp(275,360,y))*pumpkinRamp(290,370,x)*(1-pumpkinRamp(770,840,x));
  const sx=x-650,sy=y-328;
  px+=(sx*(Math.cos(pose.stem)-1)-sy*Math.sin(pose.stem))*stem;
  py+=(sx*Math.sin(pose.stem)+sy*(Math.cos(pose.stem)-1))*stem;
  const bx=px-660,by=py-1190;
  return [660+bx*Math.cos(pose.tilt)-by*Math.sin(pose.tilt)+64+pose.dx,1190+bx*Math.sin(pose.tilt)+by*Math.cos(pose.tilt)+64+pose.dy];
}

export function createPumpkinBossRig(image){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=1024;
  const probe=document.createElement('canvas');probe.width=image.naturalWidth||image.width;probe.height=image.naturalHeight||image.height;
  const pc=probe.getContext('2d',{willReadFrequently:true});pc.drawImage(image,0,0);
  const {data}=pc.getImageData(0,0,probe.width,probe.height),iw=probe.width,ih=probe.height;
  const left=new Int32Array(ih).fill(iw),right=new Int32Array(ih).fill(-1),top=new Int32Array(iw).fill(ih),bottom=new Int32Array(iw).fill(-1);
  for(let y=0;y<ih;y++)for(let x=0;x<iw;x++)if(data[(y*iw+x)*4+3]>128){left[y]=Math.min(left[y],x);right[y]=Math.max(right[y],x);top[x]=Math.min(top[x],y);bottom[x]=Math.max(bottom[x],y);}
  function lock(u,v){
    const x=Math.min(iw-1,Math.max(0,Math.round(u*(iw-1)))),y=Math.min(ih-1,Math.max(0,Math.round(v*(ih-1))));
    const distance=Math.min(x-left[y],right[y]-x,y-top[x],bottom[x]-y);
    return pumpkinRamp(0,48,distance);
  }
  const gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:true,preserveDrawingBuffer:true,antialias:true});
  if(!gl)return createPumpkinCanvasRig(canvas,image,lock);
  const vertex=`attribute vec3 mesh;varying vec2 tex;
uniform vec4 movement;uniform vec4 face;uniform float corner;
float ramp(float a,float b,float v){return smoothstep(a,b,v);}
float box(float a,float b,float c,float d,float v){return ramp(a,b,v)*(1.-ramp(c,d,v));}
void main(){tex=mesh.xy;vec2 s=tex*1280.;vec2 p=s;
 float spread=max(0.,face.x-1.)/.27;
 float eye=box(145.,190.,465.,535.,s.x)*box(385.-75.*spread,435.,730.,790.+50.*spread,s.y)*mesh.z;
 vec2 e=s-vec2(330.,602.);
 p.x+=(e.x*(cos(face.y)-1.)-e.y*sin(face.y))*eye;
 p.y+=(e.y*(face.x-1.)+e.x*sin(face.y))*eye;
 float jaw=box(125.,180.,510.,620.,s.x)*box(745.,845.,1010.,1100.,s.y)*mesh.z;
 p.y+=face.z*jaw;
 p.y+=corner*(1.-ramp(.3,1.,length((s-vec2(505.,680.))/vec2(105.,100.))))*mesh.z;
 float stem=(1.-ramp(275.,360.,s.y))*ramp(290.,370.,s.x)*(1.-ramp(770.,840.,s.x));
 vec2 stalk=s-vec2(650.,328.);
 p.x+=(stalk.x*(cos(movement.w)-1.)-stalk.y*sin(movement.w))*stem;
 p.y+=(stalk.x*sin(movement.w)+stalk.y*(cos(movement.w)-1.))*stem;
 vec2 b=p-vec2(660.,1190.);
 p=vec2(b.x*cos(movement.z)-b.y*sin(movement.z),b.x*sin(movement.z)+b.y*cos(movement.z))+vec2(724.,1254.)+movement.xy;
 gl_Position=vec4(p.x/704.-1.,1.-p.y/704.,0.,1.);
}`;
  const fragment=`precision mediump float;varying vec2 tex;uniform sampler2D art;uniform float glow;uniform float heat;uniform float extinction;
void main(){vec4 color=texture2D(art,tex);vec2 s=tex*1280.;
 float region=smoothstep(115.,150.,s.x)*(1.-smoothstep(525.,580.,s.x))*smoothstep(410.,450.,s.y)*(1.-smoothstep(1030.,1090.,s.y));
 float light=region*smoothstep(.57,.84,color.g)*smoothstep(.2,.5,color.r-color.b);
 vec3 lit=color.rgb*(1.+(glow-1.)*light);lit=mix(lit,lit*vec3(1.06,.88,.72),heat*light);
 float extinguished=region*smoothstep(.50,.76,color.g)*smoothstep(.2,.5,color.r-color.b)*extinction;
 lit=mix(lit,vec3(.055,.028,.044)*color.a+color.rgb*.025,extinguished);
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
  const uniforms=Object.fromEntries(['movement','face','corner','glow','heat','extinction'].map(name=>[name,gl.getUniformLocation(program,name)]));
  gl.viewport(0,0,1024,1024);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.clearColor(0,0,0,0);
  return {backend:'webgl',render(state,time,poseOverride=null){
    const p=poseOverride??pumpkinBossPose(state,time);gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform4f(uniforms.movement,p.dx,p.dy,p.tilt,p.stem);gl.uniform4f(uniforms.face,p.eyeOpen,p.eyeTilt,p.jaw,0);
    gl.uniform1f(uniforms.corner,p.corner);gl.uniform1f(uniforms.glow,p.glow);gl.uniform1f(uniforms.heat,p.heat);
    gl.uniform1f(uniforms.extinction,p.extinction);
    gl.drawArrays(gl.TRIANGLES,0,vertices.length/3);return canvas;
  }};
}

// A continuous triangle mesh also works without WebGL. It uses the same
// original art, coordinates, expressions and fixed dimensions.
function createPumpkinCanvasRig(canvas,image,lock){
  const c=canvas.getContext('2d'),n=24,step=1280/n,points=[];
  const lighting=document.createElement('canvas');lighting.width=image.naturalWidth||image.width;lighting.height=image.naturalHeight||image.height;
  const lc=lighting.getContext('2d');lc.drawImage(image,0,0);
  const overlay=document.createElement('canvas');overlay.width=lighting.width;overlay.height=lighting.height;
  const oc=overlay.getContext('2d'),pixels=lc.getImageData(0,0,lighting.width,lighting.height);
  for(let y=0;y<lighting.height;y++)for(let x=0;x<lighting.width;x++){
    const i=(y*lighting.width+x)*4,r=pixels.data[i]/255,g=pixels.data[i+1]/255,b=pixels.data[i+2]/255;
    const sx=x/lighting.width*1280,sy=y/lighting.height*1280;
    const region=pumpkinRamp(115,150,sx)*(1-pumpkinRamp(525,580,sx))*pumpkinRamp(410,450,sy)*(1-pumpkinRamp(1030,1090,sy));
    const mask=region*pumpkinRamp(.5,.76,g)*pumpkinRamp(.2,.5,r-b);
    pixels.data[i]=255*(.055+r*.025);pixels.data[i+1]=255*(.028+g*.025);pixels.data[i+2]=255*(.044+b*.025);pixels.data[i+3]*=mask;
  }
  oc.putImageData(pixels,0,0);
  for(let y=0;y<=n;y++)for(let x=0;x<=n;x++)points.push({x:x*step,y:y*step,lock:lock(x/n,y/n)});
  const triangles=[];
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){const a=y*(n+1)+x,b=a+1,d=a+n+1,e=d+1;triangles.push([a,b,d],[d,b,e]);}
  return {backend:'canvas',render(state,time,poseOverride=null){
    const pose=poseOverride??pumpkinBossPose(state,time),dest=points.map(p=>pumpkinBossVertex(p.x,p.y,p.lock,pose));
    let source=image;
    if(pose.extinction>0){lc.clearRect(0,0,lighting.width,lighting.height);lc.drawImage(image,0,0);lc.globalAlpha=pose.extinction;lc.drawImage(overlay,0,0);lc.globalAlpha=1;source=lighting;}
    c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,1024,1024);c.setTransform(1024/1408,0,0,1024/1408,0,0);
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
