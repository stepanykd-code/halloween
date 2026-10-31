import {slavikAbilityPose,drawAbilityIndex} from './slavik-ability.mjs';
export const GIRLS_ABILITY=Object.freeze({
 dasha:{name:'Даша',scale:.91,shoulder:[162,175],finger:[0,-6],panel:[195,163,8,140,114,163,74,140],coat:[[162,161],[185,167],[188,300],[115,300],[118,281],[125,255],[131,224],[138,192],[146,169]],pants:[[157,296],[185,296],[180,337],[153,337]],pantsSource:[179,299,12,40,151,299,34,40],arm:[[156,150],[174,153],[184,172],[181,201],[177,225],[174,253],[173,282],[172,303],[166,320],[143,320],[135,313],[134,290],[124,283],[122,258],[125,233],[128,210],[132,187],[139,166]],circle:[350,185],color:'#cd99ff',accent:'#f0d4ff'},
 katya:{name:'Катя',scale:.82,shoulder:[155,180],finger:[-8,-8],panel:[181,166,8,116,143,166,44,116],coat:[[153,161],[180,170],[187,280],[142,280],[143,211]],pants:[[153,273],[180,273],[179,342],[144,342],[146,330],[149,314],[152,292]],pantsSource:[174,280,12,58,140,280,42,58],arm:[[149,156],[168,158],[181,173],[179,195],[173,217],[169,244],[168,274],[166,286],[166,306],[160,322],[137,322],[127,315],[124,295],[120,279],[118,257],[119,236],[121,214],[124,193],[134,169]],circle:[335,182],color:'#ffce75',accent:'#ff86c3'}
});
function girlsPath(c,points){c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.closePath();}
export function girlsAbilityPose(time,id){
 const pose=slavikAbilityPose(time),t=((time%4.4)+4.4)%4.4;
 if(id!=='katya')return pose;
 const ease=value=>{const x=Math.max(0,Math.min(1,value));return Math.max(0,Math.min(1,x*x*x*(x*(x*6-15)+10)));};
 if(t<1.1){pose.reach=ease((t-.1)/.45);pose.angle=-Math.PI/2*pose.reach;}
 if(t<1.4)pose.ring=ease((t-.55)/.3);
 return pose;
}
function createKatyaShoulderRig(arm,shoulder){
 const canvas=document.createElement('canvas');canvas.width=384;canvas.height=512;
 const gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:true,preserveDrawingBuffer:true});
 if(!gl){const c=canvas.getContext('2d');return {render(angle){c.clearRect(0,0,384,512);c.save();c.translate(...shoulder);c.rotate(angle);c.drawImage(arm,-shoulder[0],-shoulder[1]);c.restore();return canvas;}};}
 // Keep the cap seam beside the hood almost fixed. Blend rotation through
 // the padded upper sleeve; the forearm, hand and fingertips stay rigid.
 const vs=`attribute vec2 uv;varying vec2 tex;uniform float angle;uniform vec2 shoulder;
 void main(){tex=uv;vec2 p=uv*vec2(384.,512.);float a=angle*smoothstep(150.,220.,p.y);float c=cos(a),s=sin(a);p=shoulder+mat2(c,s,-s,c)*(p-shoulder);gl_Position=vec4(p.x/192.-1.,1.-p.y/256.,0.,1.);}`;
 const fs=`precision mediump float;varying vec2 tex;uniform sampler2D art;void main(){gl_FragColor=texture2D(art,tex);}`;
 function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
 const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vs));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
 const vertices=[];for(let y=0;y<64;y++)for(let x=0;x<24;x++){const a=x/24,b=(x+1)/24,c=y/64,d=(y+1)/64;vertices.push(a,c,b,c,a,d,a,d,b,c,b,d);}
 gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);const uv=gl.getAttribLocation(program,'uv');gl.enableVertexAttribArray(uv);gl.vertexAttribPointer(uv,2,gl.FLOAT,false,0,0);
 gl.bindTexture(gl.TEXTURE_2D,gl.createTexture());gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);for(const axis of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,axis,gl.CLAMP_TO_EDGE);for(const filter of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,filter,gl.LINEAR);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,arm);gl.uniform1i(gl.getUniformLocation(program,'art'),0);gl.uniform2f(gl.getUniformLocation(program,'shoulder'),...shoulder);
 const angleUniform=gl.getUniformLocation(program,'angle');gl.viewport(0,0,384,512);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.clearColor(0,0,0,0);
 return {render(angle){gl.clear(gl.COLOR_BUFFER_BIT);gl.uniform1f(angleUniform,angle);gl.drawArrays(gl.TRIANGLES,0,vertices.length/2);return canvas;}};
}
const girlsArmContours={
 dasha:'M151 151 C161 146 174 149 180 158 C184 166 184 175 183 181 C181 187 180 193 179 201 C178 208 177 213 176 221 C175 229 174 234 173 241 C172 249 173 258 172 267 C172 274 172 279 168 283 L167 287 L163 288 C166 294 169 300 169 305 C169 310 165 314 164 316 C163 319 160 321 157 321 C153 320 151 318 149 317 C145 315 140 311 139 307 C137 302 139 294 139 288 L136 287 L135 283 C129 282 127 280 126 277 C123 271 124 262 124 257 C125 250 127 245 126 240 C125 234 127 228 128 224 C129 220 128 216 129 211 C130 203 133 198 134 193 C135 188 135 183 137 177 C139 166 143 156 151 151 Z',
 katya:'M151 158 C157 153 166 152 172 157 C178 162 182 168 183 175 C183 182 181 188 179 192 C179 197 177 201 176 205 C175 211 174 216 170 220 C171 224 170 229 169 233 C167 237 165 239 166 243 C168 248 167 252 165 257 C164 262 166 266 165 270 C164 274 162 275 160 277 L159 282 L157 284 C159 289 162 293 163 299 C164 306 163 310 159 313 C157 314 158 317 155 320 C152 323 148 323 145 320 C141 319 137 316 134 313 C130 311 129 308 129 303 C128 297 130 290 131 284 L127 283 L126 276 C122 274 121 272 121 268 C120 263 122 259 121 256 C119 250 120 242 121 238 C122 234 122 233 121 229 C120 224 122 217 124 213 C125 210 124 207 126 202 C129 196 130 192 132 189 C135 183 137 171 141 167 C144 163 147 160 151 158 Z'
};
export function createGirlsAbilityRig(image,id){
 const cfg=GIRLS_ABILITY[id];
 function layer(){const canvas=document.createElement('canvas');canvas.width=384;canvas.height=512;return [canvas,canvas.getContext('2d')];}
 // Trace the original dark sleeve seam and cuff, including their quilted
 // scallops. Keep the original painted edge instead of adding a new stroke.
 const [arm,a]=layer(),contour=new Path2D(girlsArmContours[id]);a.clip(contour);a.drawImage(image,0,0,384,512,0,0,384,512);
 const [body,b]=layer();
 if(id==='dasha'){
  // A body eraser includes the old sleeve ink; the moving limb still uses
  // the precise original contour above. No arm-outline ghost stays behind.
  const [cut,k]=layer();k.fillStyle='#fff';k.strokeStyle='#fff';k.lineWidth=4;k.lineJoin='round';k.fill(contour);k.stroke(contour);
  b.save();b.beginPath();b.moveTo(154,142);b.bezierCurveTo(146,144,142,157,140,170);b.bezierCurveTo(138,180,134,187,133,198);
  b.bezierCurveTo(129,204,129,210,131,216);b.bezierCurveTo(128,222,127,226,130,231);b.bezierCurveTo(126,236,125,242,128,247);b.bezierCurveTo(123,252,121,259,124,264);b.bezierCurveTo(120,270,118,275,121,280);b.bezierCurveTo(117,286,115,292,117,296);b.quadraticCurveTo(117,302,125,302);b.lineTo(190,302);b.lineTo(190,142);b.closePath();b.clip();
  // The repair reaches ABOVE the pivot. The old plate began at y=161,
  // leaving the exposed shoulder socket transparent during rotation.
  b.drawImage(image,154,164,18,28,130,140,61,38);
  b.drawImage(image,195,178,8,125,112,178,79,125);
  const side=b.createLinearGradient(118,0,177,0);side.addColorStop(0,'rgba(101,13,51,.24)');side.addColorStop(.65,'rgba(101,13,51,.05)');side.addColorStop(1,'rgba(101,13,51,0)');b.fillStyle=side;b.fillRect(112,146,79,157);b.restore();
  b.save();b.beginPath();girlsPath(b,cfg.pants);b.clip();b.drawImage(image,...cfg.pantsSource);b.restore();
  b.globalCompositeOperation='destination-in';b.drawImage(cut,0,0);
  const [fixed,f]=layer();f.drawImage(image,0,0,384,512,0,0,384,512);f.globalCompositeOperation='destination-out';f.drawImage(cut,0,0);
  b.globalCompositeOperation='destination-over';b.drawImage(fixed,0,0);b.globalCompositeOperation='source-over';
 }else{
  const [cut,k]=layer();k.fillStyle='#fff';k.strokeStyle='#fff';k.lineWidth=4;k.lineJoin='round';k.fill(contour);k.stroke(contour);
  // The original near leg reappears at x=151 under the hand. Match that
  // edge instead of the old x=144 rectangle protruding from the hip.
  b.save();b.beginPath();b.moveTo(155,277);b.lineTo(185,277);b.lineTo(185,343);b.lineTo(150,343);b.bezierCurveTo(152,334,152,329,151,324);b.bezierCurveTo(151,311,153,292,155,277);b.closePath();b.clip();b.drawImage(image,175,279,16,65,149,279,37,65);b.restore();
  b.save();b.beginPath();b.moveTo(151,145);b.bezierCurveTo(143,148,140,159,139,172);b.bezierCurveTo(136,185,136,198,134,207);
  b.bezierCurveTo(132,214,132,221,134,227);b.bezierCurveTo(131,235,132,243,134,248);b.bezierCurveTo(132,256,133,267,138,273);b.quadraticCurveTo(139,278,147,279);b.lineTo(190,279);b.lineTo(190,145);b.closePath();b.clip();
  // Fill the shoulder above the pivot with the existing pale sleeve cloth;
  // leave the original hair, hood, face and jacket front on the fixed plate.
  b.drawImage(image,148,169,16,26,132,143,59,35);
  b.drawImage(image,181,178,8,102,131,178,60,102);
  const side=b.createLinearGradient(133,0,178,0);side.addColorStop(0,'rgba(159,72,88,.16)');side.addColorStop(.6,'rgba(159,72,88,.04)');side.addColorStop(1,'rgba(159,72,88,0)');b.fillStyle=side;b.fillRect(131,143,60,137);b.restore();
  b.globalCompositeOperation='destination-in';b.drawImage(cut,0,0);
  const [fixed,f]=layer();f.drawImage(image,0,0,384,512,0,0,384,512);f.globalCompositeOperation='destination-out';f.drawImage(cut,0,0);
  b.globalCompositeOperation='destination-over';b.drawImage(fixed,0,0);b.globalCompositeOperation='source-over';
 }
 const shoulderRig=id==='katya'?createKatyaShoulderRig(arm,cfg.shoulder):null;
 return {draw(c,time){const pose=girlsAbilityPose(time,id);if(pose.reach<1e-8)c.drawImage(image,0,0,384,512,0,0,384,512);else{c.drawImage(body,0,0);if(shoulderRig)c.drawImage(shoulderRig.render(pose.angle),0,0);c.save();c.translate(...cfg.shoulder);c.rotate(pose.angle);if(!shoulderRig)c.drawImage(arm,-cfg.shoulder[0],-cfg.shoulder[1]);c.translate(-cfg.shoulder[0]+cfg.finger[0],-cfg.shoulder[1]+cfg.finger[1]);drawAbilityIndex(c,pose.reach);c.restore();}return pose;}};
}
export function drawGirlsCircle(c,time,opacity,id){
 if(opacity<=0)return;const cfg=GIRLS_ABILITY[id];c.save();c.translate(...cfg.circle);c.globalAlpha=opacity;c.scale(.32,1);c.shadowColor=cfg.color;c.shadowBlur=14;c.strokeStyle=cfg.color;c.lineWidth=2.5;
 for(const r of [66,75]){c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.stroke();}
 c.save();c.rotate(time*(id==='dasha'?.25:-.22));c.strokeStyle=cfg.accent;c.lineWidth=1.5;
 if(id==='dasha')for(let i=0;i<5;i++){c.save();c.rotate(i*Math.PI*2/5);c.beginPath();c.ellipse(0,-44,15,22,0,0,Math.PI*2);c.stroke();c.restore();}
 else for(let i=0;i<8;i++){c.save();c.rotate(i*Math.PI/4);c.beginPath();c.moveTo(-5,-55);c.lineTo(0,-65);c.lineTo(5,-55);c.stroke();c.restore();}
 c.restore();c.strokeStyle=cfg.accent;c.fillStyle=cfg.accent;c.lineWidth=2;
 if(id==='dasha'){
  for(const [x,y,r] of [[-18,-13,6],[-7,-22,6],[7,-22,6],[18,-13,6]]){c.beginPath();c.ellipse(x,y,r,r*1.25,0,0,Math.PI*2);c.stroke();}
  c.beginPath();c.moveTo(0,-6);c.bezierCurveTo(-8,-6,-22,13,-15,19);c.bezierCurveTo(-10,24,-4,18,0,18);c.bezierCurveTo(4,18,10,24,15,19);c.bezierCurveTo(22,13,8,-6,0,-6);c.stroke();
 }else{
  c.beginPath();c.moveTo(-27,-9);c.lineTo(-25,-32);c.lineTo(-11,-24);c.quadraticCurveTo(0,-29,11,-24);c.lineTo(25,-32);c.lineTo(27,-9);c.quadraticCurveTo(26,16,0,30);c.quadraticCurveTo(-26,16,-27,-9);c.stroke();
  c.beginPath();c.moveTo(-20,-8);c.quadraticCurveTo(-11,-12,-5,-3);c.moveTo(20,-8);c.quadraticCurveTo(11,-12,5,-3);c.moveTo(-5,9);c.lineTo(0,14);c.lineTo(5,9);c.closePath();c.moveTo(0,14);c.lineTo(0,20);c.stroke();
 }
 c.restore();
}
