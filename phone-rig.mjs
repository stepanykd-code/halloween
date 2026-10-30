// Each phone is on one stationary body plate. One complete forearm rotates
// around an overlapping elbow; no rectangular patches move on the torso.
export const PHONE_RIGS=Object.freeze({
slavik:Object.freeze({
  panelWidth:768,panelHeight:1024,scale:436/940,x:192.5-433.5*(436/940),y:49-29*(436/940),lowerStart:289,
  bodyCrop:[284,26,376,946],headWidth:245,bodyPivot:[383,427],armPivot:[265,530],
  armCrop:[192,411,357,202],armScale:.74,baseAngle:0,maxAngle:.065,strokeMs:950
}),
dasha:Object.freeze({
  panelWidth:768,panelHeight:1024,scale:436/963,x:185.5-393.5*(436/963),y:47-21*(436/963),lowerStart:301,
  bodyCrop:[177,18,461,969],headWidth:245,bodyPivot:[401,400],armPivot:[344,428],
  armCrop:[276,281,389,220],armScale:.568,baseAngle:-.108,maxAngle:.065,strokeMs:950,
  armImage:'dasha-phone-arm-full-rig.png',armAxis:[317,-144],armWidthScale:1.22,armJointWidthScale:1.22,
  armWidthStart:20,armWidthEnd:90
}),
katya:Object.freeze({
  panelWidth:768,panelHeight:1024,scale:436/979,x:-16,y:44-16*(436/979),lowerStart:335,
  bodyCrop:[0,0,768,1024],headWidth:384,bodyPivot:[426,438],armPivot:[264,449],
  armCrop:[216,333,228,167],armScale:1,baseAngle:0,maxAngle:.065,strokeMs:950
})
});
export const KATYA_PHONE_RIG=PHONE_RIGS.katya;

export function phoneArmAngle(player){
  if(player.phoneTime<=1250)return 0;
  const config=PHONE_RIGS[player.character]??KATYA_PHONE_RIG;
  const cycle=(player.phoneTime-1250)/config.strokeMs;
  let angle=config.maxAngle*(1-Math.cos(cycle*Math.PI*2))/2;
  if(player.phoneReturning){
    const age=Math.max(0,player.phoneTime-player.phoneDuration+640);
    const t=Math.min(1,age/180);
    angle*=1-t*t*(3-2*t);
  }
  return angle;
}

