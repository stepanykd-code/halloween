export const PARALLAX_LAYERS=Object.freeze([
  {id:'far',image:'poltava-far',speed:.14,y:-110},
  {id:'middle',image:'poltava-middle',speed:.5,y:-40},
  {id:'ground',image:'poltava-ground',speed:1,y:0}
]);
export const POLTAVA_LANDMARKS=Object.freeze([
  {id:'glory',name:'Корпусний сад · Монумент Слави',worldX:3000,source:[0,0,728,565],anchorY:554,width:760,baseline:630},
  {id:'museum',name:'Краєзнавчий музей',worldX:6500,source:[728,0,944,565],anchorY:554,width:980,baseline:635},
  {id:'homestead',name:'Садиба Івана Котляревського',worldX:10300,source:[0,565,836,376],anchorY:342,width:980,baseline:635},
  {id:'arbor',name:'Біла альтанка',worldX:14000,source:[836,565,836,376],anchorY:364,width:1040,baseline:635}
]);

export function cameraLeft(playerX,viewWidth,worldWidth){
  return Math.max(0,Math.min(playerX-viewWidth/2,Math.max(0,worldWidth-viewWidth)));
}
export function parallaxTiles(cameraX,visibleWidth,tileWidth,speed,overlap=48){
  const stride=tileWidth-overlap;
  if(stride<=0)throw new RangeError('Parallax tile is narrower than its overlap.');
  const start=Math.floor(cameraX*speed/stride)-1;
  const end=Math.ceil((cameraX*speed+visibleWidth)/stride);
  return Array.from({length:end-start+1},(_,n)=>(start+n)*stride+cameraX*(1-speed));
}
export function landmarkPlacement(landmark,atlasWidth,atlasHeight,screenWidth=1600){
  const [sx,sy,w,h]=landmark.source,height=landmark.width*h/w;
  if(sx+w>atlasWidth||sy+h>atlasHeight)throw new RangeError('Landmark crop exceeds the atlas.');
  return {
    source:landmark.source,
    destination:[landmark.worldX*.5+screenWidth*.25-landmark.width/2,landmark.baseline-landmark.anchorY*landmark.width/w,landmark.width,height]
  };
}

export const BATS_PER_LANDMARK=7;
const BAT_ROUTES=[[-170,-10,.62,.1],[-110,22,.78,2.1],[-35,-26,.51,4.7],[55,8,.91,1.2],[125,-18,.69,5.55],[175,18,.57,3.4],[15,30,.83,.5]];
export function moonPlacement(cameraX,visibleWidth,cameraY=0){
  const size=300;
  // One celestial body, separate from the repeating cloud tiles.
  const center=Math.max(size/2+24,Math.min(visibleWidth-size/2-24,visibleWidth*.76-cameraX*.018));
  return {x:cameraX+center-size/2,y:Math.max(190,cameraY+154)-size/2,size};
}
export function landmarkBatPose(landmark,index,time,cameraX,cameraY=0,reducedMotion=false){
  const t=reducedMotion?0:time;
  const [slotX,slotY,speed,offset]=BAT_ROUTES[index];
  const phase=t*speed+offset+landmark.worldX*.001;
  const angle=t*(10.2+index*.39)+index*1.7;
  const [,roofTop]=landmarkPlacement(landmark,1672,941).destination;
  const centerY=Math.max(cameraY+45,roofTop-50);
  return {
    x:landmark.worldX*.5+400+cameraX*.5+slotX+Math.cos(phase)*(34+index*3),
    y:Math.max(cameraY+30,centerY+slotY+Math.sin(phase*1.37+index)*22),
    scale:.68+index*.075,flap:Math.sin(angle),facing:Math.sin(phase)>0?-1:1,
    tilt:Math.cos(phase*1.37+index)*.12
  };
}
function drawFlyingBat(context,pose){
  context.save();context.translate(pose.x,pose.y);context.rotate(pose.tilt);context.scale(pose.scale*pose.facing,pose.scale);
  context.fillStyle='#100d23';context.strokeStyle='#514064';context.lineWidth=.75;
  const tip=-5-pose.flap*13;
  context.beginPath();context.moveTo(0,1);
  for(const side of [-1,1]){
    context.moveTo(0,1);
    context.quadraticCurveTo(side*11,-7,side*26,tip);
    context.quadraticCurveTo(side*25,tip+13,side*19,10);
    context.quadraticCurveTo(side*14,5,side*12,13);
    context.quadraticCurveTo(side*7,9,side*4,14);
    context.lineTo(0,7);context.closePath();
  }
  context.fill();context.stroke();
  context.beginPath();context.ellipse(0,3,3.5,8,0,0,Math.PI*2);context.fill();
  context.beginPath();context.moveTo(-3,-1);context.lineTo(-4,-9);context.lineTo(0,-5);context.lineTo(4,-9);context.lineTo(3,-1);context.fill();
  context.restore();
}

export function createPoltavaBackground(images){
  // Fade only the incoming tile edge. The preceding opaque tile stays below it.
  const textures=PARALLAX_LAYERS.map(layer=>{
    const image=images[layer.image],texture=document.createElement('canvas');
    texture.width=image.naturalWidth;texture.height=image.naturalHeight;
    const c=texture.getContext('2d');c.drawImage(image,0,0);
    const fade=c.createLinearGradient(0,0,48*texture.height/900,0);
    fade.addColorStop(0,'rgba(255,255,255,0)');fade.addColorStop(1,'rgba(255,255,255,1)');
    c.globalCompositeOperation='destination-in';c.fillStyle=fade;c.fillRect(0,0,texture.width,texture.height);
    return {layer,texture,width:texture.width*900/texture.height};
  });
  return {draw(context,cameraX,visibleWidth,{time=0,cameraY=0,reducedMotion=false}={}){
    const visibleFlocks=[];
    context.fillStyle='#111b48';context.fillRect(cameraX,0,visibleWidth,900);
    for(const {layer,texture,width} of textures){
      for(const x of parallaxTiles(cameraX,visibleWidth,width,layer.speed))context.drawImage(texture,x,layer.y,width,900);
      if(layer.id==='far'){
        const moon=moonPlacement(cameraX,visibleWidth,cameraY);
        context.drawImage(images['poltava-moon'],moon.x,moon.y,moon.size,moon.size);
      }
      if(layer.id==='middle'){
        for(const landmark of POLTAVA_LANDMARKS){
          const atlas=images['poltava-landmarks'];
          const {source,destination}=landmarkPlacement(landmark,atlas.naturalWidth,atlas.naturalHeight);
          const [x,y,w,h]=destination,screenX=x-cameraX*.5;
          if(screenX+w<0||screenX>visibleWidth)continue;
          context.drawImage(atlas,...source,x+cameraX*.5,y,w,h);
          visibleFlocks.push(landmark.id);
          for(let i=0;i<BATS_PER_LANDMARK;i++)drawFlyingBat(context,landmarkBatPose(landmark,i,time,cameraX,cameraY,reducedMotion));
        }
      }
    }
    return {visibleFlocks,batCount:visibleFlocks.length*BATS_PER_LANDMARK};
  }};
}
