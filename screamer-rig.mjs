export const SCREAMER_FLIGHT=Object.freeze({speed:340,waveHeight:14,wavePeriod:2.4,scale:.31,anchorX:522,anchorY:414,opacity:.36});
export function screamerWave(time){return Math.sin(time*Math.PI*2/SCREAMER_FLIGHT.wavePeriod)*SCREAMER_FLIGHT.waveHeight;}
export function createScreamerRig(image){
 const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=1152;
 const gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:true,preserveDrawingBuffer:true,antialias:true});
 if(!gl){const c=canvas.getContext('2d');c.globalAlpha=SCREAMER_FLIGHT.opacity;c.drawImage(image,32,64);return {render(){return canvas;}};}
 const vertex=`attribute vec2 uv;varying vec2 tex;uniform float time;
 void main(){tex=uv;vec2 p=uv*vec2(1536.,1024.)+vec2(32.,64.);
 float face=1.-smoothstep(.85,1.18,length((uv-vec2(.235,.34))/vec2(.115,.15)));
 float flexible=1.-face;
 float tail=smoothstep(.36,.96,uv.x)*flexible;
 p.y+=tail*(sin(time*2.7-uv.x*7.)*58.+sin(time*4.-uv.x*10.)*10.);
 p.x+=tail*sin(time*2.7-uv.x*7.+1.2)*10.;
 float hair=(1.-smoothstep(.16,.28,uv.y))*smoothstep(.10,.18,uv.x)*(1.-smoothstep(.58,.72,uv.x))*flexible;
 p.x+=hair*sin(time*3.1-uv.x*9.)*18.;
 p.y+=hair*sin(time*2.8-uv.x*8.+.8)*16.;
 float leftArm=(1.-smoothstep(.16,.31,uv.x))*smoothstep(.38,.47,uv.y)*(1.-smoothstep(.68,.79,uv.y))*flexible;
 float rightArm=(1.-smoothstep(.7,1.15,length((uv-vec2(.40,.66))/vec2(.16,.18))))*smoothstep(.46,.56,uv.y)*flexible;
 p.x+=leftArm*sin(time*2.5+.7)*16.+rightArm*sin(time*2.5+2.)*18.;
 p.y+=leftArm*sin(time*2.5)*24.+rightArm*sin(time*2.5+1.4)*26.;
 gl_Position=vec4(p.x/800.-1.,1.-p.y/576.,0.,1.);}`;
 const fragment=`precision mediump float;varying vec2 tex;uniform sampler2D art;uniform float opacity;void main(){gl_FragColor=texture2D(art,tex)*opacity;}`;
 function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
 const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
 const vertices=[];for(let y=0;y<32;y++)for(let x=0;x<48;x++){const a=x/48,b=(x+1)/48,c=y/32,d=(y+1)/32;vertices.push(a,c,b,c,a,d,a,d,b,c,b,d);}
 gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);const uv=gl.getAttribLocation(program,'uv');gl.enableVertexAttribArray(uv);gl.vertexAttribPointer(uv,2,gl.FLOAT,false,0,0);
 gl.bindTexture(gl.TEXTURE_2D,gl.createTexture());gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);for(const axis of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,axis,gl.CLAMP_TO_EDGE);for(const filter of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,filter,gl.LINEAR);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);gl.uniform1i(gl.getUniformLocation(program,'art'),0);
 gl.uniform1f(gl.getUniformLocation(program,'opacity'),SCREAMER_FLIGHT.opacity);
 const clock=gl.getUniformLocation(program,'time');gl.viewport(0,0,1600,1152);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.clearColor(0,0,0,0);
 return {render(time){gl.clear(gl.COLOR_BUFFER_BIT);gl.uniform1f(clock,time);gl.drawArrays(gl.TRIANGLES,0,vertices.length/2);return canvas;}};
}