// Stretch across the forearm axis only, including the elbow overlap.
// The joint centre, fingertip and all longitudinal coordinates stay fixed.
export function phoneArmWidthAt(config,along){
  const t=Math.max(0,Math.min(1,(along-config.armWidthStart)/(config.armWidthEnd-config.armWidthStart)));
  const joint=config.armJointWidthScale??1;
  return joint+((config.armWidthScale??1)-joint)*t*t*(3-2*t);
}
export function widenPhoneArmPoint(config,x,y){
  const [vx,vy]=config.armAxis,span=Math.hypot(vx,vy),ux=vx/span,uy=vy/span;
  const dx=x-config.armPivot[0],dy=y-config.armPivot[1];
  const along=dx*ux+dy*uy,across=-dx*uy+dy*ux;
  const width=phoneArmWidthAt(config,along);
  return [config.armPivot[0]+along*ux-across*width*uy,
    config.armPivot[1]+along*uy+across*width*ux];
}
function createWiderArm(config,image){
  if(!(config.armWidthScale>1))return null;
  const [ax,ay,aw,ah]=config.armCrop,[px,py]=config.armPivot;
  const angle=Math.atan2(config.armAxis[1],config.armAxis[0]),c=Math.cos(angle),s=Math.sin(angle);
  const corners=[[ax,ay],[ax+aw,ay],[ax,ay+ah],[ax+aw,ay+ah]];
  const along=corners.map(([x,y])=>(x-px)*c+(y-py)*s);
  const across=corners.map(([x,y])=>-(x-px)*s+(y-py)*c);
  const start=Math.floor(Math.min(...along))-2,end=Math.ceil(Math.max(...along))+2;
  const radius=Math.ceil(Math.max(...across.map(Math.abs)))+2;
  const outRadius=Math.ceil(radius*Math.max(config.armWidthScale,config.armJointWidthScale??1))+2,density=3;
  const source=document.createElement('canvas');source.width=(end-start)*density;source.height=radius*2*density;
  const src=source.getContext('2d');src.scale(density,density);src.translate(-start,radius);src.rotate(-angle);
  src.drawImage(image,config.panelWidth+ax,ay,aw,ah,ax-px,ay-py,aw,ah);
  const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=outRadius*2*density;
  const out=canvas.getContext('2d');
  // Contiguous columns share the same longitudinal coordinates. The result
  // is baked once into one intact arm texture, then rotated as one piece.
  for(let i=0;i<source.width;i++){
    const width=phoneArmWidthAt(config,start+(i+.5)/density);
    out.drawImage(source,i,0,1,source.height,i,(outRadius-radius*width)*density,1,source.height*width);
  }
  return {canvas,angle,x:start,y:-outRadius,width:end-start,height:outRadius*2};
}
export function createPhoneRig(character,layerSheet,phoneSheet,armSheet=layerSheet,widthOverride,jointWidthOverride){
  const original=PHONE_RIGS[character];
  const config={...original,...(widthOverride===undefined?{}:{armWidthScale:widthOverride}),
    ...(jointWidthOverride===undefined?{}:{armJointWidthScale:jointWidthOverride})};
  const plate=document.createElement('canvas');plate.width=384;plate.height=512;
  const base=plate.getContext('2d');
  // Exact original head (including phone gaze) and feet retain their size.
  base.drawImage(phoneSheet,0,512,config.headWidth,145,0,0,config.headWidth,145);
  // Reuse the clean held-phone lower body: an idle crop above row 335 would
  // also bring back the lowered hands as unwanted extra arms.
  base.drawImage(phoneSheet,0,512+config.lowerStart,384,512-config.lowerStart,0,config.lowerStart,384,512-config.lowerStart);
  base.save();base.beginPath();base.rect(0,145,384,config.lowerStart-145);
  if(config.headWidth<384)base.rect(245,120,139,25);
  base.clip();
  const [bx,by,bw,bh]=config.bodyCrop;
  base.drawImage(layerSheet,bx,by,bw,bh,
    config.x+bx*config.scale,config.y+by*config.scale,bw*config.scale,bh*config.scale);
  base.restore();
  const surface=document.createElement('canvas');surface.width=384;surface.height=512;
  const context=surface.getContext('2d');
  const pivotX=config.x+config.bodyPivot[0]*config.scale;
  const pivotY=config.y+config.bodyPivot[1]*config.scale;
  const widerArm=createWiderArm(config,armSheet);
  return {
    render(player){return this.renderAngle(phoneArmAngle(player));},
    renderAngle(angle){
      context.clearRect(0,0,384,512);context.drawImage(plate,0,0);
      context.save();
      if(widerArm){context.beginPath();context.rect(0,145,384,config.lowerStart-145);context.clip();}
      context.translate(pivotX,pivotY);context.rotate(config.baseAngle+angle);
      context.scale(config.scale*config.armScale,config.scale*config.armScale);
      // Sample only this layer's actual bounds. The sheet's unused transparent
      // area can contain faint export pixels and must not cover the head/feet.
      if(widerArm){
        context.rotate(widerArm.angle);
        context.drawImage(widerArm.canvas,widerArm.x,widerArm.y,widerArm.width,widerArm.height);
      }else{
        const [ax,ay,aw,ah]=config.armCrop;
        context.drawImage(armSheet,config.panelWidth+ax,ay,aw,ah,
          ax-config.armPivot[0],ay-config.armPivot[1],aw,ah);
      }
      context.restore();return surface;
    }
  };
}
export function createKatyaPhoneRig(layerSheet,phoneSheet){return createPhoneRig('katya',layerSheet,phoneSheet);}
